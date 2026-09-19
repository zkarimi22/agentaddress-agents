import { runExample } from "../shared/callback-demo.mjs";

await runExample({
  slug: "human-email-reply",
  script: "examples/human-email-reply/demo.mjs",
  manualDelivery: true,
  expirySeconds: 86_400,
  createNext: "Send the printed email address to the intended person, let this process exit, and run resume after they reply.",
});
