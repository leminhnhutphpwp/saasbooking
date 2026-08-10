---
name: design-review
description: Review recently written UI against the design system and report violations with fixes. Run manually with /design-review.
disable-model-invocation: true
context: fork
agent: design-reviewer
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git status *)
argument-hint: [path, or leave empty to review the current diff]
---

Review UI within scope: $ARGUMENTS. Read the design-system skill and matching reference.
Report blocking literal colors/arbitrary values, missing focus, color-only state, 360px
overflow, and unsupported fonts. Do not edit code; cite file:line and the relevant token.
