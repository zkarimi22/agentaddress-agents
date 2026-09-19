import assert from "node:assert/strict";
import { runExample } from "../shared/callback-demo.mjs";

await runExample({
  slug: "async-api",
  script: "examples/async-api/demo.mjs",
  eventType: "render.completed",
  expirySeconds: 3600,
  createNext: "Give inbox_url to the asynchronous API as callback_url, then let this process exit. Run deliver to simulate that API.",
  payload: (task) => ({
    type: "render.completed",
    source: "example-render-service",
    data: { task, job_id: "render_42", status: "succeeded", artifact_url: "https://example.invalid/artifacts/render_42" },
  }),
  validate: (event, task) => {
    assert.equal(event.type, "render.completed");
    assert.equal(event.data?.task, task);
    assert.equal(event.data?.job_id, "render_42");
  },
});
