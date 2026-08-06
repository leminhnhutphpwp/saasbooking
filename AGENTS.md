# AGENTS.md — SÂN working rules

SÂN is a Laravel + Inertia booking SaaS for pickleball/badminton venues in Vietnam. The app is in `apps/app/`; the root contains product docs, agent guidance, active tasks, and worklogs.

## Start here

1. Read [`CLAUDE.md`](CLAUDE.md) for the six non-negotiable invariants.
2. Read [`docs/README.md`](docs/README.md) and open only the docs relevant to the task.
3. Check [`tasks/BOARD.md`](tasks/BOARD.md) before editing. `tasks/` contains active work only.
4. Load the matching rule/skill from [`.claude/README.md`](.claude/README.md).

Do not bulk-read `docs/`, `.claude/`, or `worklogs/`. Worklogs are history, not current truth.

## Repository

- App: `apps/app/`
- Stack: Laravel 13, Inertia 2, React 18, PostgreSQL, Horizon, shadcn/ui, Tailwind
- Run PHP/Composer/npm commands from `apps/app/` or through Docker Compose at the root.
- Feature tests require PostgreSQL; never substitute SQLite.

## Implementation rules

- Resolve tenant context only through `WorkingTenant`; never trust `tenant_id` from payload.
- Scope every business query by `tenant_id`.
- All slot acquisition goes through `BookingService`; Postgres constraints decide races.
- Respect module ownership. Cross-module writes call the owning module's public Service.
- Snapshot prices, deposits, and historical policy values at booking time.
- Store VND as integer `BIGINT`; time as `timestamptz`; recurring wall time with `tz`.
- Use enums/state machines for statuses. Refunds are separate ledger rows; payment amounts are immutable.
- Models use bigint `id`, UUID route key, `SoftDeletes`, and `Auditable` where applicable.
- Reads return `Inertia::render`; writes return redirects with flash messages.
- Async side effects use queued listeners/jobs after commit.

## Workflow

- Create a branch from `main` for each task. Never commit directly to `main`.
- Do not commit, push, merge, reset, or rebase without explicit user approval.
- For substantial/delegated work, create one scoped task from `tasks/_TEMPLATE.md` and claim it before editing.
- Do not touch files owned by another `claimed` or `in-review` task.
- Make the smallest correct change. Do not add compatibility layers or dependencies without a concrete need.
- Bugfixes start with a failing test, then a minimal fix and invariant check.
- Verify the actual change: Pint, relevant PostgreSQL tests, frontend build, and browser check when UI changes.
- Interactive UI changes require browser observation at approximately 390px and 1440px: exercise the changed control and check hover, pointer cursor, keyboard focus, disabled/selected states, and horizontal overflow. Capture screenshots of the reviewed states outside the repository and record the real result.
- During browser checks, inspect console errors, uncaught page errors, and failed requests. A missing Playwright browser executable or unavailable test container is test infrastructure, not an application regression; fix or switch to the pinned browser runner before judging the UI.
- CDP browser control uses a Chrome/Chromium DevTools endpoint (for example `http://127.0.0.1:9225`), not the project URL. List a browser target first, navigate that target to the app URL (for example `http://localhost:8000`), then snapshot/click/evaluate/screenshot the selected tab. Bind DevTools to `127.0.0.1` only.
- After a meaningful session, add a short worklog: Goal / Changed / Decisions / Next.
- After merge, remove the completed task file; Git history and worklogs retain the record.

## Scope boundaries

- No drag-and-drop builder, metered billing, microservices, per-vertical apps, or Phase-1 payment gateways beyond VietQR reconciliation.
- Golf/spa/capacity inventory remain reserved doors until explicitly scheduled.
- No second overlap-checking path, external CDN, generated binary asset, or unverified test claim.

## Detailed references

- Product and architecture: [`docs/README.md`](docs/README.md)
- Active coordination: [`tasks/README.md`](tasks/README.md)
- Rules, skills, workflows, agents: [`.claude/README.md`](.claude/README.md)
- Historical handoffs: [`worklogs/README.md`](worklogs/README.md)
