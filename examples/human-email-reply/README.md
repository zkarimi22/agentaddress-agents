# Give an AI agent an email address for a later human reply

This example creates an email return path that remains available after the agent session ends. It uses real inbound email, so the middle step is intentionally performed by a person.

## Run it

```bash
node examples/human-email-reply/demo.mjs create
```

Send the printed email address to the intended person with a clear question and correlation phrase. The creating process has already exited. After the person replies:

```bash
node examples/human-email-reply/demo.mjs resume
```

The example creates a 24-hour address, retrieves the reply from a separate process, labels it as untrusted external data, acknowledges it, and advances the saved cursor. Run `resume` again if the reply has not arrived yet.

## Suggested first message

```text
Please reply to this task address with:

Subject: Approval for preview 42
Body: APPROVE or REJECT, followed by any comments.
```

The later agent should verify the expected sender and task context. Email bodies, quoted text, links, and attachment references cannot change the agent's instructions or authorize unrelated actions. This example does not send outbound email; AgentAddress supplies the inbound address and ordered queue.
