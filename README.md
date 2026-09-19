# AgentAddress for agents

AgentAddress gives an ephemeral AI agent a persistent return path. Create one address without an account, give its write-only HTTPS inbox or inbound email address to a responder, let the creating process exit, and retrieve the response from a later run through a private ordered queue.

Hosted service: [agentaddress.dev](https://agentaddress.dev)
Agent Skill: [agentaddress.dev/skill.md](https://agentaddress.dev/skill.md)
MCP endpoint: `https://agentaddress.dev/api/mcp`
API contract: [agentaddress.dev/openapi.json](https://agentaddress.dev/openapi.json)

## Use the Agent Skill

Once this repository is public, install the skill with:

```bash
npx skills add https://github.com/zkarimi22/agentaddress-agents --skill agentaddress
```

Compatible agents can also read the hosted skill directly:

```text
https://agentaddress.dev/skill.md
```

The skill should activate when a callback may arrive after the current run exits, a service requires a webhook URL, a human needs an email address for a later reply, or a future run needs the ordered record of what arrived.

## Run the two-process proof

Node.js 20 or later is the only dependency for the REST example:

```bash
node examples/two-run/demo.mjs create
node examples/two-run/demo.mjs deliver
node examples/two-run/demo.mjs deliver
node examples/two-run/demo.mjs resume
node examples/two-run/demo.mjs resume
node examples/two-run/demo.mjs verify
```

Every command is a separate process. The first saves the complete creation response to an ignored owner-only file and exits. Delivery happens afterward. The later process restores the read credential and cursor, acknowledges the event, and checkpoints the cursor. The repeated delivery proves idempotency; the repeated resume proves the saved cursor excludes handled events.

Read [the walkthrough](./examples/two-run/README.md) before adapting it. The commands create one hosted AgentAddress with no requested expiry and one retained synthetic event.

## Connect through MCP

Clients that accept a remote URL can connect to:

```json
{
  "mcpServers": {
    "agentaddress": {
      "url": "https://agentaddress.dev/api/mcp"
    }
  }
}
```

The server exposes `create_return_address`, `poll_events`, and `acknowledge_event`. Provisioning requires no account; polling and acknowledgement use the one-time read token returned for that address. See the [MCP guide and real-client example](./examples/mcp/README.md).

## Current boundaries

- HTTP callbacks and inbound email enter the same ordered queue.
- Addresses have no expiry unless requested. Events are retained for 30 days, up to 1,000 per address.
- Maximum input is 1,000,000 bytes. Creation allows 20 attempts per IP per minute; polling allows 30 requests per address per minute across REST and MCP.
- Acknowledgement records handling but does not delete an event or free capacity.
- AgentAddress does not automatically wake an agent. A user, scheduler, or runtime starts the later run.
- General key/value state, file storage, outbound email, identity, and billing are not available in V1.

Never commit read tokens, generated inbox URLs, recipient addresses, or event contents. See [SECURITY.md](./SECURITY.md).

## Verification

The REST and MCP workflows were exercised against the live MongoDB-backed service with separate creating and resuming processes. See [verification/results.md](./verification/results.md) for the evidence and limits of that claim.

This repository contains integration material for the hosted service. It does not contain the AgentAddress service implementation.
