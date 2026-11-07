# MySQL gaps found by CASE tests

These queries were removed from `test/expression/case.sql` because DynamoSQL does not match MySQL 8.4. Each entry names the query and the gap.

## Unsupported syntax

Parser output checked with `npm run query:parse`. The parser accepts the query, so the gap is in the engine.

- `SELECT CASE WHEN 1 THEN 1 ELSE 2 END AS result FROM DUAL;`: the parser returns `from: [{ type: 'dual' }]`. `src/lib/select_handler.ts` accepts only base tables in `FROM`, so it throws `Invalid from clause`.

## Division by zero in writes

MySQL 8.4 in strict mode raises an error when a write divides by zero. DynamoSQL stores NULL instead.

- `INSERT INTO t (id, c) VALUES (1, 1) ON DUPLICATE KEY UPDATE c = 1 / 0;`: MySQL returns `ER_DIVISION_BY_ZERO`. DynamoSQL returns success and sets `c` to NULL.
- `SELECT 1 / 0 AS r;` matches on both engines and returns NULL, so the gap is limited to writes.

## Primary key updates on raw tables

MySQL allows `UPDATE` to change a primary key value. The raw engine (DynamoDB tables) does not support this. DynamoDB rejects any update to a key attribute with `ValidationException: Cannot update attribute <name>. This attribute is part of the key`.

- `UPDATE _dynamodb.foo SET id = "new" WHERE id = "old";`: MySQL succeeds, or returns `ER_DUP_ENTRY` when `new` exists. DynamoSQL returns `ER_NO` with the message `Transaction cancelled ... [ValidationError]`. The single-row path falls back to the multi-row path, so both fail the same way.
- `UPDATE IGNORE _dynamodb.foo SET id = "new" WHERE id = "old";`: DynamoSQL returns the same `ER_NO`. `IGNORE` does not change this, because the memory engine is the only engine that implements the duplicate-key skip.
