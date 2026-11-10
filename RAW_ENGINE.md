# Raw engine: INSERT ... ON DUPLICATE KEY UPDATE

The raw engine (DynamoDB) implements `ON DUPLICATE KEY UPDATE` in three paths. The differences from MySQL below are deliberate. The raw engine trades exact `affectedRows` and `changedRows` for stronger transaction behavior. It avoids retries and avoids reading rows the statement does not need.

The memory engine follows MySQL counts exactly and is unaffected.

## The three paths

The engine picks a path per statement.

**Path A: one UpdateItem per row.** Used when every `SET` value either equals the inserted value for that column, or is an increment or decrement by the inserted value. Examples:

- `ON DUPLICATE KEY UPDATE c = VALUES(c)`
- `VALUES (k, 1) ... ON DUPLICATE KEY UPDATE c = c + 1`
- `VALUES (k, 5) ... ON DUPLICATE KEY UPDATE c = 5`

Each row is one `UpdateItem` call with `ReturnValues: ALL_OLD`. The call returns the previous item, so the engine knows whether the row existed and whether it changed. The call has no condition, so it never fails because of a concurrent write.

**Path B: batch PartiQL.** Used when every `SET` value translates to PartiQL and no key repeats in the statement. The engine sends one batch `UPDATE` for all rows, then one batch `INSERT` for the rows whose update failed with `ConditionalCheckFailed`. It does not read rows first.

**Path C: read, then write.** Used when a `SET` value cannot be translated to PartiQL (for example, it calls a function), or when a key repeats in the statement. The engine runs one `SELECT ... WHERE key IN (...)` for the keys in the statement, applies the rows in order in memory, then calls `multipleUpdate` for changed existing rows and `insertRowList` for new rows.

Statements that set a key column are rejected with `unsupported`. DynamoDB keys cannot change in an update.

## Differences from MySQL

### affectedRows

| Path | New row   | Existing row, changed | Existing row, unchanged |
| ---- | --------- | --------------------- | ----------------------- |
| A    | 1 (exact) | 2 (exact)             | 1 (exact)               |
| B    | 1 (exact) | 2 (assumed changed)   | 2 (assumed changed)     |
| C    | 1 (exact) | 2 (exact)             | 1 (exact)               |

Path B cannot see the previous row, because a batch `UPDATE` does not return it. It reports every matched row as changed. An update that leaves a row unchanged is counted as 2 instead of 1.

### changedRows

MySQL's driver reports `changedRows` as the number of input rows that hit an existing key, read from the server's row-count message. The message appears for multi-row `VALUES` and for `INSERT ... SELECT`. For a single-row `VALUES` or `INSERT ... SET`, the message is absent and `changedRows` is 0.

The raw engine follows that rule. Paths A and C report the duplicate count exactly. Path B reports the number of matched rows, which is the same duplicate count, because it does not check whether the rows changed.

### Atomicity

| Path | Behavior                                                                                                                                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | Each row is one atomic `UpdateItem`. A multi-row statement is not atomic: a later row can fail after an earlier row was written.                                                                                           |
| B    | Each batch statement succeeds or fails on its own. A multi-row statement can partly apply.                                                                                                                                 |
| C    | The read and the writes are separate. A row changed by another writer between the read and the write has its changed columns overwritten with values computed from the stale read. A multi-row statement can partly apply. |

The raw engine applies each write immediately. A `ROLLBACK` does not undo an ODKU statement. The memory engine applies the whole statement inside the session transaction, so `ROLLBACK` undoes it.

### Retries

The raw engine does not retry. A conflict is returned as an error. In path B, if a row was missing when the update ran but another writer inserts it before the batch `INSERT` runs, the `INSERT` fails with `DuplicateItem` and the error is returned. In path C, a failed write is returned as an error.

### Arithmetic on NULL

`ADD` treats a missing attribute as 0. If the existing attribute is NULL, DynamoDB rejects the `ADD`, and the error is returned. MySQL keeps NULL in this case.

## Why these differences are accepted

Exact counts would need a read of every row before each write, and a read cannot be made atomic with the write without retries. Path A and path B avoid that read on the common case. Path C reads only the rows the statement touches. The cost is a small mismatch in counts and a weaker transaction boundary for multi-row statements. These trade-offs are intentional.

# Raw engine: INSERT without a column list

`INSERT INTO t VALUES (...)` without a column list is not supported on the raw engine. DynamoDB tables have no schema, so the engine cannot map positional values to columns. The statement fails with `ER_NO: Unsupport sql feature.` before it reaches DynamoDB. Use `INSERT INTO t (cols) VALUES (...)` instead.

# Raw engine: WHERE conditions

The raw engine sends WHERE conditions to DynamoDB as PartiQL. DynamoDB compares values by attribute type and does not convert strings to numbers the way MySQL does. The two differences below are design decisions.

## Bare column as a condition

`WHERE col` is sent as `(col IS NOT NULL AND col <> 0 AND col <> '' AND col <> false)`. The condition keeps every row that MySQL treats as true. For number and boolean columns it is exact, and it also drops NULL and empty strings correctly.

For string columns it is not exact. MySQL converts a string to a number to decide truth, so `'0'`, `'0.0'`, and `'x'` are false in MySQL. The raw engine keeps those rows.

- `SELECT`: the engine applies the full WHERE to every row in memory, so the extra rows are removed. The result matches MySQL.
- `UPDATE` and `DELETE`: the condition is the filter. A bare string column can change or delete rows that MySQL would keep, for example rows where `col = 'x'`.

`NOT col` is sent as `NOT (col IS NOT NULL AND col <> 0 AND col <> '' AND col <> false)`, so it has the same boolean behavior and the same string errata. `col IS TRUE` and `col IS FALSE` are not sent to DynamoDB. The bare column is unsupported there, so the statement uses the general path.

## Comparisons do not convert types

The raw engine sends a comparison as written. `WHERE id > 100` on a string attribute compares the string with the number, and DynamoDB matches no rows. MySQL converts `'111'` to 111 and matches rows `'111'` to `'115'`.

The memory engine converts values the way MySQL does, so the same query works there. The raw engine does not add the conversion.

# Raw engine: JOIN USING on sparse tables

Raw tables have no schema, so `JOIN ... USING (col)` decides which table owns `col` from the first row of each table, in FROM order. The first table whose first row has `col` owns it. If no earlier table's first row has `col`, the join uses the previous table in FROM order. For a sparse table, where the first row lacks a column that later rows have, the join can match on the wrong table. This is accepted.

# Raw engine: named locks

`GET_LOCK`, `RELEASE_LOCK`, `IS_FREE_LOCK`, `IS_USED_LOCK`, and `RELEASE_ALL_LOCKS` store leases in the `__dynamosql_locks` table. The partition key is `lock_key`, set to `${transactionDomain}_${name}`. Each lease keeps `owner_id` and `expires_at`, where `expires_at` is epoch seconds. `expires_at` is the table's TTL attribute, so DynamoDB deletes expired rows in the background. A released lease sets `expires_at` to one second in the past, so the row is expired immediately and DynamoDB removes it on a later TTL sweep. A lease lasts 10 seconds, and the holding session renews it every second while it holds the lock. A session that ends releases its leases in the background. Lease checks ignore expired rows, because TTL deletion can lag expiry by up to 48 hours.

Lock names are case-insensitive, as in MySQL. Names are limited to 64 bytes. A NULL or empty name raises `ER_USER_LOCK_WRONG_NAME`.

Lock calls are supported only in the select list of a SELECT. A lock call anywhere else, such as WHERE, HAVING, or ORDER BY, raises `ER_FEATURE_UNSUPPORTED`. Lock arguments may be column values, which are evaluated per row.

`IS_USED_LOCK` returns the session's thread id, not the MySQL connection id. The owner string is `${threadId}_${uuid}`, so the thread id is the only part that matches a connection id here.

# Raw engine limitation: UNIQUE indexes

The raw engine does not support UNIQUE indexes, and it will not. `CREATE UNIQUE INDEX`, `UNIQUE` column and table constraints, and `ALTER TABLE ... ADD UNIQUE` are rejected with the `unsupported` error (`ER_NO`) on DynamoDB tables. DynamoDB global secondary indexes cannot enforce uniqueness, so this is a permanent limitation of the engine. Memory tables enforce UNIQUE; see `test/memory/memory_unique.sql`.
