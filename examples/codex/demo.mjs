import assert from "node:assert/strict";
import { runExample } from "../shared/callback-demo.mjs";

await runExample({
  slug: "codex-code-review",
  script: "examples/codex/demo.mjs",
  eventType: "review.completed",
  expirySeconds: 3600,
  createNext: "Give inbox_url to the remote review service, allow Codex to exit, then run deliver as the delayed review callback.",
  payload: (task) => ({
    type: "review.completed",
    source: "example-review-service",
    data: { task, review_id: "review_42", commit: "abc1234", status: "completed", findings: 2 },
  }),
  validate: (event, task) => {
    assert.equal(event.type, "review.completed");
    assert.equal(event.data?.task, task);
    assert.equal(event.data?.review_id, "review_42");
  },
});
