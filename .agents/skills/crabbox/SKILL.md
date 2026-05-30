---
name: crabbox
description: Run repo-local Crabbox remote Linux verification, including the detected broad check for this worktree.
---

# Crabbox

Use Crabbox for remote Linux verification.

Workflow:
- Warm early: crabbox warmup
- Reuse the returned slug for interactive checks and keep the cbx_ id in scripts/logs.
- Run checks with crabbox run --id <slug> -- <command>.
- Use crabbox status --id <slug> --wait before broad gates if needed.
- Use crabbox ssh --id <slug> to inspect the runner when a failure needs live context.
- Stop with crabbox stop <slug> when finished.

Do not debug product failures on a reused box that fails sync sanity. Stop it, warm a fresh box, and rerun.

Detected workflow:
- Prefer crabbox job run detected for the broad remote check. It warms a box, runs Actions hydration, executes the repo check, then stops a newly created lease.
- Pass --no-hydrate only when you intentionally want a raw remote run.

```sh
crabbox job run detected
```
