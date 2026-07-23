---
id: T00
title: <tiêu đề ngắn>
status: todo            # todo | claimed | in-review | done | blocked
owner: "-"              # tên/agent-id đã nhận, hoặc "-"
priority: P1            # P0 (chặn) | P1 | P2 | P3
depends_on: []          # danh sách id phải done trước, vd [T01]
branch: <type>/<slug>   # nhánh làm task này
scope:                  # RANH GIỚI file được sửa — không chồng task khác
  - apps/app/...
updated: 2026-07-23
---

## Mục tiêu
<1-3 câu: làm gì, vì sao>

## Bối cảnh / tham chiếu
<link doc, file mẫu, screenshot, quyết định thiết kế đã chốt>

## Yêu cầu (acceptance criteria)
- [ ] ...
- [ ] ...

## Ngoài phạm vi (KHÔNG làm ở task này)
- ...

## Verification (agent điền trước khi in-review)
- [ ] `npm run build` pass
- [ ] `php artisan test` (nếu đụng backend): X/Y
- [ ] Kiểm browser (owner@pickleball.vn): ...

## Nhật ký
- 2026-07-23 · created by manager
