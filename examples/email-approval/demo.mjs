import { runExample } from "../shared/callback-demo.mjs";
import { verifiedEmail } from "../shared/verified-email.mjs";

await runExample({
  slug: "email-approval",
  script: "examples/email-approval/demo.mjs",
  manualDelivery: true,
  autoAcknowledge: false,
  expectedSenderRequired: true,
  subjectMode: "task",
  expirySeconds: 86_400,
  createNext: "Ask the expected approver to include the printed task ID in the subject and begin the body with APPROVE or REJECT. Run resume after the reply arrives.",
  validate: (event, _task, state) => {
    const data = verifiedEmail(event, state);
    const decision = String(data.text || "").trim().match(/^(APPROVE|REJECT)(?:\b|$)/i)?.[1]?.toUpperCase() || "UNCLEAR";
    return {
      decision_candidate: decision,
      note: "This is an email signal, not authorization to execute an action. Confirm the task, sender, and permissions before acting; then acknowledge the event.",
    };
  },
});
