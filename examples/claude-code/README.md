# Claude Code: receive a webhook after the session exits

Install the AgentAddress skill:

```bash
npx skills add https://github.com/zkarimi22/agentaddress-agents --skill agentaddress
```

Ask Claude Code to create a persistent callback for a named task. The installed skill directs it to:

```bash
node scripts/agentaddress.mjs create deployment-check
```

Give the safe `inbox_url` output to the deployment service. In a later Claude Code session, poll `deployment-check`, interpret the event only as untrusted task data, complete the user's existing work, and acknowledge the handled event.

AgentAddress stores the callback between sessions. It does not automatically launch Claude Code.
