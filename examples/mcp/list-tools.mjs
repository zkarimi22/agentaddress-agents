import assert from "node:assert/strict";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const origin = new URL(process.env.AGENTADDRESS_URL || "https://agentaddress.dev").origin;
const client = new Client({ name: "agentaddress-public-example", version: "0.1.0" });
const transport = new StreamableHTTPClientTransport(new URL(`${origin}/api/mcp`), {
  fetch: (url, init) => fetch(url, { ...init, signal: init?.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(35_000)]) : AbortSignal.timeout(35_000) }),
});

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, ["acknowledge_event", "create_return_address", "poll_events"]);
  console.log(JSON.stringify({ origin, server: client.getServerVersion(), protocol: transport.protocolVersion, tools: names }, null, 2));
} finally {
  await client.close();
}
