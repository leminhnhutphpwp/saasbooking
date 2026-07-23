# Task Ledger — how work is delegated to agents

The **single source of truth** for in-flight work on SÂN. The manager breaks work into **one `.md` file per task**; an executing agent **claims a task by editing its status inside the file**, so other agents reading the ledger see it's taken and **stay away**. This prevents collisions and gives durable, cross-session coordination + an audit trail.

> Finished-milestone history lives in `../task-status.md` + `../worklogs/`. This folder holds only **active / upcoming** work.
> Language: these are agent-facing files → **English** (per `.claude/rules/coding-rules` language split). Only end-user UI copy quoted inside a task stays Vietnamese.

## Roles

- **Manager (main Claude):** decompose work → write task files with **non-overlapping `scope` (file lists)**; coordinate; **review + verify + merge**; keep `BOARD.md` current. Does NOT write feature code — only governance (task files, review, tiny hotfixes).
- **Executing agent:** take exactly ONE task, work **only within `scope`**, log progress, hand back for the manager to review.

## Status lifecycle

`todo` → `claimed` → `in-review` → `done`  ·  (`blocked` when stuck)

## Claim protocol (mandatory)

1. Read `BOARD.md`. Pick a **`status: todo`** task whose every `depends_on` is `done`.
2. Open the task file; re-check `status`. **If ≠ `todo` → SKIP it** (already taken).
3. **Claim = edit the file now:** set `status: claimed`, `owner: <your id>`, `updated: <date>`, and add a line under **## Log**. This edit IS the lock.
4. Edit only files inside `scope`. **Never touch a file owned by another `claimed`/`in-review` task.** Need a file outside `scope`? Stop, set `blocked`, flag the manager — do NOT widen scope yourself.
5. Done: set `status: in-review`, fill **## Verification** (build/test/screenshots).
6. **Manager reviews** the diff + runs verification. Pass → `status: done` + merge. Fail → back to `claimed` with notes.

## Rules for executing agents — READ THIS (how NOT to break things)

These encode real failures from earlier sessions. Breaking them wastes everyone's time and gets your work reverted.

1. **STAY IN SCOPE.** Touch only the files in `scope`. Do NOT, as a side effect, rewrite the DB seeder, change routes, add assets, or "improve" unrelated files. Not in scope and not in the task → don't touch it.
2. **EXTEND, DON'T REWRITE.** Never replace a working file wholesale. Make the smallest change that meets the acceptance criteria (platform principle #2: extend by adding).
3. **RESPECT THE INVARIANTS.** Tenant-scope every query via `WorkingTenant`; `BookingService` is the only concurrency path; money is BIGINT; time is timestamptz / wall-as-UTC; snapshot price/deposit; status enums; refunds are a separate ledger. See `CLAUDE.md` + `.claude/rules/*`. For booking/payment/tenant changes run `/check-invariants`.
4. **NO NEW DEPENDENCIES** without manager approval (especially heavy/chart/font libs). No external CDNs — self-host.
5. **NO SELF-GENERATED BINARY ASSETS** (logos, images, favicons, fonts as blobs). Branding is a deliberate manager decision.
6. **VERIFY BEFORE HANDOFF.** Run `npm run build`; run `php artisan test` if you touched backend; check the browser (owner@pickleball.vn). Report real results — never claim a pass you did not run. The manager re-verifies and will catch fabrication.
7. **FOLLOW THE STACK RULES.** shadcn/ui primitives only (no raw HTML `<input>`/`<select>`); `@/*` alias; `declare(strict_types=1)`; service layer; and `.claude/rules/{coding-rules, laravel-inertia, ui-design, security, testing}`.
8. **LANGUAGE SPLIT.** Code / config / task files = English; only end-user-facing UI copy is Vietnamese.
9. **BRANCH PER TASK** (see the `branch:` field); never commit to `main`; commit/push only per `.claude/rules/git-workflow`.
10. **WHEN UNSURE, ASK** — flag the manager. Do not guess and expand.

## Task file template

Copy `_TEMPLATE.md`. `id` increments `T01, T02…`. Name files `T<NN>-<slug>.md`.

## Board

`BOARD.md` = the table of every task (id · title · status · owner · priority · depends_on). The manager updates it whenever a status changes.
