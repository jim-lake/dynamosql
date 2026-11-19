# MVCC implementation plan

Storage behavior: [MVCC_STORAGE_SPEC.md](MVCC_STORAGE_SPEC.md). Key encodings: [MVCC_INDEX_ENCODING.md](MVCC_INDEX_ENCODING.md).

1. Register `mvcc` and implement the engine interface using existing SQL conversion/comparison helpers.
2. Add transaction context and statement rollback. Keep read snapshots alive through iterator completion/cancellation and explicit transaction lifetime.
3. Route schema lookup, SHOW, and information_schema through the snapshot catalog. Implement DDL through fresh generations and transaction resource intents.
4. Reject persistent writes spanning independent domains/engines before mutation. Preserve temporary-table behavior.
5. Implement the specified transaction-first flow, UUID retry resolution, concurrent staging, conditional head publication, reader retention, and vacuum.
   - Build secondary keys from the declared index tuple, TX_ID, and per-index change ordinal. Enforce the 1012-byte tuple budget and retain the target PK on each item.
6. Test independent processes, competing writers, ambiguous allocation/commit, delayed staging, partial spills, statement rollback, DDL cleanup, reader expiry, and overlapping vacuum. Inject crashes between durable writes.
   - Cover duplicate and NULL-containing index tuples across query pages, unique-key reassignment, tombstones, ordinal reuse on staging retries, and the tuple-size and ordinal limits.
7. Compare supported SQL with MySQL; document isolation differences. Run typecheck, lint, and full tests; measure point latency, scan memory, and conflict retries.
