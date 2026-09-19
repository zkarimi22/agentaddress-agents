import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { chmod, mkdir, open, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const helper = fileURLToPath(new URL("../../skills/agentaddress/scripts/agentaddress.mjs", import.meta.url));
const exampleStateRoot = resolve(process.env.AGENTADDRESS_EXAMPLE_STATE_DIR || ".agentaddress-examples");

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function runHelper(args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [helper, ...args], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `Helper exited with code ${code}`));
      try {
        resolveRun(JSON.parse(stdout));
      } catch {
        reject(new Error("Helper returned invalid JSON."));
      }
    });
  });
}

async function loadState(file) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    assert.ok(info.isFile(), "Example state is not a regular file.");
    assert.equal(info.mode & 0o077, 0, "Example state must be owner-only.");
    return JSON.parse(await handle.readFile("utf8"));
  } finally {
    await handle.close();
  }
}

export async function runExample(config) {
  const [command] = process.argv.slice(2);
  const allowed = config.manualDelivery ? ["create", "resume"] : ["create", "deliver", "resume"];
  assert.ok(allowed.includes(command), `Use: node ${config.script} ${allowed.join("|")}`);

  await mkdir(exampleStateRoot, { recursive: true, mode: 0o700 });
  await chmod(exampleStateRoot, 0o700);
  const file = resolve(exampleStateRoot, `${config.slug}.json`);

  if (command === "create") {
    const handle = await open(file, "wx", 0o600);
    let saved = false;
    try {
      const task = `${config.slug}-${randomUUID()}`;
      const created = await runHelper(["create", task, String(config.expirySeconds)]);
      const state = { version: 1, task, email: created.email, inbox_url: created.inbox_url };
      await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`);
      await handle.sync();
      saved = true;
      print({
        example: config.slug,
        step: "created",
        task,
        email: created.email,
        inbox_url: created.inbox_url,
        next: config.createNext,
        expires_in_seconds: config.expirySeconds,
      });
    } finally {
      await handle.close();
      if (!saved) await rm(file, { force: true });
    }
    return;
  }

  const state = await loadState(file);
  if (command === "deliver") {
    const body = config.payload(state.task);
    const response = await fetch(state.inbox_url, {
      method: "POST",
      signal: AbortSignal.timeout(35_000),
      headers: {
        "content-type": "application/json",
        "idempotency-key": `${state.task}:${config.eventType}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    assert.ok([200, 202].includes(response.status), `Delivery failed with HTTP ${response.status}.`);
    print({
      example: config.slug,
      step: "delivered_after_creator_exit",
      status: response.status,
      duplicate: result.duplicate,
      sequence: result.event?.sequence,
      next: `node ${config.script} resume`,
    });
    return;
  }

  const polled = await runHelper(["poll", state.task, "0"]);
  const handled = [];
  for (const event of polled.events || []) {
    config.validate?.(event, state.task);
    const acknowledged = await runHelper(["ack", state.task, event.id]);
    handled.push({ event_id: acknowledged.event_id, sequence: acknowledged.sequence });
  }
  print({
    example: config.slug,
    step: "resumed_in_later_process",
    trust: polled.trust,
    safety: polled.safety,
    events: polled.events,
    handled,
    next_cursor: handled.at(-1)?.sequence ?? polled.current_cursor,
  });
}
