# MySQL gaps

Scenarios where DynamoSQL does not match MySQL 8.4. Each entry gives the query, the MySQL result, and the DynamoSQL result. Entries from the CASE tests are listed first, because those queries were removed from `test/expression/case.sql`.

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

Only non-correlated scalar subqueries in `WHERE` are supported (`src/lib/select_handler.ts`, `collectScalarSubqueries`). The queries below were run on temporary tables.

- `SELECT id FROM t WHERE c IN (SELECT c FROM u) ORDER BY id;`: MySQL returns `[{id: 1}]`. DynamoSQL returns `ER_NO: Unsupport sql feature.`
- `SELECT id, (SELECT MAX(c) FROM u) AS m FROM t ORDER BY id;`: a scalar subquery in the SELECT list. MySQL returns `m = 70` on each row. DynamoSQL returns `ER_NO: Unsupport sql feature.`
- `SELECT id FROM t WHERE EXISTS (SELECT 1 FROM u WHERE u.id = t.id) ORDER BY id;`: MySQL returns `[{id: 1}, {id: 3}]`. DynamoSQL returns `ER_NO_SUCH_TABLE: Table 'u' doesn't exist`.
- `SELECT t.id FROM t t WHERE t.c = (SELECT u.c FROM u u WHERE u.id = t.id) ORDER BY t.id;`: a correlated scalar subquery. MySQL returns `[{id: 1}]`. DynamoSQL returns `ER_NO_SUCH_TABLE: Table 't' doesn't exist`.

## Aggregates and HAVING

- `SELECT COUNT(*) FROM t WHERE id > 100;`: an aggregate over zero rows. MySQL returns one row, `COUNT(*) = 0`. DynamoSQL returns no rows. `formImplicitGroup` in `src/lib/helpers/group.ts` yields nothing when the input is empty. Derived tables inherit this.
- `SELECT c, COUNT(*) AS cnt FROM t GROUP BY c HAVING COUNT(*) > 1 ORDER BY c;`: MySQL returns `[{c: 7, cnt: 2}]` on the sample data. DynamoSQL returns every group. HAVING is resolved in `column_ref_helper.ts`, but no code applies it as a filter.

## Column resolution

- `SELECT extra FROM t JOIN u ON u.id = t.id;`, where `extra` exists only in `u`: MySQL returns the values of `u.extra`. DynamoSQL returns NULL. An unqualified column resolves to the first FROM item (`firstFrom` in `_resolveObject`), unless an earlier qualified reference cached it. Derived tables are affected the same way, for example `SELECT extra FROM t JOIN (SELECT id, extra FROM u) s ON s.id = t.id`.
- `SELECT s.ID FROM (SELECT id FROM t) s;` with a mismatched alias case, such as `S.NAME` for alias `s`: MySQL returns `ER_BAD_FIELD_ERROR`. DynamoSQL returns `ER_NO_SUCH_TABLE`, because table and alias lookup both fail with the table error.

## Writes on derived tables

- `UPDATE (SELECT id FROM u) s SET s.c = 1;`: MySQL returns `ER_NON_UPDATABLE_TABLE`. DynamoSQL returns `ER_NO_DB_ERROR`, because `getDatabaseFromUpdate` finds no base table before the check runs.

## Parser

- `UPDATE t JOIN u ON u.id = t.id SET t.c = 0;` works. `UPDATE db.t JOIN u ON u.id = db.t.id SET db.t.c = 0;` fails with `ER_PARSE_ERROR`, because node-sql-parser rejects a database-qualified column in `SET`. MySQL 8.4 accepts it. This is also listed in `docs/PARSER_TODO.md`.

## Errors that differ in message or code

- `SELECT id FROM db.zzz;`, where the table does not exist: MySQL reports `Table 'db.zzz' doesn't exist`. DynamoSQL reports `Table 'zzz' doesn't exist`. The code is the same, `ER_NO_SUCH_TABLE`.

## Accepted by DynamoSQL, rejected by MySQL

- `SELECT t.id FROM t JOIN t t2 ON t2.id = t.id;` on a temporary table: MySQL returns `ER_CANT_REOPEN_TABLE`. DynamoSQL returns the rows. This is a MySQL restriction on temporary tables, and DynamoSQL does not enforce it.
