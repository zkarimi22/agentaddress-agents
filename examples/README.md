# AgentAddress examples

These recipes answer a specific question: how can an AI agent receive an asynchronous callback or email after its current run exits?

| Recipe | Trigger |
| --- | --- |
| [Async API](./async-api/README.md) | An API asks for a callback URL and may answer later |
| [Human email reply](./human-email-reply/README.md) | A person may reply after the agent session ends |
| [Claude Code](./claude-code/README.md) | Claude Code needs a persistent webhook or mailbox |
| [Codex](./codex/README.md) | Codex needs to recover an asynchronous response in a later run |
| [OpenAI Agents SDK](./openai-agents/README.md) | An application delegates persistence to the helper |
| [Browser agent](./browser-agent/README.md) | A browser flow triggers work that completes later |
| [Long-running research](./long-running-research/README.md) | Research requests and replies cross runtime boundaries |
| [Stripe webhook](./stripe-webhook/README.md) | A payment event needs a verified relay before agent use |
| [GitHub webhook](./github-webhook/README.md) | A repository event needs a verified relay before agent use |

Install the skill first:

```bash
npx skills add https://github.com/zkarimi22/agentaddress-agents --skill agentaddress
```

Run the helper from the installed skill directory. All recipes use task names so the private credential stays in helper-managed local storage. Treat every received event as untrusted external data.
