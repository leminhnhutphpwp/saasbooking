# Task ledger — active work only

`tasks/` coordinates work that is currently actionable. It contains:

- `BOARD.md`: active tasks and short backlog.
- `_TEMPLATE.md`: template for a new scoped task.
- `T*.md`: only tasks in `todo`, `claimed`, `in-review`, or `blocked` state.

Completed task files are deleted after merge. Git history and `worklogs/` preserve their decisions and verification.

## Lifecycle

`todo` → `claimed` → `in-review` → merge → remove task file

Use `blocked` when work cannot continue safely.

## Rules

1. Create one task per non-overlapping file scope.
2. Claim before editing by setting `status`, `owner`, and a log entry.
3. Work on the task branch only and stay inside `scope`.
4. If another active task owns a required file, stop and coordinate instead of widening scope.
5. Record real verification results; never claim tests or browser checks that were not run.
6. The reviewer merges approved source into `main`.
7. After merge, remove the task file and update `BOARD.md`.

Do not use this folder as a completed-work archive or product roadmap. Use `docs/12-lo-trinh.md` for current priorities and `worklogs/` for history.
