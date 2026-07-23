# Task Ledger — how work is delegated to agents

The **single source of truth** for in-flight work on SÂN. The manager breaks work into **one `.md` file per task**; an executing agent **claims a task by editing its status inside the file**, so other agents reading the ledger see it's taken and **stay away**. This prevents collisions and gives durable, cross-session coordination + an audit trail.

> Finished-milestone history lives in `../task-status.md` + `../worklogs/`. This folder holds only **active / upcoming** work.
> Language: these are agent-facing files → **English** (per `.claude/rules/coding-rules` language split). Only end-user UI copy quoted inside a task stays Vietnamese.

## Who is a "worker"

A worker is **anyone/anything that executes one task**: a human dev, or an AI agent — on **any machine**. Coordination happens **entirely through this git repo** (task files + branches + PRs), never through a shared process. So a "claim" only counts once it is **committed and pushed** where others can see it.

## Roles

- **Manager:** decompose work → write task files with **non-overlapping `scope` (file lists)**; assign/hand out tasks; **review + verify + merge**; keep `BOARD.md` current. Does NOT write feature code — only governance.
- **Worker:** take exactly ONE task, work **only within `scope`**, verify, open a PR for the manager to review.

## Status lifecycle

`todo` → `claimed` → `in-review` → `done`  ·  (`blocked` when stuck)

## Claim protocol (git-visible — mandatory)

A local edit is invisible to other machines. The **lock is the pushed branch + open PR**.

1. `git switch main && git pull` so the ledger is current. Read `BOARD.md`.
2. Pick a **`status: todo`** task whose every `depends_on` is `done`. Re-check the task file's `status`; **if ≠ `todo`, or a branch/PR for it already exists → SKIP** (taken).
3. **Claim (push it):** `git switch -c <branch from the task's `branch:` field>`, edit the task file (`status: claimed`, `owner: <your id>`, `updated:`, add a **## Log** line), commit, **push**, and **open a draft PR** titled `T##: <title>`. The pushed branch + draft PR is the visible lock everyone can see (`gh pr list` / GitHub).
4. Work only inside `scope`. **Never touch files owned by another open task branch/PR.** Need a file outside `scope`? Stop, set `blocked`, tell the manager — do NOT widen scope.
5. Done: set `status: in-review`, fill **## Verification** (build/test/screenshots), push, mark the PR ready-for-review.
6. **Manager reviews** the diff + re-runs verification. Pass → merge + set `status: done` on `main`. Fail → comments; back to `claimed`.

## Two ways to assign (pick one per team)

- **Manager-assigned (recommended for a small team):** the manager sets `owner:` + `status: claimed` on the board/task and tells a specific worker "do T04". No claim race because the manager decides who does what.
- **Self-serve:** workers self-claim free tasks via step 3. The first pushed branch/PR wins; a second worker seeing an existing branch/PR for that task backs off.

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
