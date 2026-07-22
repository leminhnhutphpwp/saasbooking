# worklogs/ — agent hand-off log

Short, append-only notes so the next agent (or the next session) knows what was done and why, without re-reading everything. Mirrors the hand-off convention from the template project `appdhv`.

## Convention

- One file per work session: `YYYY-MM-DD-<short-slug>.md` (use the real date; ask the user or read the environment if unsure).
- Keep it short. Template:

```markdown
# <date> — <what you worked on>

**Goal:** one line.
**Changed:** files/areas touched (paths).
**Decisions:** anything non-obvious a future agent must respect (link to CLAUDE.md / docs if it became a rule).
**Next:** the obvious next step, and any open question.
```

- Record DECISIONS and RATIONALE, not a diff (git already has the diff).
- If a decision becomes a durable rule, also put it in `CLAUDE.md` / `AGENTS.md` / the relevant `docs/` file — worklogs are history, not the source of truth.
