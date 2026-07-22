---
name: git-workflow
description: Branch + PR workflow for SÂN — never commit to main directly; one short-lived branch per task
metadata:
  scope: global
  type: rules
---

# Git Workflow

## 🔴 Never commit to `main` directly

Every change goes on a short-lived branch, then a PR into `main`. `main` stays green and deployable at all times. This applies even for a solo dev — it keeps history reviewable and CI gating real.

## Branch naming

`<type>/<short-slug>` — `type` ∈ `feat` · `fix` · `chore` · `docs` · `refactor` · `test`.
Milestone work: `feat/m<N>-<slug>`.

Examples: `feat/m6-config-ui` · `fix/reconcile-savepoint` · `chore/compose-naming` · `docs/erd-plural`.

## Flow (per task)

1. Start from an up-to-date `main`: `git switch main && git pull`, then `git switch -c feat/<slug>`.
2. Commit on the branch — small, verifiable commits. Run `php artisan test` + `pint --test` **before** pushing.
3. `git push -u origin feat/<slug>`.
4. `gh pr create` → PR into `main` with a summary; wait for CI green.
5. Squash-merge → delete the branch.

## Rules

- **One branch per task/milestone** — don't mix unrelated work.
- Rebase or merge latest `main` before opening the PR if it drifted.
- **Commit / push / open-PR / merge only when the user asks** (see `CLAUDE.md` hard-NOs).
- Never force-push `main`; never commit secrets or `.env`.
- If you find yourself on `main` with changes to commit, **branch first** (`git switch -c ...`) — do not commit on `main`.

## When to use

At the **START of any coding task** — branch first, before the first edit.
