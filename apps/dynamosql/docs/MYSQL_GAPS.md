# MySQL gaps

Scenarios where DynamoSQL does not match MySQL 8.4. Each entry gives the query, the MySQL result, and the DynamoSQL result.

Matching MySQL is not a goal for illegal statements. Parse errors (`ER_PARSE_ERROR`) and other errors for invalid statements, such as `ER_CANT_REOPEN_TABLE`, are not hard requirements. Entries about those errors are kept only as reference and are not targets to fix. Valid MySQL syntax that DynamoSQL rejects, and valid queries that return different results, are gaps. Only features marked as supported in `../../SQL_GRAMMAR.md` or `../../FUNCTIONS.md` are listed here.

## Column resolution

- `SELECT extra FROM t JOIN (SELECT id, extra FROM u) s ON s.id = t.id;`, where `extra` exists only in the derived table: MySQL returns the values of `s.extra`. DynamoSQL returns `ER_BAD_FIELD_ERROR`. An unqualified column resolves through the first FROM item (`firstFrom` in `_resolveObject`), and derived tables are not searched.
- `SELECT s.ID FROM (SELECT id FROM t) s;` with a mismatched alias case, such as `S.NAME` for alias `s`: MySQL returns `ER_BAD_FIELD_ERROR`. DynamoSQL returns `ER_NO_SUCH_TABLE`, because table and alias lookup both fail with the table error. This is an error case for an invalid statement, so it is kept as reference only.

## DECIMAL arithmetic

- `SELECT CAST(42.225 AS DECIMAL(10,2)) * 10 AS r;`: MySQL returns `422.30` (exact NEWDECIMAL product). DynamoSQL returns `422.29999999999995`, because the product is computed in doubles.

## DECIMAL scale in string functions

- `SELECT CONCAT(CAST(1.50 AS DECIMAL(5,2)), '') AS r;`: MySQL returns `'1.50'`. DynamoSQL returns `'1.5'`, because `concat` appends `String(result.value)` (`func_string_basic.ts:53`), which drops the decimal scale.
- `SELECT LEFT(CAST(1.50 AS DECIMAL(5,2)), 4) AS r;`: MySQL returns `'1.50'`. DynamoSQL returns `'1.5'`, for the same reason in `left`.

## Named locks

- `SELECT IS_USED_LOCK('x');` while another session holds `x`: MySQL returns that session's connection id. DynamoSQL returns the holder's session thread id, which can differ from the MySQL connection id.

## DROP DATABASE IF EXISTS

- `DROP DATABASE IF EXISTS missing_db;`, where `missing_db` does not exist: MySQL 8.4 returns success with a warning (1008). DynamoSQL returns `ER_BAD_DB_ERROR`. `drop_handler.ts` never reads `ast.prefix`, and `schema_manager.dropDatabase` throws `db_not_found` without a check for the flag.

## ROUND on DECIMAL

- `SELECT ROUND(dec_v) FROM t;`, where `dec_v` is `DECIMAL(10,2)`: MySQL returns NEWDECIMAL. DynamoSQL returns DOUBLE, because `round` resolves the result type through `_resolveTypeForRounding` and does not keep the DECIMAL input type.

## JSON DOUBLE numbers in stored values

- `CREATE TEMPORARY TABLE t (id INT PRIMARY KEY, doc JSON); INSERT INTO t VALUES (1, '1e3'); SELECT JSON_TYPE(doc) FROM t;`: MySQL returns `DOUBLE`. DynamoSQL returns `INTEGER`, because `JSON.parse` turns `1e3` into the JavaScript number 1000 and loses the DOUBLE type. The same literal in an expression (`JSON_TYPE('1e3')`) returns `DOUBLE` on both engines.
- `SELECT id, CAST(doc AS CHAR) AS doc_text FROM js;`, where `js` is a JSON column: MySQL reports the column type as BLOB. DynamoSQL reports VAR_STRING.

## JSON scalar arithmetic and comparison

- `SELECT id, doc + 0 AS v FROM t;`, where the JSON column `doc` holds the JSON number `42` in one row and the JSON number `-2.5` in another, with `JSON_EXTRACT(doc, '$') + 0` written the same way: MySQL reports the result type as NEWDECIMAL. DynamoSQL reports DOUBLE. The values match.
- `SELECT id, SPACE(doc) AS v FROM t;`, where `doc` holds the JSON number `42`: MySQL reports the result type as BLOB. DynamoSQL reports VAR_STRING. The values match.

## DATETIME in JSON_VALUE RETURNING

- `SELECT JSON_VALUE('{"d":"2024-03-05"}', '$.d' RETURNING DATETIME) AS v;`: MySQL returns NULL. DynamoSQL returns `'2024-03-05 00:00:00'`, because `JSON_VALUE` uses the shared `convertDateTime` helper, which accepts a date-only string.
- `SELECT JSON_VALUE('{"d":"2024-03-05T10:20:30"}', '$.d' RETURNING DATETIME) AS v;`: MySQL returns NULL. DynamoSQL returns a DATETIME value, because `convertDateTime` accepts the `T` separator.
- `SELECT JSON_VALUE('{"d":"2024-02-30 10:20:30"}', '$.d' RETURNING DATETIME) AS v;`: MySQL returns NULL for the invalid day. DynamoSQL returns `'2024-03-01 10:20:30'`, because `convertDateTime` rolls the date over.
- `SELECT JSON_VALUE('{"d":"2024-03-05 10:20:30.5"}', '$.d' RETURNING DATETIME(0)) AS v;`: MySQL returns `'2024-03-05 10:20:30'`. DynamoSQL returns `'2024-03-05 10:20:31'`, because `convertDateTime` rounds the fraction up.

## UNIX_TIMESTAMP on a JSON string

- `SELECT id, UNIX_TIMESTAMP(doc) AS v FROM jd;`, where `jd.doc` holds the JSON string `"2020-01-02"`: MySQL reports the result type as NEWDECIMAL. DynamoSQL reports LONGLONG. The values match. The same happens with a VARCHAR argument, so the difference is not specific to JSON.

## EXP overflow

- `SELECT EXP(2020) AS e;`: MySQL raises `ER_DATA_OUT_OF_RANGE` (1690, "DOUBLE value is out of range"). DynamoSQL returns NULL with no error. This is not specific to JSON input.
