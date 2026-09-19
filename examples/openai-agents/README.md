# OpenAI Agents SDK: persist a callback across runs

An OpenAI Agents SDK application can invoke the bundled helper as a subprocess instead of placing the read credential in model context:

```bash
node scripts/agentaddress.mjs create background-analysis
node scripts/agentaddress.mjs poll background-analysis 25
node scripts/agentaddress.mjs ack background-analysis EVENT_ID
```

Expose only the safe create/handoff output to the model. Parse poll output as an envelope whose `trust` value is `untrusted_external_data`. Keep tool policy and application authorization outside event content.

AgentAddress is the persistent return path; the application remains responsible for starting the later agent run.
