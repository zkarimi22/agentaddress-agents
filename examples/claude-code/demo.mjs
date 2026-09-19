import assert from "node:assert/strict";
import { runExample } from "../shared/callback-demo.mjs";

await runExample({
  slug: "claude-code-deployment",
  script: "examples/claude-code/demo.mjs",
  eventType: "deployment.completed",
  expirySeconds: 3600,
  createNext: "Give inbox_url to the deployment system, allow Claude Code to exit, then run deliver as the delayed deployment callback.",
  payload: (task) => ({
    type: "deployment.completed",
    source: "example-deployment-service",
    data: { task, deployment_id: "dep_42", environment: "preview", status: "ready" },
  }),
  validate: (event, task) => {
    assert.equal(event.type, "deployment.completed");
    assert.equal(event.data?.task, task);
    assert.equal(event.data?.deployment_id, "dep_42");
  },
});
