# Raw engine differences from MySQL 8.4

The raw engine stores data in DynamoDB. This page lists where its behavior differs from MySQL 8.4. Behavior not listed here matches MySQL.

## REPLACE affectedRows

`REPLACE` counts 1 for each row written. MySQL counts 2 for each row that replaces an existing, different row. The raw engine writes the rows with `TransactWriteItems`, which cannot return the replaced items, so it cannot tell which rows existed.

## UPDATE changedRows

Raw UPDATE `changedRows` does not match MySQL. The raw engine can count rows whose values did not change. MySQL counts only rows whose values changed.

## INSERT ... ON DUPLICATE KEY UPDATE

### affectedRows

Counts match MySQL when the statement's SET values are plain values (`c = VALUES(c)`, `c = 5`), increments or decrements by the inserted value (`c = c + 1` with an inserted 1), or expressions that cannot be sent to DynamoDB. The exception is a statement whose SET values can all be sent to DynamoDB as a batch update, with no repeated keys. For that statement, the raw engine cannot see whether an existing row changed:

| Row                     | MySQL 8.4 | Raw engine, batch update |
| ----------------------- | --------- | ------------------------ |
| New row                 | 1         | 1                        |
| Existing row, changed   | 2         | 2                        |
| Existing row, unchanged | 1         | 2                        |

### Atomicity

- A multi-row statement is not atomic. Each row is written separately, so an error on a later row leaves earlier rows written.
- Writes apply immediately. `ROLLBACK` does not undo an `INSERT ... ON DUPLICATE KEY UPDATE` statement. In the memory engine, `ROLLBACK` does undo it.
- If the statement repeats a key, or sets a column to an expression that cannot be sent to DynamoDB (for example, a function call), the engine reads the existing rows, computes the new values, and writes them. If another writer changes one of those rows between the read and the write, the computed values overwrite that writer's changes to the columns being set.

### Errors and retries

The raw engine does not retry. A write conflict is returned as an error.

If a row is missing when the update runs, and another writer inserts that row before the statement's insert runs, the statement fails with a `DuplicateItem` error. MySQL would update the row instead.

### Arithmetic on NULL

- `c = c + 1` on a row whose `c` is NULL returns an error. MySQL keeps `c` as NULL.
- `c = c + 1` on a row that has no `c` attribute sets `c` to 1. MySQL would keep `c` as NULL.

## INSERT without a column list

`INSERT INTO t VALUES (...)` without a column list is not supported. The statement fails with `ER_NO: Unsupport sql feature.` before it reaches DynamoDB. Use `INSERT INTO t (cols) VALUES (...)` instead.

## WHERE conditions

### Bare column as a condition

A bare column used as a condition is true when the value is not NULL, not 0, not an empty string, and not false. Numeric and boolean columns match MySQL.

For string columns, MySQL converts the string to a number to decide truth, so `'0'`, `'0.0'`, and `'x'` are false in MySQL. The raw engine treats these values as true.

- `SELECT`: The result matches MySQL. The engine removes the extra rows.
- `UPDATE` and `DELETE`: These statements can change or delete rows that MySQL would not match. For example, `DELETE FROM t WHERE s` deletes rows where `s` is `'x'`.

`NOT col` has the same behavior and the same string difference.

`col IS TRUE` and `col IS FALSE` are not sent to DynamoDB.

### Comparisons do not convert types

The raw engine compares values by their DynamoDB attribute type. It does not convert strings to numbers as MySQL does. For example, if `id` is a string attribute, `WHERE id > 100` matches no rows. MySQL converts `'111'` to 111 and matches `'111'` through `'115'`.

## String collation

String columns on the raw engine behave as `utf8mb4_0900_bin`. Comparisons, sorting, and `DISTINCT` are case-sensitive and accent-sensitive, and trailing spaces are significant. MySQL's default `utf8mb4_0900_ai_ci` ignores case and accents.

The raw engine supports only `utf8mb4_0900_bin` for string columns. PAD collations (`utf8mb4_bin`, `utf8mb4_general_ci`, and others) do not apply trailing-space padding to column comparisons. An explicit `COLLATE utf8mb4_bin` on a column compares the same way as `utf8mb4_0900_bin`. MySQL's result for these queries can depend on the access path, so DynamoSQL does not match MySQL in these cases.

## JOIN USING on sparse tables

Raw tables have no schema. For `JOIN ... USING (col)`, the engine decides which table owns `col` from the first row of each table, in FROM order. The first table whose first row has `col` owns it. If no earlier table's first row has `col`, the engine uses the previous table in FROM order.

If the first row of a table lacks a column that later rows have, the join can match on the wrong table.

## Column metadata

Raw tables store only their key attributes in DynamoDB. `SHOW COLUMNS` and `information_schema.COLUMNS` list only the key columns for a raw table. Non-key columns do not appear, and the rows for key columns do not carry MySQL's nullability, default, comment, or collation details from the table definition.

## Indexes

- `UNIQUE` is not supported on DynamoDB tables. `CREATE UNIQUE INDEX`, `UNIQUE` column and table constraints, and `ALTER TABLE ... ADD UNIQUE` fail with `ER_NO`. Memory tables enforce `UNIQUE`.
- `CREATE INDEX` on a DynamoDB table creates a global secondary index. The `USING BTREE` and `USING HASH` clauses are ignored.
