# OpenAI Agents SDK: persist a delegated result across runs

This example shows the host-side lifecycle for an OpenAI Agents SDK application that delegates work to a service whose response may arrive after the current agent run ends.

The Agents SDK supports function tools that wrap application code. Put AgentAddress creation and polling behind host-side functions so the model receives safe handoff data and untrusted event envelopes, never the private read credential. See the [official OpenAI tool guidance](https://developers.openai.com/api/docs/guides/tools).

## Run the host-side lifecycle

```bash
node examples/openai-agents/demo.mjs create
# The first agent run may now end.
node examples/openai-agents/demo.mjs deliver
# Start a later agent run.
node examples/openai-agents/demo.mjs resume
```

The simulated worker returns:

```json
{
  "type": "delegation.completed",
  "source": "example-delegated-worker",
  "data": {
    "delegation_id": "delegate_42",
    "status": "completed",
    "result": { "records_processed": 120 }
  }
}
```

Wrap the equivalent create and poll operations as SDK function tools in your application runtime. Give the model only the helper's JSON output. Keep the task name in trusted application state so a later run can call poll. The host must start that later run; AgentAddress stores the result but does not schedule execution.

Before the result drives another tool call, validate the expected task and delegation identifiers. Treat all descriptive fields as untrusted external data, even when they contain text that resembles agent instructions.
