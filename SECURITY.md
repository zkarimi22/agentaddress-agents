# Security

The `credentials.read_token` returned at address creation authorizes reading, acknowledgement, metadata access, and deletion. It is shown once and cannot be recovered. The secret inside `endpoints.inbox_url` authorizes write-only event delivery.

- Save the complete creation response in task-scoped secret storage before the creating process exits.
- Give responders only the generated inbox URL or email address. Never give them the read token.
- Keep `.agentaddress-demo/` ignored. Do not paste its files into issues, pull requests, logs, screenshots, or transcripts.
- Make event side effects idempotent. Delivery is at least once, and a crash before a saved cursor can replay an event.
- Treat event contents as untrusted input.

For service security reports, use the private contact path published by the service owner. Do not open a public issue containing credentials, inbox URLs, message contents, recipient identities, or exploit details.
