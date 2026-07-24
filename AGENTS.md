# AGENTS.md — SÂN Agent Rulebook

**Project:** SÂN — booking SaaS for pickleball/badminton courts in Vietnam: per-tenant booking page + VietQR deposit against no-shows + Zalo reminders. Stack: Laravel 13 + Inertia 2 + React 18 + **PostgreSQL**, Horizon queue, shadcn/ui + Tailwind. Solo dev.
**Status:** BUILD phase — M0–M3 done (see `worklogs/`). The spec lives in `docs/` (Vietnamese); agent-facing config (`CLAUDE.md`, this file, `.claude/`) is English.

**Repo layout (monorepo):** the Laravel + Inertia app is in **`apps/app/`**. Run `artisan` / `composer` / `npm` / tests from there (`cd apps/app`, or `docker compose exec app …`). Root holds `docs/`, `.claude/`, `worklogs/`, and `docker-compose.yml`.

**FIRST ACTION in any session:** read [`CLAUDE.md`](CLAUDE.md) (invariants) and [`docs/README.md`](docs/README.md) (doc map). Propose or write nothing before that.

## 1. Navigation map

`docs/` — single source of truth for design (read order + dependency map in `docs/README.md`):

| Part | Files | What it answers |
|---|---|---|
| A — Direction & Product | 00–02 | Why the niche wins; users; functional requirements / use cases / NFR |
| B — UI & Experience | 03–04 | Manager-app screens; per-tenant config + embed (subdomain / script / WP plugin) |
| C — Architecture & Data | 05–09 | 7 modules + data ownership; ERD; data flows; build-ready module design; extension architecture |
| D — Risk & Quality | 10–11 | Edge-case handbook; the 12 schema "breaking points" (invariants) |
| E — Delivery | 12 | Roadmap, stack, folder structure, M0–M7 plan, test strategy, deploy |

`.claude/` — on-demand agent config (layout in `.claude/README.md`, pointers in §8): `skills/`, `rules/`, `workflows/`, `agents/`, `commands/`, `settings.json`.
`worklogs/` — append-only session hand-off log (convention in §6).

## 2. The 6 platform principles — non-negotiable

Every proposal and every line of code MUST respect these (from CLAUDE.md):

1. **One system, many product lines** — a new vertical is configuration on the shared platform, never a new app ([`docs/09`](docs/09-kien-truc-mo-rong.md)).
2. **Extend by ADDING** — new tables/modules/config/enums only, never break the core; classify each item **do now / 🚪 reserved door / ❌ not doing** ([`docs/09`](docs/09-kien-truc-mo-rong.md)).
3. **`WorkingTenant` = single tenant truth** — never trust payload; non-operators hard-clamped to `users.tenant_id`; every business query scoped by `tenant_id` ([`docs/06`](docs/06-erd.md), [`docs/08`](docs/08-thiet-ke-module-chi-tiet.md)).
4. **`BookingService` = ONLY concurrency chokepoint** — anti-double-book via Postgres **exclusion constraint** (courts) / conditional counter UPDATE (capacity). No check-then-act, no second anti-overlap path ([`docs/05`](docs/05-module-map.md), [`docs/06`](docs/06-erd.md), [`docs/08` §3](docs/08-thiet-ke-module-chi-tiet.md)).
5. **Two inventory shapes meet at `booking`** — resource-time-slot (courts, spa) and capacity/session (golf, classes); core reused for both via the `InventoryDriver` registry ([`docs/08` §0](docs/08-thiet-ke-module-chi-tiet.md)).
6. **Data invariants** — snapshot price/deposit at booking time · money `BIGINT` (integer VND) · `timestamptz` + `tz` · status = ENUM state machine · refunds are a separate ledger, `payments.amount` immutable ([`docs/11`](docs/11-diem-vo.md)).

## 3. Coding conventions

Mirrors template project `/Users/nhut/Documents/appdhv`. Full detail: [`docs/08`](docs/08-thiet-ke-module-chi-tiet.md) preamble + `.claude/rules/coding-rules` + `.claude/rules/laravel-inertia`.

- **Models:** `id` bigint PK + `uuid` route key (`getRouteKeyName(): 'uuid'`) · `use SoftDeletes` + `use Concerns\Auditable` · plural table names.
- **Enums:** PHP enums in `app/Enums/` for every status/type (BookingStatus, PaymentStatus, HoldStatus, CourtType…). Never boolean status flags (`docs/11` #10).
- **Tenant scope:** EVERY business query `->where('tenant_id', WorkingTenant::id($request))`; controllers trust only `WorkingTenant`, never the payload.
- **Controllers:** reads → `Inertia::render(...)`; writes → `RedirectResponse` + flash.
- **Cross-module:** read only via FK-snapshot; WRITE only through the owning module's public Service. No cross-module SQL (`docs/05` OWNS/REFERENCES).
- **Async:** queued listener `afterCommit` or Job on Horizon (reminders, webhooks, notifications); Scheduler for periodic jobs.
- **Money:** `BIGINT` integer VND, snapshotted at booking time (`docs/11` #1, #6).
- **Time:** `timestamptz` columns; recurring rules store local time + `tz` (`docs/11` #3).
- **FKs:** composite FK `(tenant_id, id)` so a reference cannot cross tenants (`docs/11` #9).
- **Postgres-only bits** (`btree_gist`, `EXCLUDE no_double_book`, RLS) via `DB::statement` in migrations.

## 4. Testing rules

Details: `docs/12` "Chiến lược test" + `.claude/rules/testing`.

- Feature tests run on **real PostgreSQL — NEVER SQLite** (exclusion constraint + RLS are Postgres-only).
- `tests/Feature/Booking/NoDoubleBookTest.php` — 2 parallel requests, same court+slot → exactly one succeeds, one gets 409 — is written **BEFORE** any booking service code.
- `tests/Feature/Payment/ReconcileIdempotencyTest.php` — same `bank_txn_id` webhook twice → confirm exactly once, never double-count.
- Also required: reconcile 3-branch test, recurring-series test, tenant-isolation test (forged `?tenant_id`), pricing-resolve test, Playwright E2E booking flow.
- Concurrency tests use multiple parallel DB connections/transactions to hit the real race.

## 5. Workflow

- **Task ledger first.** Active work is coordinated via markdown task files in [`tasks/`](tasks/) (protocol: [`tasks/README.md`](tasks/README.md), index: [`tasks/BOARD.md`](tasks/BOARD.md)). The manager decomposes work into one file per task with a non-overlapping `scope`; an executing agent picks a `todo` task whose `depends_on` are `done`, **claims it by editing `status`/`owner` in the file**, works ONLY within `scope`, then returns `in-review` for the manager to verify + merge. Agents must NOT touch files owned by another `claimed`/`in-review` task.
- **Branch first.** Every task starts on a `<type>/<slug>` branch off `main` (`feat/` · `fix/` · `chore/` · `docs/`); PR into `main` after CI is green. **Never commit on `main`.** See `.claude/rules/git-workflow`.
- Tasks come from [`docs/12-lo-trinh.md`](docs/12-lo-trinh.md) milestones **M0–M7** (critical path M3 → M4 → M6). Respect each milestone's **Definition of Done** before moving on.
- Before a task: load the matching `.claude/skills/*` + `.claude/workflows/*` (§8). Read targeted, never bulk-read (`.claude/rules/context-efficiency`).
- Bugfixes: red test first → localize → minimal fix → re-check invariants (`.claude/workflows/bugfix`).
- **After every session:** append `worklogs/YYYY-MM-DD-<slug>.md` per [`worklogs/README.md`](worklogs/README.md) — Goal / Changed / Decisions / Next. Durable rules also go into CLAUDE.md / AGENTS.md / the relevant doc — worklogs are history, not truth.

## 6. Hard NOs

- ❌ Drag-and-drop site builder (templates + the `interop` embed instead).
- ❌ Metered billing (flat plan only).
- ❌ VNPay/MoMo or any payment gateway in Phase 1 (VietQR + SePay/Casso reconciliation is enough).
- ❌ A second anti-overlap path — `BookingService` + exclusion constraint is the only one.
- ❌ Microservices / multi-DB / per-vertical apps — one modular monolith on one Postgres.
- ❌ Golf/spa built or sold early — reserved doors only.
- ❌ Committing directly to `main` — always branch first, PR in (`.claude/rules/git-workflow`).
- ❌ Git mutations (commit/push/reset/rebase) without explicit user confirmation.

### Sub-agent discipline (a delegated agent MUST NOT)

- ❌ **Merge source code into `main`.** Push your code to your task branch and stop. Your ONLY write to `main` is your task's own `.md` (status/handoff signal). The **manager** reviews the branch and merges the code. (`tasks/README.md` → "separation of merge duties".)
- ❌ **Work outside its task's `scope`** — no side-effect edits to seeders, routes, config, or "unrelated improvements". Need a file outside scope → stop, mark `blocked`, flag the manager (`tasks/README.md`).
- ❌ **Rewrite a working file wholesale** — extend by adding; smallest change that meets the acceptance criteria (principle #2).
- ❌ **Add dependencies or external CDNs**, or commit **self-generated binary assets** (logos/images/fonts), without manager approval.
- ❌ **Claim a pass it did not run** — run `npm run build` / `php artisan test` / browser check and report real results; the manager re-verifies.
- ❌ **Touch a file owned by another `claimed`/`in-review` task** (`tasks/BOARD.md`).

## 7. Pointers

| Path | Use it for |
|---|---|
| `.claude/skills/architecture` | Modular monolith, 7 modules, multi-tenancy, two inventory shapes |
| `.claude/skills/booking-engine` | Concurrency chokepoint, exclusion constraint, holds, series |
| `.claude/skills/payment-reconcile` | VietQR + SePay/Casso, idempotency, 3 reconcile branches |
| `.claude/skills/vertical-dispatch` | Driver pattern — engine/calendar/pricing per tenant type |
| `.claude/skills/planning` | Planning methodology (research-first, door classification) |
| `.claude/rules/coding-rules`, `laravel-inertia` | Coding standards; Laravel/Inertia patterns |
| `.claude/rules/ui-design` | UI/design-system consistency (tokens, shared components, mobile-first) |
| `tasks/` (`README.md`, `BOARD.md`) | Active work ledger + claim protocol for delegated agents |
| `.claude/rules/security` | Tenant isolation, webhook verification, auth |
| `.claude/rules/testing` | Test standards (Postgres-only, concurrency, idempotency) |
| `.claude/rules/product-scope` | Scope guard — what's in / out |
| `.claude/rules/context-efficiency` | Read targeted, never bulk-read |
| `.claude/rules/documentation` | Mandatory worklog rules |
| `.claude/workflows/development` | Task routing, build order, verify, worklog |
| `.claude/workflows/bugfix` | Red test → localize → small fix → invariant check |
| `.claude/workflows/release-hardening` | Phase 1 pre-go-live checklist |
| `.claude/agents/explorer.md` | Read-only code/docs search → precise pointers |
| `.claude/agents/planner.md` | Requirement → phased, invariant-safe plan (no code) |
| `.claude/agents/invariant-reviewer.md` | Reviews a diff against the 6 principles |
| `.claude/commands/check-invariants.md` | `/check-invariants` — run invariant-reviewer on the diff |
| `.claude/commands/new-vertical.md` | `/new-vertical <name>` — add a vertical via the driver pattern |
