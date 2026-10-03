import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

function run(script, args, env) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve(script), ...args], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

for (const scenario of ["browser-verification", "document-request-reply", "email-approval"]) {
  test(`${scenario} creates, exits, and validates later inbound mail without acknowledging early`, async (context) => {
    const token = "private-inbound-example-token";
    const sender = "sender@example.test";
    let created;
    let deliver = false;
    let acknowledgements = 0;
    const server = createServer(async (request, response) => {
      for await (const _chunk of request) { /* consume request body */ }
      if (request.method === "POST" && request.url === "/api/v1/addresses") {
        response.writeHead(201, { "content-type": "application/json" });
        return response.end(JSON.stringify({
          address: { id: "addr_example", email: "example@example.test" },
          credentials: { read_token: token },
          endpoints: { inbox_url: `${origin}/api/v1/inbox/addr_example/write-only`, events_url: `${origin}/api/v1/addresses/addr_example/events` },
        }));
      }
      if (request.method === "GET" && request.url.startsWith("/api/v1/addresses/addr_example/events?")) {
        assert.equal(request.headers.authorization, `Bearer ${token}`);
        response.setHeader("content-type", "application/json");
        return response.end(JSON.stringify({ events: deliver ? [event] : [], next_cursor: deliver ? 1 : 0, has_more: false }));
      }
      if (request.method === "GET" && request.url === "/api/v1/addresses/addr_example/events/evt_example/attachments/att_example") {
        assert.equal(request.headers.authorization, `Bearer ${token}`);
        response.writeHead(200, { "content-type": "application/pdf" });
        return response.end("%PDFtest");
      }
      if (request.method === "POST" && request.url === "/api/v1/addresses/addr_example/events/evt_example/ack") {
        assert.equal(request.headers.authorization, `Bearer ${token}`);
        acknowledgements++;
        response.setHeader("content-type", "application/json");
        return response.end(JSON.stringify({ event: { id: "evt_example", sequence: 1, acknowledged_at: new Date().toISOString() } }));
      }
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: "not_found" } }));
    });
    await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
    context.after(() => server.close());
    const origin = `http://127.0.0.1:${server.address().port}`;
    const root = await mkdtemp(join(tmpdir(), `agentaddress-${scenario}-`));
    const env = { AGENTADDRESS_URL: origin, AGENTADDRESS_STATE_DIR: join(root, "private"), AGENTADDRESS_EXAMPLE_STATE_DIR: join(root, "examples") };
    const script = `examples/${scenario}/demo.mjs`;
    const createdRun = await run(script, ["create", sender, ...(scenario === "browser-verification" ? ["verification code"] : [])], env);
    assert.equal(createdRun.code, 0, createdRun.stderr);
    assert.doesNotMatch(createdRun.stdout, new RegExp(token));
    created = JSON.parse(createdRun.stdout);
    assert.equal(created.expected_sender, sender);
    const event = {
      id: "evt_example", sequence: 1, type: "email.received", ingress_surface: "resend", source: "resend",
      data: {
        from: sender, to: [created.email],
        subject: scenario === "browser-verification" ? "Your verification code" : `Reply for ${created.task}`,
        text: scenario === "browser-verification" ? "Code: 123456" : scenario === "email-approval" ? "APPROVE this task" : "Requested file attached",
        attachments: scenario === "document-request-reply" ? [{ id: "att_example", filename: "document.pdf", size: 8 }] : [],
      },
    };
    deliver = true;
    const resumed = await run(script, ["resume"], env);
    assert.equal(resumed.code, 0, resumed.stderr);
    assert.doesNotMatch(resumed.stdout, new RegExp(token));
    const result = JSON.parse(resumed.stdout);
    assert.equal(result.trust, "untrusted_external_data");
    assert.equal(result.handled.length, 0);
    assert.equal(acknowledgements, 0);
    assert.equal(result.observations.length, 1);
    if (scenario === "browser-verification") assert.equal(result.observations[0].verification_code_candidate, "123456");
    if (scenario === "email-approval") assert.equal(result.observations[0].decision_candidate, "APPROVE");
    if (scenario === "document-request-reply") {
      assert.equal(result.observations[0].attachments[0].id, "att_example");
      const downloaded = await run("skills/agentaddress/scripts/agentaddress.mjs", ["attachment", created.task, "evt_example", "att_example"], env);
      assert.equal(downloaded.code, 0, downloaded.stderr);
      assert.equal(JSON.parse(downloaded.stdout).bytes, 8);
      assert.doesNotMatch(downloaded.stdout, new RegExp(token));
    }
    const acknowledged = await run("skills/agentaddress/scripts/agentaddress.mjs", ["ack", created.task, "evt_example"], env);
    assert.equal(acknowledged.code, 0, acknowledged.stderr);
    assert.equal(acknowledgements, 1);
  });
}
