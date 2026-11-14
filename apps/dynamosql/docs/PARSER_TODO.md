# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- `UPDATE db.t JOIN ... SET db.t.col = ...` (database-qualified column in SET) fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `STD(x)` and `VARIANCE(x)` fail with ER_PARSE_ERROR: the grammar treats both names as reserved words. MySQL 8.4 accepts them as aggregates. Verified on MySQL 8.4.11.
- `STDDEV`, `STDDEV_POP`, `STDDEV_SAMP`, `VAR_POP`, `VAR_SAMP`, `BIT_AND`, `BIT_OR`, and `BIT_XOR` parse as generic `function` nodes instead of `aggr_func`. MySQL 8.4 treats them as aggregates. DynamoSQL maps these nodes to the aggregate code (`isAggregateNode` in `src/lib/expression/aggregate_functions.ts`), so results match, but the parse tree is wrong. Verified on MySQL 8.4.11.
- `DESCRIBE tbl col` and `DESCRIBE tbl 'pattern'` fail with ER_PARSE_ERROR. `DESCRIBE tbl` parses. MySQL 8.4 accepts all forms.
- `SET NAMES charset [COLLATE collation]` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `SET CHARACTER SET charset` and `SET CHARSET charset` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `SET TRANSACTION ISOLATION LEVEL ...` and `SET SESSION TRANSACTION READ WRITE` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `SET @@session.time_zone = DEFAULT` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `SAVEPOINT name`, `ROLLBACK TO SAVEPOINT name`, and `RELEASE SAVEPOINT name` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `START TRANSACTION WITH CONSISTENT SNAPSHOT` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `COMMIT WORK` and `ROLLBACK WORK` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `SELECT ALL`, `SELECT DISTINCTROW`, `SELECT HIGH_PRIORITY`, and `SELECT STRAIGHT_JOIN` (as a select modifier) fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `SELECT ... FOR SHARE` fails with ER_PARSE_ERROR. `FOR UPDATE`, `LOCK IN SHARE MODE`, and `SKIP LOCKED` parse. MySQL 8.4 accepts `FOR SHARE`.
- `FROM t USE INDEX (...)`, `IGNORE INDEX (...)`, and `FORCE INDEX (...)` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `expr SOUNDS LIKE expr` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `(@y := 2) + 1` fails with ER_PARSE_ERROR. `SELECT @x := 5` parses. MySQL 8.4 accepts both.
- Adjacent string literals (`'a' 'b'`) fail with ER_PARSE_ERROR. MySQL 8.4 concatenates them.
- Character set introducer (`_utf8mb4'abc'`) fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- ODBC date escape (`{d '2020-01-02'}`) fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `0b101` parses as a column reference named `0b101`, not as a bit literal. `b'101'` parses correctly. MySQL 8.4 reads `0b101` as a bit literal.
- `CAST(x AS NCHAR(n))` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `NCHAR(n)` and `NVARCHAR(n)` column types fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `DEC(M, D)` column type fails with ER_PARSE_ERROR. MySQL 8.4 accepts it. `DECIMAL`, `NUMERIC`, `FLOAT`, `DOUBLE PRECISION`, and `REAL` parse.
- Column attribute `INVISIBLE` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `INSERT LOW_PRIORITY`, `INSERT HIGH_PRIORITY IGNORE`, and `INSERT DELAYED` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `INSERT INTO t VALUE (...)` (singular `VALUE`) fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `VALUES (DEFAULT)` and `SET col = DEFAULT` in INSERT fail with ER_PARSE_ERROR. MySQL 8.4 accepts them. `UPDATE t SET col = DEFAULT` fails the same way.
- `INSERT ... VALUES (...) AS row_alias ON DUPLICATE KEY UPDATE col = row_alias.col` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `REPLACE LOW_PRIORITY INTO t ...` and `REPLACE DELAYED INTO t ...` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `UPDATE LOW_PRIORITY t SET ...` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `DELETE LOW_PRIORITY`, `DELETE QUICK`, and `DELETE IGNORE` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `DELETE FROM t USING t JOIN u ON ...` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `DROP TEMPORARY TABLE t`, `DROP TABLE t RESTRICT`, and `DROP TABLE t CASCADE` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `ALTER TABLE t ADD COLUMN (col1 def, col2 def)` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `ALTER TABLE t ALTER COLUMN col SET DEFAULT value` and `ALTER COLUMN col DROP DEFAULT` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `ALTER TABLE t ALTER INDEX idx INVISIBLE` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `ALTER TABLE t CONVERT TO CHARACTER SET cs` fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `ALTER TABLE t ORDER BY col`, `ALTER TABLE t FORCE`, `ALTER TABLE t DISABLE KEYS`, and `ALTER TABLE t ENABLE KEYS` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `SHOW TABLES LIKE 'pattern'` and `SHOW TABLES FROM db` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `SHOW FIELDS FROM t`, `SHOW FULL COLUMNS FROM t`, and `SHOW FULL TABLES` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `SHOW WARNINGS`, `SHOW VARIABLES LIKE 'x'`, `SHOW SESSION VARIABLES LIKE 'x'`, `SHOW CREATE DATABASE db`, and `SHOW TABLE STATUS LIKE 'x'` fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.
- `TABLE t` and `VALUES ROW(...)` statements fail with ER_PARSE_ERROR. MySQL 8.4 accepts them.

- `INSERT INTO c (id, b) VALUES (2, -9223372036854775808)` and `-9223372036854775807` (negative BIGINT literal past 2^53): the parser folds `-<digits>` into one `number` node rounded to a double, so the exact value is lost and strict mode raises ER_WARN_DATA_OUT_OF_RANGE. MySQL 8.4 stores the exact value.
