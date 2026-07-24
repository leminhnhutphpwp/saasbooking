# Task Ledger — how work is delegated to agents

The **single source of truth** for in-flight work on SÂN. The manager breaks work into **one `.md` file per task**; an executing agent **claims a task by editing its status inside the file**, so other agents reading the ledger see it's taken and **stay away**. This prevents collisions and gives durable, cross-session coordination + an audit trail.

> Finished-milestone history lives in `../task-status.md` + `../worklogs/`. This folder holds only **active / upcoming** work.
> Language: these are agent-facing files → **English** (per `.claude/rules/coding-rules` language split). Only end-user UI copy quoted inside a task stays Vietnamese.

## Who is a "worker"

A worker is **anyone/anything that executes one task**: a human dev, or an AI agent — on **any machine**. Coordination happens **entirely through this git repo** (task files + branches + PRs), never through a shared process. So a "claim" only counts once it is **committed and pushed** where others can see it.

## Roles

- **Manager:** decompose work → write task files with **non-overlapping `scope`**; review + verify (build/test/browser); **is the ONLY one who merges source code into `main`**; keep `BOARD.md` current. Does NOT write feature code.
- **Worker:** take exactly ONE task, work **only within `scope`** on the task branch, verify, and **hand off via the task `.md`** — a worker NEVER merges source code into `main`.

## The core rule — separation of merge duties

- **Source code lives on the task branch only.** A worker commits + pushes their code to `<branch>` and **stops there**. They do NOT merge code into `main`.
- **A worker's ONLY write to `main` is its own task `.md`** — the status/handoff signal ("I'm done, here's the branch, here's how to verify"). That is the report.
- **Merging source code into `main` is the manager's job, always.** The manager pulls the `.md`, fetches the branch, reviews + verifies, then merges the code and sets the `.md` to `done`.

This makes polluted/half-baked code reaching `main` **structurally impossible** — the worker's footprint on `main` is one small markdown file, nothing more.

## Status lifecycle

`todo` → `claimed` → `in-review` → `done`  ·  (`blocked` when stuck)

## Protocol

**Worker:**
1. `git switch main && git pull`. Read `BOARD.md`. Pick a `todo` task whose `depends_on` are all `done`; if its `.md` ≠ `todo` or a branch exists → SKIP.
2. **Claim:** on `main`, set the task `.md` `status: claimed` + `owner` + a `## Log` line, commit **just that .md**, push (this small metadata commit is the visible lock). Then `git switch -c <branch>` and work.
3. Work **only inside `scope`**. Commit + **push the code to `<branch>`**. Need a file outside `scope`? Stop, set `blocked`, tell the manager — never widen scope.
4. **Hand off:** update the task `.md` → `status: in-review`, fill **## Verification** (build/test + browser screenshots) and a short **handoff note** (branch name, what changed, how to verify), commit **just the .md**, push to `main`. Do **NOT** merge the code branch.

**Manager:**
5. Pull `main` → see the `.md` at `in-review`. `git fetch` + review the branch diff; re-run build/test + browser verify (never trust the self-report).
6. Pass → **manager merges the code** into `main` (clean — dropping anything out of scope) and sets the `.md` → `done`. Fail → note it on the `.md`/branch; back to `claimed`.

> Note: this is still a **convention** — without branch protection, a rogue push of code to `main` is physically possible (it happened once). If a worker keeps violating, pair this with GitHub branch protection so only the manager can push to `main`. But as a working agreement it removes the ambiguity that caused workers to merge their own code.

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
