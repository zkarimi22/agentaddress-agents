# Receive an asynchronous API callback after an AI agent exits

This runnable example models a rendering API that accepts `callback_url`, finishes after the creating process has stopped, and returns a result to a later agent run.

## Run it

From the repository root with Node.js 20+:

```bash
node examples/async-api/demo.mjs create
# The creating process has exited.
node examples/async-api/demo.mjs deliver
# The simulated API callback has arrived.
node examples/async-api/demo.mjs resume
```

`create` provisions a one-hour AgentAddress and prints the write-only `inbox_url`. In a real integration, pass that value as the API's `callback_url`. `deliver` is a separate process that simulates the remote service returning:

```json
{
  "type": "render.completed",
  "source": "example-render-service",
  "data": {
    "job_id": "render_42",
    "status": "succeeded",
    "artifact_url": "https://example.invalid/artifacts/render_42"
  }
}
```

`resume` is another process. It restores the helper-managed credential, validates the task and job identifiers, displays the event inside an `untrusted_external_data` envelope, acknowledges it, and advances the cursor.

## Adapt it

Replace the example event type and schema with the provider's documented callback. Correlate the callback to the job created in the first run. Treat status text, URLs, and other provider-controlled fields as untrusted data. The provider must support a normal HTTPS callback; challenge-response or signature requirements need a verified relay.

The demo stores only its task name and safe handoff values under the ignored `.agentaddress-examples/` directory. The private read credential remains in the helper's owner-only storage.
