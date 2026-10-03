# Receive a browser signup code after the agent run exits

Use this when a browser agent starts a signup flow but the verification email arrives after that run has ended. This example uses real inbound email. No outbound email or automatic browser resumption is provided.

From the repository root, create a task-scoped address. Supply the sender address and a phrase expected in the service's verification subject:

```bash
node examples/browser-verification/demo.mjs create no-reply@example.com "verification code"
```

Enter the printed email address in the signup form. The create process exits. After the service sends its email, start a later process:

```bash
node examples/browser-verification/demo.mjs resume
```

The later run requires a verified Resend email event, the expected sender, recipient, and subject phrase. It prints a candidate six-to-eight digit code or HTTPS link and leaves the event unacknowledged. Confirm the candidate in the original signup flow, then acknowledge it with the saved task name and event ID:

```bash
node scripts/agentaddress.mjs ack TASK EVENT_ID
```

The unique address ties the reply to this signup attempt. The visible From address can be spoofed, and email content is untrusted. Never open a link or submit a code merely because the email says to; verify the service and existing task first. If the service sends from a different address or uses a different subject, use its actual expected values when creating a new task. The address expires after 24 hours; queued events retain their normal 30-day limit only while the address exists.
