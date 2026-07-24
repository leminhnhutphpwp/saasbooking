#!/usr/bin/env bash
# scripts/task-status.sh — Update task status in task files
#
# Usage:
#   bash scripts/task-status.sh <task_id> <status>
#
# Examples:
#   bash scripts/task-status.sh T12 done
#   bash scripts/task-status.sh T15 in-review
#   bash scripts/task-status.sh T08 claimed
#
# This script finds the task file (tasks/T12-*.md) and updates the status field.

set -e

if [ $# -ne 2 ]; then
    echo "Usage: $0 <task_id> <status>"
    echo "Example: $0 T12 done"
    echo "Valid statuses: todo, claimed, in-review, done"
    exit 1
fi

TASK_ID="$1"
STATUS="$2"

# Validate status
case "$STATUS" in
    todo|claimed|in-review|done)
        ;;
    *)
        echo "Error: Invalid status '$STATUS'"
        echo "Valid statuses: todo, claimed, in-review, done"
        exit 1
        ;;
esac

# Find task file
TASK_FILE=$(ls "tasks/${TASK_ID}-"*.md 2>/dev/null | head -1)

if [ -z "$TASK_FILE" ]; then
    echo "Error: No task file found for $TASK_ID"
    echo "Expected: tasks/${TASK_ID}-*.md"
    exit 1
fi

echo "Updating $TASK_FILE to status: $STATUS"

# Update status in file (macOS and Linux compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/status: .*/status: $STATUS/" "$TASK_FILE"
else
    sed -i "s/status: .*/status: $STATUS/" "$TASK_FILE"
fi

echo "✓ Updated successfully"
echo ""
echo "Next steps:"
echo "  git add $TASK_FILE"
echo "  git commit -m 'chore: update $TASK_ID status to $STATUS'"
