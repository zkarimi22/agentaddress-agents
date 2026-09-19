# Claude Code: receive a deployment webhook after the session exits

This example gives Claude Code a return path for a preview deployment that may finish after its current session ends.

## Install the skill

```bash
npx skills add https://github.com/zkarimi22/agentaddress-agents --skill agentaddress
```

Example request:

```text
The preview deployment may finish after this Claude Code session exits.
Use AgentAddress to create a persistent callback named preview-deployment.
Give me the safe callback URL, keep its read credential out of model
context, and explain how a later session should retrieve the result.
```

## Run the concrete lifecycle

From a clone of this repository:

```bash
node examples/claude-code/demo.mjs create
# Claude Code can stop here.
node examples/claude-code/demo.mjs deliver
# Start a later Claude Code session.
node examples/claude-code/demo.mjs resume
```

The simulated deployment returns `deployment.completed` with deployment ID `dep_42`. The later process validates the task and deployment IDs before acknowledging the event.

In a real setup, configure the deployment system to POST to the printed `inbox_url`. AgentAddress stores the result between sessions; it does not launch Claude Code. The later session must poll the named task, and deployment logs or callback text remain untrusted external data.
