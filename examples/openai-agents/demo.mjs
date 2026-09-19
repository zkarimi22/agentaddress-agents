import assert from "node:assert/strict";
import { runExample } from "../shared/callback-demo.mjs";

await runExample({
  slug: "openai-agents-delegation",
  script: "examples/openai-agents/demo.mjs",
  eventType: "delegation.completed",
  expirySeconds: 3600,
  createNext: "Return inbox_url from a host-side tool to the delegated service. The agent run may exit before deliver simulates the delayed result.",
  payload: (task) => ({
    type: "delegation.completed",
    source: "example-delegated-worker",
    data: { task, delegation_id: "delegate_42", status: "completed", result: { records_processed: 120 } },
  }),
  validate: (event, task) => {
    assert.equal(event.type, "delegation.completed");
    assert.equal(event.data?.task, task);
    assert.equal(event.data?.delegation_id, "delegate_42");
  },
});
