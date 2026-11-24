# MySQL gaps

Scenarios where DynamoSQL does not match MySQL 8.4. Each entry gives the query, the MySQL result, and the DynamoSQL result.

Matching MySQL is not a goal for illegal statements. Parse errors (`ER_PARSE_ERROR`) and other errors for invalid statements, such as `ER_CANT_REOPEN_TABLE`, are not hard requirements. Entries about those errors are kept only as reference and are not targets to fix. Valid MySQL syntax that DynamoSQL rejects, and valid queries that return different results, are gaps. Only features marked as supported in `../../SQL_GRAMMAR.md` or `../../FUNCTIONS.md` are listed here.

## Column resolution

- `SELECT extra FROM t JOIN (SELECT id, extra FROM u) s ON s.id = t.id;`, where `extra` exists only in the derived table: MySQL returns the values of `s.extra`. DynamoSQL returns `ER_BAD_FIELD_ERROR`. An unqualified column resolves through the first FROM item (`firstFrom` in `_resolveObject`), and derived tables are not searched.
- `SELECT s.ID FROM (SELECT id FROM t) s;` with a mismatched alias case, such as `S.NAME` for alias `s`: MySQL returns `ER_BAD_FIELD_ERROR`. DynamoSQL returns `ER_NO_SUCH_TABLE`, because table and alias lookup both fail with the table error. This is an error case for an invalid statement, so it is kept as reference only.

## DECIMAL scale in string functions

- `SELECT CONCAT(CAST(1.50 AS DECIMAL(5,2)), '') AS r;`: MySQL returns `'1.50'`. DynamoSQL returns `'1.5'`, because `concat` appends `String(result.value)` (`func_string_basic.ts:53`), which drops the decimal scale.
- `SELECT LEFT(CAST(1.50 AS DECIMAL(5,2)), 4) AS r;`: MySQL returns `'1.50'`. DynamoSQL returns `'1.5'`, for the same reason in `left`.

## Named locks

- `SELECT IS_USED_LOCK('x');` while another session holds `x`: MySQL returns that session's connection id. DynamoSQL returns the holder's session thread id, which can differ from the MySQL connection id.

## DROP DATABASE IF EXISTS

- `DROP DATABASE IF EXISTS missing_db;`, where `missing_db` does not exist: MySQL 8.4 returns success with a warning (1008). DynamoSQL returns `ER_BAD_DB_ERROR`. `drop_handler.ts` never reads `ast.prefix`, and `schema_manager.dropDatabase` throws `db_not_found` without a check for the flag.

## ROUND on DECIMAL

- `SELECT ROUND(CAST(-1.45 AS DECIMAL(10,2)), 1);`: MySQL returns `-1.5` (NEWDECIMAL). DynamoSQL returns `-1.4`, because `round` calls `value.toFixed(decimals)` on the double value of the decimal, and the double -1.45 is stored just below the tie.
- `SELECT ROUND(dec_v) FROM t;`, where `dec_v` is `DECIMAL(10,2)`: MySQL returns NEWDECIMAL. DynamoSQL returns DOUBLE, because `round` resolves the result type through `_resolveTypeForRounding` and does not keep the DECIMAL input type.

## CREATE TEMPORARY TABLE ... SELECT

- `CREATE TEMPORARY TABLE ct (id INT PRIMARY KEY) AS SELECT 1 AS id UNION SELECT 2;` then `SELECT * FROM ct;`: MySQL returns `affectedRows` 2 and 2 rows. DynamoSQL returns `affectedRows` 1 and 0 rows. The CTAS rows are not kept in the memory table.
- The same statement without `AS` (`CREATE TEMPORARY TABLE ct (id INT PRIMARY KEY) SELECT ...`) behaves the same way.
- `CREATE TEMPORARY TABLE ct SELECT 1 AS id;` (no column definitions, no key): MySQL succeeds with `affectedRows` 1. DynamoSQL returns `ER_BAD_FIELD_ERROR`.
