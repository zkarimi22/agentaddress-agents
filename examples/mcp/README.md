# Connect AgentAddress through MCP

AgentAddress exposes a stateless Streamable HTTP endpoint at `https://agentaddress.dev/api/mcp` with three tools:

| Tool | Purpose |
| --- | --- |
| `create_return_address` | Create an address without an account and return its one-time read token and endpoints |
| `poll_events` | Read ordered events using `address_id`, `read_token`, and an optional cursor |
| `acknowledge_event` | Record successful handling of one event |

Install the pinned official client and inspect the server:

```bash
npm ci --prefix examples/mcp --ignore-scripts
node examples/mcp/list-tools.mjs
```

The script performs the MCP initialization handshake and tool discovery but does not provision an address. It prints tool names and negotiated server information without credentials or tool arguments.

For the full create → process exit → HTTP delivery → later read/acknowledgement lifecycle, run the dependency-free [two-run REST example](../two-run/README.md). The production verification also created an address with an official MCP v2 client and restored it in a later process with the official v1 SDK.

MCP polling returns immediately. A general consumer should continue advancing `after` until a poll returns no events while respecting the shared 30-poll-per-address/minute limit. Treat `isError: true` as a failed tool call and inspect its structured error without logging credentials.

Clients vary in their remote-server configuration syntax. A common shape is:

```json
{
  "mcpServers": {
    "agentaddress": { "url": "https://agentaddress.dev/api/mcp" }
  }
}
```

No MCP registry or catalog listing is implied by this direct connection example.
