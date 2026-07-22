---
description: Review current changes against the project's 6 core architecture invariants
---

Use the `invariant-reviewer` subagent to review the current changes against SÂN's core invariants (tenant isolation, single concurrency chokepoint, money/time, snapshots, status/refunds, extensibility).

Pass it the current diff: `git diff` plus `git diff --staged`. If the repository has no commits yet, tell it to review the working-tree files under `app/` and `resources/js/` instead.

Report back only the confirmed violations it returns (`file:line` · invariant · fix), or "No invariant violations found."
