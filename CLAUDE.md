# SÂN — Court Booking SaaS

Booking SaaS for **pickleball / badminton courts** in Vietnam: every court owner gets their **own booking page** + **VietQR deposit to fight no-shows** + **Zalo reminders**. Solo dev, Vietnam market.

**Status:** BUILD phase (M0–M3 done — see `worklogs/`). The full spec lives in `docs/` — **start at [`docs/README.md`](docs/README.md)** (5 parts: Direction → UI → Architecture → Risk → Delivery). Docs are Vietnamese. The detailed agent rulebook is [`AGENTS.md`](AGENTS.md).

**Repo layout (monorepo):** the Laravel + Inertia app is in **`apps/app/`** — run `artisan` / `composer` / `npm` / tests from there (`cd apps/app` or `docker compose exec app …`). The repo root holds project-level `docs/`, `.claude/`, `worklogs/`, `CLAUDE.md`, `AGENTS.md`, and `docker-compose.yml`.

**Git:** never commit to `main` directly — branch per task (`<type>/<slug>`), PR into `main`. See [`.claude/rules/git-workflow`](.claude/rules/git-workflow/SKILL.md).

## Stack (mirrors the template project `/Users/nhut/Documents/appdhv`)

Laravel 13 + Inertia 2 + React 18 + **PostgreSQL** · Horizon queue · shadcn/ui + Tailwind. Patterns taken from appdhv: `Support/WorkingTenant` (like its `WorkingSchool`), `Concerns/Auditable` trait, models with `id` bigint + `uuid` (route key), Breeze + Ziggy + Sanctum.

## Platform principles — an agent MUST keep these when proposing or writing anything

1. **ONE SYSTEM, MANY PRODUCT LINES.** Golf, spa, or any new tenant type / vertical is a **configuration running on the shared platform**, NOT a separate app or system. "Separate beachhead / product line" refers only to market & go-to-market (customers, pricing, sales channel); it still shares one backend. Split the *system* only on real SLA / scale / team signals (virtually never at solo scale).
2. **ALWAYS LEAVE DOORS OPEN (extend by ADDING, never by breaking the core).** New tenant type / inventory shape / vertical / feature must be reachable by adding tables·modules·config·enums. Every proposal classifies each item as **do now / 🚪 reserved door / ❌ not doing** (see [`docs/09-kien-truc-mo-rong.md`](docs/09-kien-truc-mo-rong.md)).
3. **Tenant isolation via `WorkingTenant`** — the SINGLE source of truth for which venue a request belongs to; never trust the payload; non-operators are hard-clamped to `users.tenant_id`. Every business query is scoped by `tenant_id`.
4. **`BookingService` is the ONLY concurrency chokepoint.** Prevent double-booking via a Postgres **exclusion constraint** (courts) / conditional counter UPDATE (capacity). No check-then-act, no second anti-overlap path.
5. **Two inventory shapes** meet at the `booking` layer: *resource-time-slot* (courts, spa) and *capacity/session* (golf tee-time, classes, events). The core (booking lifecycle, deposit/reconcile, Zalo, tenant, interop) is reused for both.
6. **Data invariants:** snapshot price/deposit at booking time · money as `BIGINT` (integer VND) · `timestamptz` + `tz` for recurring rules · status as ENUM (state machine) · refunds are a separate ledger (`payments.amount` is immutable). Details in [`docs/11-diem-vo.md`](docs/11-diem-vo.md).

## Niche & scope

Beachhead = pickleball/badminton courts. NOT building: drag-and-drop site builder (use templates + the `interop` embed), metered billing, payment gateways (VietQR + SePay/Casso reconciliation is enough). Golf/spa = reserved-door verticals — **do not build or sell them early** (avoid diluting focus).
