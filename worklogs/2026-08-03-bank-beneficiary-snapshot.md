# 2026-08-03 - Bank beneficiary snapshot

**Goal:** Keep pending VietQR recipient details and reconciliation identity stable through tenant bank-account rotation.
**Changed:** Added payment recipient snapshot migration, deposit/public-status/reconciliation handling, webhook authorization guard, focused PostgreSQL coverage, and payment edge-case docs.
**Decisions:** Payment snapshots include only provider, config ID, BIN, account number, and account name, never webhook secrets. A deactivated account accepts its signed webhook only while an awaiting payment snapshot names it. Legacy payments fall back to the current active account because their historical recipient cannot be inferred safely.
**Next:** Deploy the migration before rotating production bank accounts; configure each tenant's real active bank account and webhook secret separately.
