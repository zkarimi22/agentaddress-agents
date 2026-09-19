import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [command, suppliedFile] = process.argv.slice(2);
const file = resolve(suppliedFile || ".agentaddress-demo/address.json");
const allowed = ["create", "deliver", "resume", "verify"];
if (!allowed.includes(command)) throw new Error(`Use one of: ${allowed.join(", ")}`);

const log = (step, details = {}) => console.log(JSON.stringify({ at: new Date().toISOString(), pid: process.pid, step, ...details }));
async function json(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(35_000),
    headers: { "content-type": "application/json", ...options.headers },
  });
  return { response, body: await response.json() };
}
async function save(state) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

try {
  if (command === "create") {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    const handle = await open(file, "wx", 0o600);
    let created = false;
    try {
      const origin = new URL(process.env.AGENTADDRESS_URL || "https://agentaddress.dev").origin;
      const skill = await fetch(`${origin}/skill.md`, { signal: AbortSignal.timeout(15_000) });
      assert.equal(skill.status, 200);
      const instructions = await skill.text();
      for (const required of [`${origin}/api/v1/addresses`, "credentials.read_token", "next_cursor", "ack"]) assert.ok(instructions.includes(required));
      const trialId = randomUUID();
      const { response, body } = await json(`${origin}/api/v1/addresses`, {
        method: "POST", body: JSON.stringify({ name: "Two-run public example", task_id: trialId }),
      });
      assert.equal(response.status, 201);
      created = true;
      await handle.writeFile(`${JSON.stringify({ origin, trial_id: trialId, cursor: 0, creator_pid: process.pid,
        creation_response: body, resource: { id: body.address.id, token: body.credentials.read_token,
          inbox: body.endpoints.inbox_url, events: body.endpoints.events_url } }, null, 2)}\n`);
      log("created", { origin, credentials_saved: true, default_expiry: body.address.expiresAt ?? null });
    } finally {
      await handle.close();
      if (!created) await rm(file, { force: true });
    }
  } else {
    const state = JSON.parse(await readFile(file, "utf8"));
    assert.ok(state.resource.token && state.resource.inbox && state.resource.events);
    const auth = { authorization: `Bearer ${state.resource.token}` };
    if (command === "deliver") {
      const { response, body } = await json(state.resource.inbox, { method: "POST",
        headers: { "idempotency-key": `${state.trial_id}:callback` },
        body: JSON.stringify({ type: "demo.callback", source: "public-two-run-example",
          data: { trial_id: state.trial_id, result: "ready" } }) });
      assert.ok([200, 202].includes(response.status));
      if (state.delivered_event) assert.equal(body.event.id, state.delivered_event);
      state.delivered_event = body.event.id;
      await save(state);
      log("delivered", { status: response.status, duplicate: body.duplicate, sequence: body.event.sequence });
    } else if (command === "resume") {
      const { response, body } = await json(`${state.resource.events}?after=${state.cursor}&wait=1`, { headers: auth });
      assert.equal(response.status, 200);
      let processed = 0;
      for (const event of body.events) {
        assert.equal(event.type, "demo.callback");
        assert.equal(event.data.trial_id, state.trial_id);
        const acknowledged = await json(`${state.resource.events}/${event.id}/ack`, { method: "POST", headers: auth });
        assert.equal(acknowledged.response.status, 200);
        state.cursor = event.sequence;
        await save(state);
        processed += 1;
      }
      log("resumed", { processed, next_cursor: state.cursor, credentials_restored: true, creator_pid: state.creator_pid });
    } else {
      const history = await json(`${state.resource.events}?after=0&wait=0`, { headers: auth });
      assert.equal(history.response.status, 200);
      assert.equal(history.body.events.length, 1);
      assert.ok(history.body.events[0].acknowledged_at);
      const repeatedAck = await json(`${state.resource.events}/${history.body.events[0].id}/ack`, { method: "POST", headers: auth });
      assert.equal(repeatedAck.response.status, 200);
      const empty = await json(`${state.resource.events}?after=${state.cursor}&wait=0`, { headers: auth });
      assert.equal(empty.body.events.length, 0);
      const unauthorized = await json(state.resource.events, { headers: { authorization: "Bearer invalid-demo-token" } });
      assert.equal(unauthorized.response.status, 401);
      const oversized = await json(state.resource.inbox, { method: "POST", body: JSON.stringify({ data: "x".repeat(1_000_001) }) });
      assert.equal(oversized.response.status, 413);
      log("verified", { retained_events: 1, acknowledgement_retry_succeeds: true,
        saved_cursor_excludes_handled_event: true, invalid_token_status: 401, oversized_status: 413 });
    }
  }
} catch (error) {
  console.error(JSON.stringify({ step: "failed", category: error.code || error.name || "Error",
    note: "No response bodies or credentials logged. Check the command, network, service, and private state file." }));
  process.exitCode = 1;
}
