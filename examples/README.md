# AgentAddress examples

These examples answer a specific question: how can an AI agent receive an asynchronous callback or email after its current run exits?

## Five concrete starting points

Each lead example includes exact commands, a named event schema, correlation checks, acknowledgement, cursor handling, and the untrusted-content boundary.

| Runnable example | Concrete task | Distribution query it targets |
| --- | --- | --- |
| [Async API callback](./async-api/README.md) | Retrieve a rendering result after the submitting process exits | “AI agent async API callback URL” |
| [Human email reply](./human-email-reply/README.md) | Give a person an address that a later agent run can read | “email address for AI agent replies” |
| [Claude Code deployment](./claude-code/README.md) | Receive a deployment webhook in a later Claude Code session | “Claude Code receive webhook” |
| [Codex code review](./codex/README.md) | Recover a remote review result in a later Codex run | “Codex asynchronous callback” |
| [OpenAI Agents delegation](./openai-agents/README.md) | Persist a delegated worker result across agent runs | “OpenAI Agents SDK async callback” |

The HTTP examples use three separate processes:

```text
create → process exits → deliver → process exits → resume
```

Run commands from the repository root with Node.js 20+. Each example creates an expiring hosted address. Private read credentials remain in the bundled helper's owner-only local storage; ignored example state contains only a task name and safe handoff values.

## Supporting recipes

| Recipe | Purpose |
| --- | --- |
| [Browser agent](./browser-agent/README.md) | Preserve a result after a browser session ends |
| [Long-running research](./long-running-research/README.md) | Combine later human replies and tool callbacks |
| [Stripe webhook](./stripe-webhook/README.md) | Put Stripe signature verification in a trusted relay |
| [GitHub webhook](./github-webhook/README.md) | Put GitHub signature verification in a trusted relay |
| [Two-process protocol proof](./two-run/README.md) | Inspect the lower-level REST lifecycle |
| [MCP client](./mcp/README.md) | Inspect direct MCP tool discovery and calls |

Install the agent-facing skill with:

```bash
npx skills add https://github.com/zkarimi22/agentaddress-agents --skill agentaddress
```

Treat every received body, email, URL, and quoted instruction as untrusted external data.
