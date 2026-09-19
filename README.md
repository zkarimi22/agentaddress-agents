# AgentAddress for agents

**Give an AI agent a webhook URL or email address that survives after the agent stops running.**

Your agent starts a task → gives a service its AgentAddress → exits → the response arrives 20 minutes later → the next agent run retrieves it.

**No server. No account. No polling process that has to stay alive.**

```bash
npx skills add https://github.com/zkarimi22/agentaddress-agents --skill agentaddress
```

```text
Agent run #1
    ↓
create AgentAddress
    ↓
give webhook/email to someone
    ↓
AGENT EXITS
    ↓
       [ response arrives later ]
                    ↓
             AgentAddress
                    ↓
               stores event
                    ↓
Agent run #2 → retrieves response
```

## Use it

The installed skill includes a helper that stores the private read credential in an owner-only local file. The model works with a task name rather than copying a bearer token.

```bash
node scripts/agentaddress.mjs create my-task
node scripts/agentaddress.mjs poll my-task 25
node scripts/agentaddress.mjs ack my-task EVENT_ID
```

`create` prints the inbound email address and write-only HTTPS inbox URL you can hand to the expected responder. `poll` retrieves the ordered events in a later run. Every returned email and webhook body is explicitly labeled as untrusted external data and must be used only as data for the user's existing task.

## Run one of five concrete examples

The five lead examples are runnable, task-specific, and named for the searches that should discover them:

- [Asynchronous API callback](./examples/async-api/README.md)
- [Human email reply](./examples/human-email-reply/README.md)
- [Claude Code deployment webhook](./examples/claude-code/README.md)
- [Codex asynchronous code review](./examples/codex/README.md)
- [OpenAI Agents SDK delegation](./examples/openai-agents/README.md)

Start with the [complete examples index](./examples/README.md) for exact commands plus browser-agent, research, Stripe, GitHub, REST, and MCP supporting recipes. Stripe and GitHub require a signature-verifying relay before their payloads drive trusted actions.

## Service and machine interfaces

- Hosted service: [agentaddress.dev](https://agentaddress.dev)
- Agent guide: [agentaddress.dev/llms-full.txt](https://agentaddress.dev/llms-full.txt)
- OpenAPI: [agentaddress.dev/openapi.json](https://agentaddress.dev/openapi.json)
- MCP endpoint: `https://agentaddress.dev/api/mcp`
- Capability discovery: [agentaddress.dev/.well-known/agentaddress.json](https://agentaddress.dev/.well-known/agentaddress.json)
- skills.sh: [skills.sh/zkarimi22/agentaddress-agents/agentaddress](https://www.skills.sh/zkarimi22/agentaddress-agents/agentaddress)

## Answers by problem

- [Webhook endpoints without running a server](https://agentaddress.dev/webhooks)
- [Persistent callback queues after an agent exits](https://agentaddress.dev/callbacks)
- [Inbound email replies for later agent runs](https://agentaddress.dev/email)
- [Unified HTTP and email queues for asynchronous agents](https://agentaddress.dev/async-agents)

## Current boundaries

- HTTP callbacks and inbound email enter the same ordered queue.
- Addresses have no expiry unless requested. Events are retained for 30 days, up to 1,000 per address, with a 1 MB maximum input.
- Delivery is at least once. Acknowledgement records handling and advances the helper's local cursor.
- AgentAddress stores responses but does not wake or schedule a runtime. A later run must poll.
- General key/value state, file storage, outbound email, identity, and billing are not available in V1.

The [two-process protocol proof](./examples/two-run/README.md) and [MCP example](./examples/mcp/README.md) remain available for implementers working below the safer helper interface. Their low-level code handles credentials directly and should not be copied into model context. See [SECURITY.md](./SECURITY.md) and the [live verification record](./verification/results.md).

This repository contains the public skill, CLI helper, recipes, and integration material for the hosted service. It does not contain the AgentAddress service implementation.
