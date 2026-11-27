# MySQL gaps

Scenarios where DynamoSQL does not match MySQL 8.4. Each entry gives the query, the MySQL result, and the DynamoSQL result.

Matching MySQL is not a goal for illegal statements. Parse errors (`ER_PARSE_ERROR`) and other errors for invalid statements, such as `ER_CANT_REOPEN_TABLE`, are not hard requirements. Entries about those errors are kept only as reference and are not targets to fix. Valid MySQL syntax that DynamoSQL rejects, and valid queries that return different results, are gaps. Only features marked as supported in `../../SQL_GRAMMAR.md` or `../../FUNCTIONS.md` are listed here.

## Column resolution

- `SELECT extra FROM t JOIN (SELECT id, extra FROM u) s ON s.id = t.id;`, where `extra` exists only in the derived table: MySQL returns the values of `s.extra`. DynamoSQL returns `ER_BAD_FIELD_ERROR`. An unqualified column resolves through the first FROM item (`firstFrom` in `_resolveObject`), and derived tables are not searched.
- `SELECT s.ID FROM (SELECT id FROM t) s;` with a mismatched alias case, such as `S.NAME` for alias `s`: MySQL returns `ER_BAD_FIELD_ERROR`. DynamoSQL returns `ER_NO_SUCH_TABLE`, because table and alias lookup both fail with the table error. This is an error case for an invalid statement, so it is kept as reference only.

## Named locks

- `SELECT IS_USED_LOCK('x');` while another session holds `x`: MySQL returns that session's connection id. DynamoSQL returns the holder's session thread id, which can differ from the MySQL connection id.

## DROP DATABASE IF EXISTS

- `DROP DATABASE IF EXISTS missing_db;`, where `missing_db` does not exist: MySQL 8.4 returns success with a warning (1008). DynamoSQL returns `ER_BAD_DB_ERROR`. `drop_handler.ts` never reads `ast.prefix`, and `schema_manager.dropDatabase` throws `db_not_found` without a check for the flag.

## SHOW GRANTS FOR

- `SHOW GRANTS FOR 'nobody'@'%';`, where that account does not exist: MySQL returns `ER_NONEXISTING_GRANT`. DynamoSQL ignores the `FOR` target and returns the grants of the connected user.

## String function result type on TEXT and JSON

- `SELECT UPPER(t), TRIM(t), CONCAT(t, 'x'), CONCAT_WS('-', t, 'x') FROM tt;`, where `t` is a `TEXT` or `JSON` column: MySQL returns `BLOB` field metadata. DynamoSQL returns `VAR_STRING`. The values match. `upper`, `lower`, and `trim` in `func_string_basic.ts` always set `type = 'string'`, and `concat` only returns `text` when an argument's runtime type is `text`.

## MIN and MAX field type on integer columns

- `SELECT MIN(id) AS m FROM g;`, where `id` is `INT`: MySQL returns `LONG` field metadata. DynamoSQL returns `VAR_STRING`. The values match.

## GREATEST and LEAST field type on JSON columns with DISTINCT

- `SELECT DISTINCT GREATEST(j, j) AS json_value FROM tt;`, where `j` is a `JSON` column: MySQL returns `LONGTEXT` field metadata. DynamoSQL returns `VAR_STRING`. The values match. Without DISTINCT, MySQL returns `VARCHAR` for the same expression.

## Boolean-valued JSON function field type with DISTINCT on a table column

- `SELECT DISTINCT JSON_OVERLAPS(j, '{"a":1}') AS result FROM tt;`, `JSON_SCHEMA_VALID('{"type":"object"}', j)`, `JSON_STORAGE_SIZE(j) = JSON_STORAGE_SIZE('{"a":1}')` and `1 MEMBER OF(j)`, where `j` is a `JSON` column: MySQL returns `LONG` field metadata. DynamoSQL returns `LONGLONG`. The values match. With literal arguments MySQL returns `LONGLONG` and DynamoSQL matches.

## Column name of a bare NULL literal

- `SELECT NULL;`: MySQL names the column `NULL`. DynamoSQL names it `null`. The value matches. The same naming applies to the first branch of `SELECT NULL UNION SELECT NULL;`.
