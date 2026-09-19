# Stripe webhook for an AI agent

Stripe signs webhook requests. A generic AgentAddress inbox does not currently verify or preserve Stripe's signature as a trusted assertion, so do not point a production Stripe endpoint directly at AgentAddress for payment decisions.

Use a small trusted relay that:

1. Receives Stripe's raw request body.
2. Verifies `Stripe-Signature` with Stripe's official library and endpoint secret.
3. Reduces the event to the fields the existing task needs.
4. Sends that verified result to the task's AgentAddress inbox URL.

The agent creates and later polls the task with the bundled helper. Even after relay verification, descriptive fields such as customer-entered text remain untrusted data. Keep fulfillment and other consequential payment actions behind normal server-side authorization.

This recipe documents the required security boundary; it is not a claim that direct Stripe signature verification is built into AgentAddress.
