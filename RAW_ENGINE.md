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

| Path | New row | Existing row, changed | Existing row, unchanged |
|---|---|---|---|
| A | 1 (exact) | 2 (exact) | 1 (exact) |
| B | 1 (exact) | 2 (assumed changed) | 2 (assumed changed) |
| C | 1 (exact) | 2 (exact) | 1 (exact) |

Path B cannot see the previous row, because a batch `UPDATE` does not return it. It reports every matched row as changed. An update that leaves a row unchanged is counted as 2 instead of 1.

### changedRows

MySQL's driver reports `changedRows` as the number of input rows that hit an existing key, read from the server's row-count message. The message appears for multi-row `VALUES` and for `INSERT ... SELECT`. For a single-row `VALUES` or `INSERT ... SET`, the message is absent and `changedRows` is 0.

The raw engine follows that rule. Paths A and C report the duplicate count exactly. Path B reports the number of matched rows, which is the same duplicate count, because it does not check whether the rows changed.

### Atomicity

| Path | Behavior |
|---|---|
| A | Each row is one atomic `UpdateItem`. A multi-row statement is not atomic: a later row can fail after an earlier row was written. |
| B | Each batch statement succeeds or fails on its own. A multi-row statement can partly apply. |
| C | The read and the writes are separate. A row changed by another writer between the read and the write has its changed columns overwritten with values computed from the stale read. A multi-row statement can partly apply. |

The raw engine applies each write immediately. A `ROLLBACK` does not undo an ODKU statement. The memory engine applies the whole statement inside the session transaction, so `ROLLBACK` undoes it.

### Retries

The raw engine does not retry. A conflict is returned as an error. In path B, if a row was missing when the update ran but another writer inserts it before the batch `INSERT` runs, the `INSERT` fails with `DuplicateItem` and the error is returned. In path C, a failed write is returned as an error.

### Arithmetic on NULL

`ADD` treats a missing attribute as 0. If the existing attribute is NULL, DynamoDB rejects the `ADD`, and the error is returned. MySQL keeps NULL in this case.

## Why these differences are accepted

Exact counts would need a read of every row before each write, and a read cannot be made atomic with the write without retries. Path A and path B avoid that read on the common case. Path C reads only the rows the statement touches. The cost is a small mismatch in counts and a weaker transaction boundary for multi-row statements. These trade-offs are intentional.
