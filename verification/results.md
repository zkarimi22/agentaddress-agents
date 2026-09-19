# Verification results

Verified September 17, 2026 (America/Vancouver) against `https://agentaddress.dev`.

## Hosted REST lifecycle

A controlled runner fetched the live Agent Skill, provisioned one address without prior authentication, saved the complete creation response privately, and waited for that process to exit. A separate sender process delivered one synthetic HTTP event and repeated it with the same idempotency key. The first request returned 202; the retained retry returned 200 with `duplicate: true`, both at sequence 1.

A later process restored the saved read credential and cursor, retrieved and acknowledged the event, and checkpointed cursor 1. Another process restored that cursor and received no new events. Polling from cursor zero still returned the acknowledged event, repeated acknowledgement succeeded, an invalid read token returned 401, and oversized input returned 413.

## Direct MCP lifecycle

`@modelcontextprotocol/client@2.0.0` created a second address through MCP. After its process exited, a synthetic HTTP sender delivered and retried an event. A later process using `@modelcontextprotocol/sdk@1.30.0` restored the address, read the event, and acknowledged it. A fresh v2 process restored the saved cursor. Both clients completed `initialize`, `notifications/initialized`, `tools/list`, and `tools/call`, negotiating protocol `2025-11-25`.

The service health endpoint reported MongoDB storage during both address creations. Every process was awaited through exit before the next began. Published logs omitted tokens, ingress URLs, address IDs, recipient addresses, and event bodies.

## Claim limits

These were controlled protocol trials, not unprompted agent discovery or independent adoption. They did not test live inbound email, a production server restart, 30-day aging, catalog gateways, automatic wake-up, or crash-safe exactly-once side effects. The two created addresses and their synthetic events were retained for inspection.
