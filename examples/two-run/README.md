# Receive a callback after the creating process exits

Run each command from the repository root with Node.js 20 or later:

```bash
node examples/two-run/demo.mjs create
node examples/two-run/demo.mjs deliver
node examples/two-run/demo.mjs deliver
node examples/two-run/demo.mjs resume
node examples/two-run/demo.mjs resume
node examples/two-run/demo.mjs verify
```

`create` reads the hosted Agent Skill, provisions an address, stores the complete response in `.agentaddress-demo/address.json` with owner-only permissions, and exits. It refuses to overwrite existing state. Pass a different state path as the second argument for another task.

The first `deliver` simulates a responder and should return status 202 with `duplicate: false`. The second uses the same idempotency key and should return status 200 with `duplicate: true`, still at sequence 1.

The first later `resume` restores the saved credential, handles and acknowledges the event, and checkpoints cursor 1. The second restores that cursor and should process zero events. `verify` confirms retained history, repeatable acknowledgement, cursor behavior, invalid-token rejection, and the payload-size boundary.

The sender is synthetic and this example does not test email. Some webhook providers require challenge-response behavior and need their own compatibility test. Real consumers must make side effects idempotent because a crash before checkpointing can replay an event.

The demo creates one remote address with no requested expiry and one event retained for 30 days. Deleting the local file does not delete the remote address. Do not publish the state file or print its contents. On `429`, wait the returned `Retry-After`; on `409 quota_exceeded`, retention expiry—not acknowledgement—frees capacity; on `413`, reduce the payload before retrying.
