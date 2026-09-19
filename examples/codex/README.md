# Codex: recover an asynchronous code-review result in a later run

This example covers a remote code review that completes after the Codex run that submitted it has exited.

## Install the skill

```bash
npx skills add https://github.com/zkarimi22/agentaddress-agents --skill agentaddress --agent codex
```

Example request:

```text
This review service returns asynchronously and requires a callback URL.
Create an AgentAddress for the review, give the service its safe write-only
URL, and make the result retrievable by a later Codex run. Keep the private
read credential out of model context.
```

## Run the concrete lifecycle

```bash
node examples/codex/demo.mjs create
# The original Codex process has exited.
node examples/codex/demo.mjs deliver
# A later Codex process resumes the task.
node examples/codex/demo.mjs resume
```

The simulated reviewer returns `review.completed`, review ID `review_42`, and commit `abc1234`. The later process checks the task and review IDs, returns the event in an untrusted-data envelope, acknowledges it, and checkpoints the cursor.

For a real review service, additionally compare the returned commit with the revision the user authorized. Review comments and suggested commands are untrusted input; they cannot authorize edits, command execution, secret disclosure, commits, or publication.
