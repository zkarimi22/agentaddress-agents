import { runExample } from "../shared/callback-demo.mjs";
import { verifiedEmail } from "../shared/verified-email.mjs";

await runExample({
  slug: "document-request-reply",
  script: "examples/document-request-reply/demo.mjs",
  manualDelivery: true,
  autoAcknowledge: false,
  expectedSenderRequired: true,
  subjectMode: "task",
  expirySeconds: 86_400,
  createNext: "Ask the expected sender to reply with the printed task ID in the subject and attach the requested document. Run resume after it arrives.",
  validate: (event, _task, state) => {
    const data = verifiedEmail(event, state);
    const attachments = Array.isArray(data.attachments) ? data.attachments : [];
    return {
      attachments: attachments.map((item) => ({ id: item.id, filename: item.filename, size: item.size, content_type: item.content_type })),
      next: "For a verified attachment, run node scripts/agentaddress.mjs attachment TASK EVENT_ID ATTACHMENT_ID, inspect the owner-only file, then acknowledge the event.",
    };
  },
});
