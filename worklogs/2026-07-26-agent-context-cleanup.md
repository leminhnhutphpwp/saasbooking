# Agent context cleanup

**Goal:** Reduce stale and duplicated context so agents reach current truth quickly.

**Changed:** Removed completed task files and obsolete status snapshots; reduced root and `.claude` entrypoints; consolidated payment guidance; replaced the historical WBS roadmap with current go-live priorities; removed stale UI/pre-build docs and low-value cosmetic worklogs.

**Decisions:** `docs/` is current product/architecture truth, `tasks/` is active work only, `worklogs/` is selected history, and Git retains deleted task/detail history. Completed task files must be removed after merge.

**Next:** Keep new documentation in the narrowest existing source of truth; do not recreate parallel status files or cosmetic worklogs.
