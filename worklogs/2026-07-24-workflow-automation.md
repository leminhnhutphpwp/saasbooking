# Workflow Automation - 2026-07-24

## Tóm tắt
Tự động hóa task management để giảm friction trong quy trình làm việc.

## Vấn đề
1. Manager phải update thủ công 6 task files sau mỗi đợt merge
2. Worker có thể start task trước khi dependency done
3. Conflict khi nhiều branch cùng edit task files

## Giải pháp

### 1. Auto-update task status
**File:** `.github/workflows/update-task-status.yml`
- Trigger: khi PR merge vào main
- Extract task ID từ PR title (pattern: `T[0-9]+`)
- Find task file: `tasks/${TASK_ID}-*.md`
- Update status: `in-review`/`claimed` → `done`
- Auto-commit: `chore: mark T12 as done (merged via PR #24)`

### 2. Task status helper script
**File:** `scripts/task-status.sh`
- Update task status thủ công: `bash scripts/task-status.sh T12 done`
- Validate status: todo/claimed/in-review/done
- Compatible macOS + Linux

### 3. Dependency check
**Files:** `scripts/check-deps.sh` + CI integration
- Check dependencies từ task file `depends_on` field
- CI check khi tạo PR
- Block nếu dependencies chưa done

## Convention

### PR title format
```
feat(T12): Description
fix(T15): Description
chore(T17): Description
```

### Task file format
```yaml
---
id: T12
title: Home dashboard redesign
status: done  # todo | claimed | in-review | done
depends_on: [T11]
---
```

## Kết quả
- ✅ Auto-update khi PR merge (giảm 6 manual updates)
- ✅ CI block nếu dependency chưa done
- ✅ Worker ít edit task files hơn

## Files changed
- `.github/workflows/update-task-status.yml` (new)
- `.github/workflows/ci.yml` (add dependency check step)
- `scripts/task-status.sh` (new)
- `scripts/check-deps.sh` (new)

## Next PR
#24 - feat(workflow): auto-update task status + dependency check
