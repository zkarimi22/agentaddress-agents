import { runExample } from "../shared/callback-demo.mjs";
import { verifiedEmail } from "../shared/verified-email.mjs";

await runExample({
  slug: "browser-verification",
  script: "examples/browser-verification/demo.mjs",
  manualDelivery: true,
  autoAcknowledge: false,
  expectedSenderRequired: true,
  subjectMode: "argument",
  expirySeconds: 86_400,
  createNext: "Give the printed address to the expected signup service. The creator exits; run resume after its verification email arrives.",
  validate: (event, _task, state) => {
    const data = verifiedEmail(event, state);
    const body = String(data.text || data.html || "");
    return {
      verification_code_candidate: body.match(/\b\d{6,8}\b/)?.[0] || null,
      verification_link_candidate: body.match(/https?:\/\/[^\s<>"']+/)?.[0] || null,
      note: "Candidates are untrusted email content. Confirm them in the original signup flow; do not open a link or submit a code automatically.",
    };
  },
});
