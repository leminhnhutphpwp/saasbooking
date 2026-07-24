#!/usr/bin/env bash
# scripts/check-deps.sh — Check if task dependencies are satisfied
#
# Usage:
#   bash scripts/check-deps.sh <pr_title>
#
# Example:
#   bash scripts/check-deps.sh "feat(T12): Home dashboard redesign"
#
# This script extracts the task ID from PR title, reads its dependencies,
# and verifies they are all marked as done.

set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <pr_title>"
    exit 1
fi

PR_TITLE="$1"

# Extract task ID from PR title
TASK_ID=$(echo "$PR_TITLE" | grep -oE 'T[0-9]+' | head -1 || true)

if [ -z "$TASK_ID" ]; then
    echo "No task ID found in PR title, skipping dependency check"
    exit 0
fi

# Find task file
TASK_FILE=$(ls "tasks/${TASK_ID}-"*.md 2>/dev/null | head -1 || true)

if [ -z "$TASK_FILE" ] || [ ! -f "$TASK_FILE" ]; then
    echo "Task file not found for $TASK_ID, skipping dependency check"
    exit 0
fi

echo "Checking dependencies for $TASK_ID ($TASK_FILE)"

# Extract depends_on line
DEPS_LINE=$(grep "^depends_on:" "$TASK_FILE" | head -1 || true)

if [ -z "$DEPS_LINE" ]; then
    echo "✓ No dependencies defined"
    exit 0
fi

# Parse dependencies (format: depends_on: [T11] or depends_on: [T11, T12])
DEPS=$(echo "$DEPS_LINE" | grep -oE 'T[0-9]+' || true)

if [ -z "$DEPS" ]; then
    echo "✓ No dependencies found in depends_on field"
    exit 0
fi

echo "Dependencies: $DEPS"

# Check each dependency
FAILED=0
for DEP in $DEPS; do
    DEP_FILE=$(ls "tasks/${DEP}-"*.md 2>/dev/null | head -1 || true)

    if [ -z "$DEP_FILE" ] || [ ! -f "$DEP_FILE" ]; then
        echo "✗ Dependency $DEP: task file not found"
        FAILED=1
        continue
    fi

    DEP_STATUS=$(grep "^status:" "$DEP_FILE" | head -1 | awk '{print $2}')

    if [ "$DEP_STATUS" != "done" ]; then
        echo "✗ Dependency $DEP: status is '$DEP_STATUS' (expected 'done')"
        FAILED=1
    else
        echo "✓ Dependency $DEP: done"
    fi
done

if [ $FAILED -eq 1 ]; then
    echo ""
    echo "Error: Not all dependencies are satisfied"
    exit 1
fi

echo ""
echo "✓ All dependencies satisfied"
