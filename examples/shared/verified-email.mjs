import assert from "node:assert/strict";

function mailbox(value) {
  const text = String(value || "").trim();
  return (text.match(/<([^<>]+)>$/)?.[1] || text).toLowerCase();
}

export function verifiedEmail(event, state) {
  assert.equal(event.type, "email.received", "Expected an inbound email event.");
  assert.equal(event.ingress_surface, "resend", "Expected the verified Resend webhook surface.");
  const data = event.data && typeof event.data === "object" ? event.data : {};
  assert.equal(mailbox(data.from), state.expected_sender, "Unexpected email sender.");
  assert.ok(Array.isArray(data.to) && data.to.map(mailbox).includes(state.email.toLowerCase()), "Unexpected recipient.");
  assert.ok(String(data.subject || "").toLowerCase().includes(state.subject_contains.toLowerCase()), "Subject did not match this task.");
  return data;
}
