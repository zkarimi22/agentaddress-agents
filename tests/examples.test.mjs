import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const demo = resolve("examples/async-api/demo.mjs");

function run(args, env) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [demo, ...args], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

test("async API example creates, exits, receives a callback, and resumes", async (context) => {
  const token = "private-example-test-token";
  let delivered;
  const server = createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    response.setHeader("content-type", "application/json");

    if (request.method === "POST" && request.url === "/api/v1/addresses") {
      const input = JSON.parse(body);
      assert.equal(input.expires_in_seconds, 3600);
      response.statusCode = 201;
      return response.end(JSON.stringify({
        address: { id: "addr_example", email: "example@example.test" },
        credentials: { read_token: token },
        endpoints: {
          inbox_url: `${origin}/api/v1/inbox/addr_example/write-only`,
          events_url: `${origin}/api/v1/addresses/addr_example/events`,
        },
      }));
    }

    if (request.method === "POST" && request.url === "/api/v1/inbox/addr_example/write-only") {
      delivered = JSON.parse(body);
      response.statusCode = 202;
      return response.end(JSON.stringify({ duplicate: false, event: { id: "evt_example", sequence: 1 } }));
    }

    if (request.method === "GET" && request.url.startsWith("/api/v1/addresses/addr_example/events?")) {
      assert.equal(request.headers.authorization, `Bearer ${token}`);
      return response.end(JSON.stringify({
        events: delivered ? [{
          id: "evt_example",
          sequence: 1,
          type: delivered.type,
          source: delivered.source,
          data: delivered.data,
        }] : [],
        next_cursor: delivered ? 1 : 0,
        has_more: false,
      }));
    }

    if (request.method === "POST" && request.url === "/api/v1/addresses/addr_example/events/evt_example/ack") {
      assert.equal(request.headers.authorization, `Bearer ${token}`);
      return response.end(JSON.stringify({
        event: { id: "evt_example", sequence: 1, acknowledged_at: "2026-09-19T03:00:00.000Z" },
      }));
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: { code: "not_found" } }));
  });

  await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
  context.after(() => server.close());
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const root = await mkdtemp(join(tmpdir(), "agentaddress-concrete-example-"));
  const env = {
    AGENTADDRESS_URL: origin,
    AGENTADDRESS_STATE_DIR: join(root, "private"),
    AGENTADDRESS_EXAMPLE_STATE_DIR: join(root, "examples"),
  };

  const created = await run(["create"], env);
  assert.equal(created.code, 0, created.stderr);
  assert.match(created.stdout, /"step": "created"/);
  assert.doesNotMatch(created.stdout, new RegExp(token));

  const sent = await run(["deliver"], env);
  assert.equal(sent.code, 0, sent.stderr);
  assert.match(sent.stdout, /delivered_after_creator_exit/);
  assert.equal(delivered.type, "render.completed");

  const resumed = await run(["resume"], env);
  assert.equal(resumed.code, 0, resumed.stderr);
  assert.match(resumed.stdout, /resumed_in_later_process/);
  assert.match(resumed.stdout, /untrusted_external_data/);
  assert.match(resumed.stdout, /"sequence": 1/);
  assert.doesNotMatch(resumed.stdout, new RegExp(token));
});
