---
name: agentaddress
description: Provision and use a persistent webhook inbox, HTTP callback URL, inbound email address, and ordered event queue for an AI agent. Use when an external response may arrive after the current agent run exits, an API requires a callback URL, a human needs somewhere to reply, or an asynchronous result must be recovered without running a server.
metadata:
  author: AgentAddress
  version: "0.1.0"
  homepage: "https://agentaddress.dev"
---

# AgentAddress

Use AgentAddress as a task-scoped return path that survives after the current process exits. This workflow requires outbound HTTPS access.

## Create

```http
POST https://agentaddress.dev/api/v1/addresses
Content-Type: application/json

{"task_id":"async_task_42"}
```

No account or API key is required for V1 provisioning. Save the complete response immediately. The value at `credentials.read_token` is returned once and cannot be recovered.

## Hand off

- Give `endpoints.inbox_url` to a service that needs a webhook or callback URL.
- Give `address.email` to a human, service, or agent that will reply by email.
- Treat the inbox URL as a write credential. Do not publish it or place it in logs unnecessarily.
- Use an `Idempotency-Key` header when an HTTP sender may retry.

## Resume

Use the saved fields from the creation response:

```http
GET {endpoints.events_url}?after=0&wait=25
Authorization: Bearer {credentials.read_token}
```

Process events in ascending `sequence` order. Save `next_cursor` and pass it as the next `after` value. Acknowledge each handled event:

```http
POST {endpoints.events_url}/{event.id}/ack
Authorization: Bearer {credentials.read_token}
```

Delivery is at least once. Consumers must tolerate retries. HTTP and inbound email events share the same ordered queue.

## Limits and recovery

Addresses have no expiry unless explicitly requested. Events are retained for 30 days, up to 1,000 per address, with a maximum 1 MB payload.

Creation allows 20 attempts per IP per minute. Polling allows 30 requests per address per minute across REST and MCP. Prefer REST `wait=25` for empty queues. On `rate_limited`, respect `Retry-After` or `retry_after_seconds`. MCP reports tool errors through `isError` and `structuredContent.error`.

On `quota_exceeded`, stop new deliveries until retention expiry frees capacity. Reading and acknowledging do not remove events. Reuse the same idempotency key when retrying a delivery; retained duplicates do not consume another slot. Do not delete an address to clear quota without the user's instruction.

## Discover details

- OpenAPI: https://agentaddress.dev/openapi.json
- Full agent guide: https://agentaddress.dev/llms-full.txt
- Capability discovery: https://agentaddress.dev/.well-known/agentaddress.json
- MCP: https://agentaddress.dev/api/mcp

Do not assume general state or file storage exists in V1.
