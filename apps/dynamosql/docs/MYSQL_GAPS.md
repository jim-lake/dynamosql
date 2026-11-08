# MySQL gaps

Scenarios where DynamoSQL does not match MySQL 8.4. Each entry gives the query, the MySQL result, and the DynamoSQL result. Entries from the CASE tests are listed first, because those queries were removed from `test/expression/case.sql`.

Matching MySQL is not a goal for illegal statements. Parse errors (`ER_PARSE_ERROR`) and other errors for invalid statements, such as `ER_CANT_REOPEN_TABLE`, are not hard requirements. Entries about those errors are kept only as reference and are not targets to fix. Valid MySQL syntax that DynamoSQL rejects, and valid queries that return different results, are gaps.

## CASE tests

### Unsupported syntax

Parser output checked with `npm run query:parse`. The parser accepts the query, so the gap is in the engine.

- `SELECT CASE WHEN 1 THEN 1 ELSE 2 END AS result FROM DUAL;`: the parser returns `from: [{ type: 'dual' }]`. `src/lib/select_handler.ts` accepts only base tables and derived tables in `FROM`, so it throws `Invalid from clause`.

### Division by zero in writes

MySQL 8.4 in strict mode raises an error when a write divides by zero. DynamoSQL stores NULL instead.

- `INSERT INTO t (id, c) VALUES (1, 1) ON DUPLICATE KEY UPDATE c = 1 / 0;`: MySQL returns `ER_DIVISION_BY_ZERO`. DynamoSQL returns success and sets `c` to NULL.
- `SELECT 1 / 0 AS r;` matches on both engines and returns NULL, so the gap is limited to writes.

### Primary key updates on raw tables

MySQL allows `UPDATE` to change a primary key value. The raw engine (DynamoDB tables) does not support this. DynamoDB rejects any update to a key attribute with `ValidationException: Cannot update attribute <name>. This attribute is part of the key`.

- `UPDATE _dynamodb.foo SET id = "new" WHERE id = "old";`: MySQL succeeds, or returns `ER_DUP_ENTRY` when `new` exists. DynamoSQL returns `ER_NO` with the message `Transaction cancelled ... [ValidationError]`. The single-row path falls back to the multi-row path, so both fail the same way.
- `UPDATE IGNORE _dynamodb.foo SET id = "new" WHERE id = "old";`: DynamoSQL returns the same `ER_NO`. `IGNORE` does not change this, because the memory engine is the only engine that implements the duplicate-key skip.

## Subqueries

Only non-correlated scalar subqueries in `WHERE` and `HAVING` are supported (`src/lib/select_handler.ts`, `_collectScalarSubqueries`). The queries below were run on temporary tables.

- `SELECT id FROM t WHERE c IN (SELECT c FROM u) ORDER BY id;`: MySQL returns `[{id: 1}]`. DynamoSQL returns `ER_NO: Unsupport sql feature.`
- `SELECT id, (SELECT MAX(c) FROM u) AS m FROM t ORDER BY id;`: a scalar subquery in the SELECT list. MySQL returns `m = 70` on each row. DynamoSQL returns `ER_NO: Unsupport sql feature.`
- `SELECT id FROM t WHERE EXISTS (SELECT 1 FROM u WHERE u.id = t.id) ORDER BY id;`: MySQL returns `[{id: 1}, {id: 3}]`. DynamoSQL returns `ER_NO_SUCH_TABLE: Table 'u' doesn't exist`.
- `SELECT t.id FROM t t WHERE t.c = (SELECT u.c FROM u u WHERE u.id = t.id) ORDER BY t.id;`: a correlated scalar subquery. MySQL returns `[{id: 1}]`. DynamoSQL returns `ER_NO_SUCH_TABLE: Table 't' doesn't exist`.

## Aggregates and HAVING

- `SELECT id % 2 AS grp, COUNT(*) AS n FROM t GROUP BY grp ORDER BY grp;`, with ids 1 to 4: MySQL groups by the alias's expression and returns `[{grp: 0, n: 2}, {grp: 1, n: 2}]`. DynamoSQL returns one group, `[[1, 4]]`, because `grp` is resolved as a column of the table. GROUP BY on the expression itself, `GROUP BY id % 2`, matches MySQL.

## Truthiness in WHERE

- `SELECT id FROM t WHERE label ORDER BY id;`, with labels `'1'`, `'0'`, `'x'`, and `'2x'` on ids 1 to 4: MySQL returns ids 1 and 4, because it converts strings to numbers. DynamoSQL returns all four rows, because `formJoin` in `src/lib/helpers/join.ts` tests the raw value. HAVING uses the MySQL conversion (`convertNum` in `src/lib/helpers/sql_conversion.ts`).

## Temporary tables

- `CREATE TEMPORARY TABLE t (val INT);`: MySQL succeeds. DynamoSQL returns `ER_NO: Unsupport sql feature.` on the memory engine. The same statement with `id INT PRIMARY KEY` works, so the memory engine appears to require a primary key.
- `INSERT INTO t VALUES (1, 1), (2, 3);` on `t (id INT PRIMARY KEY, val INT)` without a column list: MySQL inserts both rows. DynamoSQL returns `ER_NO: Unsupport sql feature.`. `INSERT INTO t (id, val) VALUES ...` works.

## Column resolution

- `SELECT extra FROM t JOIN u ON u.id = t.id;`, where `extra` exists only in `u`: MySQL returns the values of `u.extra`. DynamoSQL returns NULL. An unqualified column resolves to the first FROM item (`firstFrom` in `_resolveObject`), unless an earlier qualified reference cached it. Derived tables are affected the same way, for example `SELECT extra FROM t JOIN (SELECT id, extra FROM u) s ON s.id = t.id`.
- `SELECT s.ID FROM (SELECT id FROM t) s;` with a mismatched alias case, such as `S.NAME` for alias `s`: MySQL returns `ER_BAD_FIELD_ERROR`. DynamoSQL returns `ER_NO_SUCH_TABLE`, because table and alias lookup both fail with the table error.

## Writes on derived tables

- `UPDATE (SELECT id FROM u) s SET s.c = 1;`: MySQL returns `ER_NON_UPDATABLE_TABLE`. DynamoSQL returns `ER_NO_DB_ERROR`, because `getDatabaseFromUpdate` finds no base table before the check runs.
