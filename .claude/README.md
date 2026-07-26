# Agent resources

Load these files only when the task matches. Always-on context belongs in root `CLAUDE.md` and `AGENTS.md`; product truth belongs in `docs/`.

## Skills

| Skill | Use for |
|---|---|
| `architecture` | Module boundaries, multi-tenancy, inventory shapes |
| `booking-engine` | Holds, exclusion constraints, lifecycle, recurrence |
| `court-catalog` | Courts, categories, opening and pricing rules |
| `module-connections` | OWNS/REFERENCES, Services, domain events |
| `notification-zalo` | ZNS templates, queueing, retry |
| `payment-flow` | VietQR, webhook idempotency, reconciliation and refunds |
| `tenant-isolation` | WorkingTenant, memberships, FK/RLS defense |
| `vertical-dispatch` | Service/vertical registry and inventory drivers |
| `planning` | Research-first phased plans and reserved doors |

## Rules

- `coding-rules`, `laravel-inertia`: implementation conventions
- `security`, `testing`: security boundaries and PostgreSQL test requirements
- `ui-design`: existing visual system and responsive behavior
- `product-scope`: Phase-1 scope guard
- `context-efficiency`: targeted reading
- `documentation`: worklog convention
- `git-workflow`: branch and review flow

## Workflows

- `development`: normal feature work
- `bugfix`: failing test → localization → minimal fix
- `release-hardening`: go-live checks

## Agents and commands

- `explorer`, `planner`, `invariant-reviewer`, `module-reviewer`, `vertical-tester`
- `/check-invariants`, `/new-vertical`

Generated/vendor trees (`vendor`, `node_modules`, build output) are not sources of truth.
