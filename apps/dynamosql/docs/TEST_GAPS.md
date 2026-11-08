# Test gaps

Statements that run on DynamoSQL and return the same result as MySQL 8.4, but no test in `test/` covers them. These were checked by one comparison run against MySQL on temporary tables. That run was not kept as a test, so none of these are in the suite yet.

Where a row says "accepted", the check only confirmed that both engines accept the statement. No follow-up query compared the resulting table.

Statements that fail on DynamoSQL, or return a different result from MySQL, are not listed here. They are in `MYSQL_GAPS.md` or `PARSER_TODO.md`.

## SELECT

- `SELECT SQL_NO_CACHE ...`, `SQL_BUFFER_RESULT`, `SQL_BIG_RESULT`, `SQL_SMALL_RESULT`, and `SQL_CALC_FOUND_ROWS` modifiers.
- `SELECT ... LIMIT offset, count`.
- `SELECT ... FOR UPDATE`, `FOR UPDATE SKIP LOCKED`, and `LOCK IN SHARE MODE`. Rows match MySQL, but the test cannot see whether a lock is taken. The engine does not take one.
- `SELECT ... WHERE col LIKE 'pattern' ESCAPE '!'`.
- The `%` operator, as in `SELECT 5 % 2`.
- User variable assignment with `:=` in a select list, as in `SELECT @x := 5`.
- Hex literals `X'41'` and `0x41`.
- String quoting: `'it''s'`, `"say ""hi"""`, and `'a\'b'`.
- Block comments `/* ... */` and optimizer hints `/*+ NO_INDEX(t) */`.
- JSON path `$[last]` and quoted member `$."a"`.
- `CROSS JOIN ... ON cond`.
- Parenthesized table reference `FROM (t t)`.

## INSERT, REPLACE, UPDATE, DELETE

- `INSERT INTO t (cols) VALUES ROW(...)`.
- `INSERT INTO t (cols) SELECT <constants>` with no `FROM` clause.
- `REPLACE INTO t (cols) SELECT ...`.
- `REPLACE INTO t (cols) VALUES ROW(...)`.
- `UPDATE t SET ... WHERE ... ORDER BY ... LIMIT n`.
- Comma multi-table update, `UPDATE t, u SET t.col = u.col WHERE t.id = u.id`.
- `DELETE FROM t WHERE ... ORDER BY ... LIMIT n`.
- Multi-table delete that lists the target table first, `DELETE t FROM t JOIN u ON ...`. `delete/multi_table.sql` is still a placeholder.

## CREATE

Accepted by both engines. The check ran no query against these tables afterward.

- `CREATE TEMPORARY TABLE` with these column attributes: `AUTO_INCREMENT`, `UNIQUE`, `NOT NULL DEFAULT n`, `COMMENT`, `CHARACTER SET ... COLLATE ...`, and `TIMESTAMP NULL DEFAULT NULL`.
- `CREATE TEMPORARY TABLE` with these table-level clauses: `INDEX name (col)`, `UNIQUE KEY name (col)`, `CONSTRAINT name CHECK (expr)`, `COMMENT = 'text'`, and `CHARACTER SET ... COLLATE ...`.
- Generated columns, `AS (expr) VIRTUAL` and `GENERATED ALWAYS AS (expr) STORED`.
- Integer types `TINYINT`, `SMALLINT`, `MEDIUMINT`, `BIGINT UNSIGNED`, `INTEGER`, and `BOOL`. The `SELECT` of these rows also matched.
- Date and time types `DATE`, `TIME(3)`, `DATETIME(6)`, and `YEAR`.
- String and binary types `CHAR(3)`, `VARBINARY(8)`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, and `LONGBLOB`. `BINARY(4)` does not match MySQL. Its `SELECT` fails. See `MYSQL_GAPS.md`.
- Text and set types `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`, `ENUM('x','y')`, and `SET('p','q')`.
- `CREATE DATABASE name CHARACTER SET cs COLLATE co`.

## ALTER TABLE

These run on temporary tables. Each one matches MySQL.

- `ADD COLUMN ... FIRST` and `ADD COLUMN ... AFTER col`.
- Several `ADD COLUMN` clauses in one statement, `ADD COLUMN q INT, ADD COLUMN r INT`.
- `ADD INDEX`, `ADD UNIQUE KEY`, and `DROP INDEX`.
- `MODIFY COLUMN`, `CHANGE COLUMN`, and `RENAME COLUMN`.
- `DROP COLUMN`.
- `ADD CONSTRAINT ... CHECK (expr)`.
- `AUTO_INCREMENT = n`, `COMMENT = 'text'`, and `RENAME TO new_name`.

## DROP

- `DROP TABLE a, b` and `DROP TABLE IF EXISTS a, b`.
- `DROP SCHEMA name`.

## SET

- `SET @var := expr`.
- `SET SESSION time_zone = ...`, `SET LOCAL time_zone = ...`, and `SET time_zone = ...` with no scope keyword.
- `SET @@LOCAL.time_zone = ...`.

## Transactions

- `START TRANSACTION READ ONLY` and `START TRANSACTION READ WRITE`.
- `COMMIT`, `ROLLBACK`, and `BEGIN WORK`.
