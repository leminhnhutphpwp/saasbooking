# .claude — project agent configuration

Claude Code configuration for the **SÂN** court-booking project. Project context and the non-negotiable invariants live in the root [`../CLAUDE.md`](../CLAUDE.md) (auto-loaded every session); the detailed rulebook is [`../AGENTS.md`](../AGENTS.md); the full design spec is in [`../docs/`](../docs/README.md) (Vietnamese). This folder holds the deeper, on-demand material those files point to. Agent-facing config here is in English.

## Layout

```
.claude/
├── settings.json         # shared: permission allow/ask/deny (see below)
├── settings.local.json   # personal overrides (git-ignored)
│
├── agents/               # subagents — invoke via the Agent tool (subagent_type: <name>)
│   ├── invariant-reviewer.md  # reviews a diff against the 6 core invariants
│   ├── planner.md             # turns a requirement into a phased, invariant-safe plan (no code)
│   └── explorer.md            # read-only code/docs search → precise pointers
│
├── skills/               # on-demand domain knowledge (Skill tool) — SKILL.md per folder
│   ├── architecture/          # modular monolith, 7 modules, multi-tenancy, two inventory shapes
│   ├── booking-engine/        # the concurrency chokepoint, exclusion constraint, holds, series
│   ├── payment-reconcile/     # VietQR + SePay/Casso, idempotency, 3 reconcile branches
│   ├── vertical-dispatch/     # driver pattern — engine/calendar/pricing per tenant type
│   └── planning/              # planning methodology
│
├── rules/                # coding standards (reference) — SKILL.md per folder
│   ├── coding-rules/   laravel-inertia/   product-scope/
│   ├── security/       testing/           logging? (n/a)
│   ├── context-efficiency/    # read targeted, never bulk-read
│   └── documentation/         # mandatory worklog rules
│
├── workflows/            # step-by-step processes — SKILL.md per folder
│   ├── development/      # task routing, build order, verify, worklog
│   ├── bugfix/           # red test first → localize → small fix → invariant check
│   └── release-hardening/# Phase 1 pre go-live checklist
│
└── commands/             # slash commands
    ├── check-invariants.md    # /check-invariants → run the invariant-reviewer on the diff
    └── new-vertical.md        # /new-vertical <name> → add a vertical via the driver pattern
```

## How Claude Code uses this

| Mechanism | What loads | When |
|---|---|---|
| `../CLAUDE.md` | Always-on project memory + invariants | Every session, automatic |
| `../AGENTS.md` | Detailed rulebook (navigation, conventions, workflow, hand-off) | Read when working |
| `agents/*.md` | Subagent definitions | When delegating via the Agent tool |
| `skills/*/SKILL.md`, `commands/*.md` | Skill / command instructions | On demand via the Skill tool |
| `rules/`, `workflows/` | Reference docs | Read when the task matches |

## settings.json

- **allow** — routine Laravel/Docker/git commands run without a prompt.
- **ask** — destructive/irreversible ops prompt first: `migrate:fresh`, `db:wipe`, `git push`.
- **deny** — never read generated/vendored trees (`vendor/`, `node_modules/`, build output).

## Conventions

Stack and patterns mirror the template project `/Users/nhut/Documents/appdhv` (Laravel + Inertia + PostgreSQL, `WorkingTenant`, `Auditable`, `id`+`uuid`, Horizon). Design docs are Vietnamese; this config and `CLAUDE.md`/`AGENTS.md` are English.
