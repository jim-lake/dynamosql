# MySQL gaps

Scenarios where DynamoSQL does not match MySQL 8.4. Each entry gives the query, the MySQL result, and the DynamoSQL result.

Matching MySQL is not a goal for illegal statements. Parse errors (`ER_PARSE_ERROR`) and other errors for invalid statements, such as `ER_CANT_REOPEN_TABLE`, are not hard requirements. Entries about those errors are kept only as reference and are not targets to fix. Valid MySQL syntax that DynamoSQL rejects, and valid queries that return different results, are gaps. Only features marked as supported in `../../SQL_GRAMMAR.md` or `../../FUNCTIONS.md` are listed here.

## INSERT without a column list

MySQL accepts `INSERT INTO t VALUES (...)` and maps the values to columns by position. The memory engine has a schema, so it should support this form. The raw engine cannot, because DynamoDB tables have no schema (see `RAW_ENGINE.md`).

- `INSERT INTO t VALUES (1, 1), (2, 3);` on `t (id INT PRIMARY KEY, val INT)` on the memory engine: MySQL inserts both rows. DynamoSQL returns `ER_NO: Unsupport sql feature.`, because `insert_handler.ts` rejects the statement before the engine runs.

## Temporary tables

- `CREATE TEMPORARY TABLE t (val INT);`: MySQL succeeds. DynamoSQL returns `ER_NO: Unsupport sql feature.` on the memory engine. The same statement with `id INT PRIMARY KEY` works, so the memory engine appears to require a primary key.

## Column resolution

- `SELECT extra FROM t JOIN u ON u.id = t.id;`, where `extra` exists only in `u`: MySQL returns the values of `u.extra`. DynamoSQL returns NULL. An unqualified column resolves to the first FROM item (`firstFrom` in `_resolveObject`), unless an earlier qualified reference cached it. Derived tables are affected the same way, for example `SELECT extra FROM t JOIN (SELECT id, extra FROM u) s ON s.id = t.id`.
- `SELECT s.ID FROM (SELECT id FROM t) s;` with a mismatched alias case, such as `S.NAME` for alias `s`: MySQL returns `ER_BAD_FIELD_ERROR`. DynamoSQL returns `ER_NO_SUCH_TABLE`, because table and alias lookup both fail with the table error. This is an error case for an invalid statement, so it is kept as reference only.
