# SQL grammar support

Every SQL syntax form that MySQL 8.4 documents, with the DynamoSQL status of each form. Forms are listed whether or not node-sql-parser accepts them. Functions and operator semantics are in `FUNCTIONS.md`. Engine-specific behavior is in `RAW_ENGINE.md` and `apps/dynamosql/docs/MYSQL_GAPS.md`.

How each row is marked:

- ✅ A test in `apps/dynamosql/test/` runs the form on DynamoSQL and MySQL, and the results match. The notes name the test file.
- ❌ No test covers the form. An untested form counts as unsupported, even when a probe runs it without error. Where a probe returned a wrong result or ignored a clause, the notes say so.

Source: MySQL 8.4 Reference Manual, chapter 15 (SQL statements), chapter 11 (language structure), and chapter 13 (data types).

## SELECT

### Query shape and modifiers

| Feature                                                   | Supported | Notes                                                                       |
| :-------------------------------------------------------- | :-------: | --------------------------------------------------------------------------- |
| `SELECT` without `FROM`                                   |    ✅     | `client_opts/multiple_statements.sql`                                       |
| `FROM DUAL`                                               |    ❌     | `Invalid from clause`. See `MYSQL_GAPS.md`.                                 |
| `SELECT ALL`                                              |    ❌     |                                                                             |
| `SELECT DISTINCT`                                         |    ❌     | Silently wrong. A probe of `SELECT DISTINCT other` returned duplicate rows. |
| `SELECT DISTINCTROW`                                      |    ❌     |                                                                             |
| `HIGH_PRIORITY` modifier                                  |    ❌     |                                                                             |
| `STRAIGHT_JOIN` modifier                                  |    ❌     |                                                                             |
| `SQL_SMALL_RESULT`, `SQL_BIG_RESULT`, `SQL_BUFFER_RESULT` |    ❌     | Accepted and ignored. |
| `SQL_NO_CACHE` (deprecated, no effect)                    |    ❌     | Accepted and ignored. |
| `SQL_CALC_FOUND_ROWS` (deprecated)                        |    ❌     | Accepted and ignored. `FOUND_ROWS()` is not implemented. |
| Several modifiers in one `SELECT`                         |    ❌     | Depends on modifiers that are accepted and ignored. |
| Optimizer hints `SELECT /*+ ... */`                       |    ❌     | Accepted and ignored. Not tested. |
| `EXPLAIN SELECT`                                          |    ❌     | See DESCRIBE and EXPLAIN.                                                   |

### Select list and aliases

| Feature                                           | Supported | Notes                                                |
| :------------------------------------------------ | :-------: | ---------------------------------------------------- |
| `SELECT *`                                        |    ✅     | `select/select.sql`                                  |
| `SELECT t.*`                                      |    ✅     | `join/join.sql`                                      |
| `db.t.*` qualified star                           |    ❌     |                                                      |
| Expression in select list                         |    ✅     | `select/alias.sql`                                   |
| Column alias with `AS`                            |    ✅     | `select/alias.sql`                                   |
| Column alias without `AS`                         |    ✅     | `select/alias.sql`                                   |
| Backtick-quoted alias                             |    ✅     | `select/alias.sql`                                   |
| Single-quoted or string alias (`expr AS 'alias'`) |    ❌     |                                                      |
| User variable in select list (`@var`)             |    ✅     | `expression/variables.sql`                           |
| Scalar subquery in select list                    |    ❌     | `ER_NO: Unsupport sql feature.` See `MYSQL_GAPS.md`. |

### INTO clause

| Feature                                                 | Supported | Notes                                                                  |
| :------------------------------------------------------ | :-------: | ---------------------------------------------------------------------- |
| `INTO @var [, @var] ...`                                |    ❌     | Silently ignored. A probe of `SELECT 1 AS a INTO @x` returned the row. |
| `INTO OUTFILE 'file' [CHARACTER SET cs] EXPORT_OPTIONS` |    ❌     |                                                                        |
| `INTO DUMPFILE 'file'`                                  |    ❌     |                                                                        |
| `EXPORT_OPTIONS`: `FIELDS`/`COLUMNS` `TERMINATED BY`    |    ❌     |                                                                        |
| `EXPORT_OPTIONS`: `[OPTIONALLY] ENCLOSED BY`            |    ❌     |                                                                        |
| `EXPORT_OPTIONS`: `ESCAPED BY`                          |    ❌     |                                                                        |
| `EXPORT_OPTIONS`: `LINES STARTING BY`                   |    ❌     |                                                                        |
| `EXPORT_OPTIONS`: `LINES TERMINATED BY`                 |    ❌     |                                                                        |
| `INTO` before `FROM` (deprecated position)              |    ❌     |                                                                        |

### FROM and table references

| Feature                                                                        | Supported | Notes                 |
| :----------------------------------------------------------------------------- | :-------: | --------------------- |
| Base table, database-qualified (`db.table`)                                    |    ✅     | `select/select.sql`   |
| Base table, unqualified after `USE`                                            |    ✅     | `memory/temp.sql`     |
| Table alias with `AS`                                                          |    ✅     | `join/edge_cases.sql` |
| Table alias without `AS`                                                       |    ✅     | `join/join_using.sql` |
| `PARTITION (p1, ...)` selection on a table                                     |    ❌     |                       |
| Index hint `USE INDEX`, `USE KEY` (`FOR JOIN`, `FOR ORDER BY`, `FOR GROUP BY`) |    ❌     |                       |
| Index hint `IGNORE INDEX`, `IGNORE KEY`                                        |    ❌     |                       |
| Index hint `FORCE INDEX`, `FORCE KEY`                                          |    ❌     |                       |
| Several index hints on one table                                               |    ❌     |                       |
| Parenthesized table reference group `( table_references )`                     |    ❌     | `join/syntax.sql` covers `(t alias)` alone and before a `JOIN`. |
| ODBC escape `{ OJ table_reference join_type ... }`                             |    ❌     |                       |

### Joins

| Feature                                                        | Supported | Notes                                                                               |
| :------------------------------------------------------------- | :-------: | ----------------------------------------------------------------------------------- |
| Comma join, `FROM a, b` with a `WHERE` condition               |    ✅     | `join/join.sql`                                                                     |
| Comma join with no condition (cross product)                   |    ✅     | `join/join.sql` (`FROM foo, bar ORDER BY ...`)                                      |
| `JOIN ... ON` (no keyword before `JOIN`)                       |    ✅     | `join/join.sql`                                                                     |
| `INNER JOIN ... ON`                                            |    ✅     | `join/join.sql`                                                                     |
| `INNER JOIN ... USING (...)`                                   |    ✅     | `join/join_using.sql`                                                               |
| `LEFT [OUTER] JOIN ... ON`                                     |    ✅     | `join/join.sql`                                                                     |
| `LEFT [OUTER] JOIN ... USING (...)`                            |    ✅     | `join/join_using.sql`                                                               |
| `RIGHT [OUTER] JOIN ... ON`                                    |    ❌     | Silently wrong. A probe returned fewer rows than MySQL.                             |
| `RIGHT [OUTER] JOIN ... USING (...)`                           |    ❌     |                                                                                     |
| `CROSS JOIN ... ON` or `... USING` (with `CROSS JOIN` keyword) |    ❌     | `join/syntax.sql` covers the `ON` form. `USING` is not tested. |
| `NATURAL [INNER] JOIN`                                         |    ✅     | `join/join_using.sql`                                                               |
| `NATURAL LEFT [OUTER] JOIN`                                    |    ✅     | `join/join_using.sql`                                                               |
| `NATURAL RIGHT [OUTER] JOIN`                                   |    ❌     |                                                                                     |
| `STRAIGHT_JOIN` between tables                                 |    ❌     |                                                                                     |
| Join ON with several conditions                                |    ✅     | `join/edge_cases.sql`                                                               |
| Join ON with an expression (`CAST`)                            |    ✅     | `join/edge_cases.sql`                                                               |
| Join of three or more tables                                   |    ✅     | `join/join_using.sql`                                                               |
| Self join with aliases                                         |    ✅     | `join/join_using.sql`                                                               |
| Join with a derived table                                      |    ✅     | `select/derived_table.sql`                                                          |
| Join ON with a subquery                                        |    ❌     |                                                                                     |
| Join with a `LATERAL` derived table (any join type)            |    ❌     |                                                                                     |

### Derived tables and LATERAL

| Feature                                                      | Supported | Notes                                         |
| :----------------------------------------------------------- | :-------: | --------------------------------------------- |
| Derived table `(SELECT ...) [AS] alias` in `FROM`            |    ✅     | `select/derived_table.sql`                    |
| Nested derived tables                                        |    ✅     | `select/derived_table.sql`                    |
| Derived table from `SELECT` with no `FROM`                   |    ✅     | `select/derived_table.sql` (`SELECT 1 AS id`) |
| Derived table with column alias list `(SELECT ...) s (a, b)` |    ❌     |                                               |
| `LATERAL (SELECT ...) alias`                                 |    ❌     |                                               |
| `JSON_TABLE(...) AS alias` in `FROM`                         |    ❌     |                                               |
| `FROM (TABLE t)` or `FROM (VALUES ROW(...))`                 |    ❌     |                                               |

### WHERE

| Feature                                                    | Supported | Notes                                                               |
| :--------------------------------------------------------- | :-------: | ------------------------------------------------------------------- |
| Comparison operators `=`, `!=`, `<>`, `<`, `<=`, `>`, `>=` |    ✅     | `select/operators.sql`                                              |
| `AND`, `OR`, `XOR`, `NOT`, `!`, parentheses                |    ✅     | `select/where.sql`                                                  |
| `IS [NOT] NULL`                                            |    ✅     | `select/where.sql`                                                  |
| `IS [NOT] TRUE`, `IS [NOT] FALSE`                          |    ✅     | `expression/operators.sql`                                          |
| `IS [NOT] UNKNOWN`                                         |    ❌     |                                                                     |
| NULL-safe equal `<=>`                                      |    ✅     | `select/operators.sql`                                              |
| `IN (value_list)`                                          |    ✅     | `select/collation_raw.sql`                                          |
| `NOT IN (value_list)`                                      |    ✅     | `expression/operators.sql`                                          |
| `IN (subquery)` and `NOT IN (subquery)`                    |    ❌     | `ER_NO: Unsupport sql feature.` See Subqueries.                     |
| `BETWEEN ... AND ...`                                      |    ✅     | `select/having.sql`                                                 |
| `NOT BETWEEN ... AND ...`                                  |    ✅     | `expression/operator_control_flow.sql`                              |
| `LIKE` pattern                                             |    ✅     | `select/operators.sql`                                              |
| `NOT LIKE` pattern                                         |    ✅     | `expression/operators.sql`                                          |
| `LIKE ... ESCAPE 'c'`                                      |    ❌     |                                                                     |
| `REGEXP` / `RLIKE` / `NOT REGEXP`                          |    ❌     | See `FUNCTIONS.md`.                                                 |
| `SOUNDS LIKE`                                              |    ❌     |                                                                     |
| `MEMBER OF (json_array)`                                   |    ✅     | `expression/function_json_member_of.sql`                            |
| `MATCH (cols) AGAINST (expr [modifier])`                   |    ❌     | All four search modes (natural, boolean, query expansion) untested. |
| `CASE` expression in `WHERE`                               |    ✅     | `expression/case.sql`                                               |
| Row constructor comparison `(a, b) = (c, d)`               |    ❌     |                                                                     |
| Row comparison with a row subquery `(a, b) = (SELECT ...)` |    ❌     |                                                                     |
| Placeholder `?`                                            |    ❌     |                                                                     |

### GROUP BY, HAVING, and WINDOW

| Feature                                                                                                | Supported | Notes                                                                 |
| :----------------------------------------------------------------------------------------------------- | :-------: | --------------------------------------------------------------------- |
| `GROUP BY` column, expression, or position                                                             |    ✅     | `select/group.sql`                                                    |
| `GROUP BY` select-list alias                                                                           |    ❌     | Resolves to a table column instead of the alias. See `MYSQL_GAPS.md`. |
| `GROUP BY ... WITH ROLLUP`                                                                             |    ❌     |                                                                       |
| `GROUP BY ROLLUP (...)` function form                                                                  |    ❌     |                                                                       |
| `HAVING` with an aggregate                                                                             |    ✅     | `select/having.sql`                                                   |
| `HAVING` with a select-list alias                                                                      |    ✅     | `select/having.sql`                                                   |
| `HAVING` without `GROUP BY`                                                                            |    ✅     | `select/having.sql`                                                   |
| `HAVING` with a scalar subquery                                                                        |    ✅     | `select/having.sql`                                                   |
| Aggregate functions, `COUNT(DISTINCT ...)`                                                             |    ✅     | `select/aggregate.sql`, `select/having.sql`                           |
| `WINDOW name AS (window_spec)` clause                                                                  |    ❌     |                                                                       |
| `OVER (window_spec)` on a function                                                                     |    ❌     |                                                                       |
| `OVER window_name` on a function                                                                       |    ❌     |                                                                       |
| `PARTITION BY` inside a window spec                                                                    |    ❌     |                                                                       |
| `ORDER BY` inside a window spec                                                                        |    ❌     |                                                                       |
| Frame clause `ROWS` / `RANGE` with `BETWEEN ... AND ...`                                               |    ❌     |                                                                       |
| Frame bounds `UNBOUNDED PRECEDING`, `N PRECEDING`, `CURRENT ROW`, `N FOLLOWING`, `UNBOUNDED FOLLOWING` |    ❌     |                                                                       |
| Window functions (`ROW_NUMBER`, `RANK`, `LAG`, and others)                                             |    ❌     | Listed in `FUNCTIONS.md`.                                             |

### ORDER BY and LIMIT

| Feature                                 | Supported | Notes                                                           |
| :-------------------------------------- | :-------: | --------------------------------------------------------------- |
| `ORDER BY` column, with `ASC` or `DESC` |    ✅     | `select/select.sql`                                             |
| `ORDER BY` several columns              |    ✅     | `select/sort.sql`                                               |
| `ORDER BY` position                     |    ✅     | `select/select.sql`                                             |
| `ORDER BY` select-list alias            |    ✅     | `select/select.sql`                                             |
| `ORDER BY` expression                   |    ✅     | `select/sort.sql`                                               |
| `ORDER BY ... COLLATE`                  |    ✅     | `select/sort.sql`                                               |
| `ORDER BY ... WITH ROLLUP`              |    ❌     |                                                                 |
| `LIMIT row_count`                       |    ✅     | `select/limit.sql`                                              |
| `LIMIT row_count OFFSET offset`         |    ✅     | `select/limit.sql`                                              |
| `LIMIT offset, row_count`               |    ✅     | `select/syntax.sql` |
| Placeholders in `LIMIT ?`               |    ❌     |                                                                 |

### Locking reads

| Feature                            | Supported | Notes                                                 |
| :--------------------------------- | :-------: | ----------------------------------------------------- |
| `FOR UPDATE`                       |    ❌     | Accepted and ignored. No lock is taken. Not tested. |
| `FOR UPDATE OF tbl`                |    ❌     |                                                       |
| `FOR SHARE` and `FOR SHARE OF tbl` |    ❌     |                                                       |
| `LOCK IN SHARE MODE`               |    ❌     | Accepted and ignored. No lock is taken. Not tested. |
| `NOWAIT`                           |    ❌     |                                                       |
| `SKIP LOCKED`                      |    ❌     | Accepted and ignored. No lock is taken. Not tested. |

### Set operators

| Feature                                                                   | Supported | Notes                                                                             |
| :------------------------------------------------------------------------ | :-------: | --------------------------------------------------------------------------------- |
| `UNION [DISTINCT]`                                                        |    ❌     | Silently wrong. A probe of `SELECT 1 UNION SELECT 2` returned only the first row. |
| `UNION ALL`                                                               |    ❌     |                                                                                   |
| `INTERSECT [ALL \| DISTINCT]`                                             |    ❌     |                                                                                   |
| `EXCEPT [ALL \| DISTINCT]`                                                |    ❌     |                                                                                   |
| Parenthesized query term `( query_expression [ORDER BY] [LIMIT] [INTO] )` |    ❌     |                                                                                   |
| `ORDER BY` or `LIMIT` after a set operator                                |    ❌     |                                                                                   |

### Common table expressions

| Feature                                                   | Supported | Notes       |
| :-------------------------------------------------------- | :-------: | ----------- |
| `WITH cte AS (SELECT ...) SELECT ...`                     |    ❌     | Not tested. |
| `WITH cte (col_list) AS (...)`                            |    ❌     |             |
| `WITH cte1 AS (...), cte2 AS (...)` (several)             |    ❌     |             |
| `WITH RECURSIVE`                                          |    ❌     |             |
| `WITH ... UPDATE` / `WITH ... DELETE` / `WITH ... INSERT` |    ❌     |             |

### Subqueries

Subqueries are independent (no reference to the outer query) or dependent (correlated, referencing an outer table).

| Feature                                                                                      | Supported | Notes                                                      |
| :------------------------------------------------------------------------------------------- | :-------: | ---------------------------------------------------------- |
| Independent scalar subquery in `WHERE`, compared with an operator                            |    ✅     | `select/subquery.sql`. Must return one row and one column. |
| Independent scalar subquery as an operand of arithmetic or `OR` in `WHERE`                   |    ✅     | `select/subquery.sql`                                      |
| Independent scalar subquery in `HAVING`                                                      |    ✅     | `select/having.sql`                                        |
| Independent scalar subquery in `UPDATE ... WHERE`                                            |    ✅     | `select/subquery.sql`                                      |
| Independent scalar subquery in `DELETE ... WHERE`                                            |    ✅     | `select/subquery.sql`                                      |
| Independent scalar subquery in `SET @var = (SELECT ...)`                                     |    ✅     | `expression/variables.sql`                                 |
| Subquery returning more than one row (error)                                                 |    ✅     | `select/subquery_error.sql`. Error `ER_SUBQUERY_NO_1_ROW`. |
| Independent scalar subquery as the whole `WHERE` condition                                   |    ❌     |                                                            |
| Independent scalar subquery in `ORDER BY` or `GROUP BY`                                      |    ❌     |                                                            |
| Independent scalar subquery in `INSERT ... VALUES`                                           |    ❌     |                                                            |
| Independent scalar subquery in `UPDATE ... SET`                                              |    ❌     |                                                            |
| Independent scalar subquery in select list                                                   |    ❌     | `ER_NO: Unsupport sql feature.` See `MYSQL_GAPS.md`.       |
| Column subquery, `expr [NOT] IN (SELECT ...)`                                                |    ❌     | `ER_NO: Unsupport sql feature.` See `MYSQL_GAPS.md`.       |
| Row subquery, `(a, b) [NOT] IN (SELECT ...)`                                                 |    ❌     |                                                            |
| Row subquery, `(a, b) = (SELECT ...)`, `ROW(a, b) = (SELECT ...)`, `(a, b) <=> (SELECT ...)` |    ❌     |                                                            |
| `EXISTS (SELECT ...)`                                                                        |    ❌     | Fails with `ER_NO_SUCH_TABLE`. See `MYSQL_GAPS.md`.        |
| `NOT EXISTS (SELECT ...)`                                                                    |    ❌     | Fails with `ER_NO_SUCH_TABLE`. See `MYSQL_GAPS.md`.        |
| `expr op ANY (SELECT ...)` and `expr op SOME (SELECT ...)`                                   |    ❌     |                                                            |
| `expr op ALL (SELECT ...)`                                                                   |    ❌     |                                                            |
| `expr = ANY (TABLE t)`, `expr = ALL (VALUES ROW(...))` forms                                 |    ❌     |                                                            |
| Dependent (correlated) scalar subquery in `WHERE`                                            |    ❌     | Fails with `ER_NO_SUCH_TABLE`. See `MYSQL_GAPS.md`.        |
| Dependent (correlated) subquery in select list                                               |    ❌     |                                                            |
| Dependent (correlated) `EXISTS` subquery                                                     |    ❌     | See `MYSQL_GAPS.md`.                                       |
| Dependent derived table in `FROM` (`LATERAL`)                                                |    ❌     |                                                            |
| Subquery nested inside a subquery (scalar)                                                   |    ❌     |                                                            |
| Subquery nested inside a derived table                                                       |    ✅     | `select/derived_table.sql`                                 |

### TABLE and VALUES statements

| Feature                                                   | Supported | Notes |
| :-------------------------------------------------------- | :-------: | ----- |
| `TABLE tbl_name [ORDER BY col] [LIMIT n [OFFSET m]]`      |    ❌     |       |
| `TABLE tbl_name INTO OUTFILE / DUMPFILE / @var`           |    ❌     |       |
| `VALUES ROW(...), ROW(...) [ORDER BY column_N] [LIMIT n]` |    ❌     |       |

## UPDATE

| Feature                                                     | Supported | Notes                                                                                           |
| :---------------------------------------------------------- | :-------: | ----------------------------------------------------------------------------------------------- |
| `UPDATE t SET col = value WHERE ...`                        |    ✅     | `update/update.sql`                                                                             |
| Several columns in `SET`                                    |    ✅     | `update/edge_cases.sql`                                                                         |
| `SET` to `NULL`                                             |    ✅     | `update/edge_cases.sql`                                                                         |
| `SET` with an expression on the same column                 |    ✅     | `update/edge_cases.sql`                                                                         |
| `SET` with a function call                                  |    ✅     | `update/edge_cases.sql`                                                                         |
| `SET col = DEFAULT`                                         |    ❌     |                                                                                                 |
| Changing a primary key value                                |    ✅     | Works on the memory engine (`memory/temp.sql`). The raw engine rejects it. See `MYSQL_GAPS.md`. |
| `UPDATE` without `WHERE`                                    |    ❌     | Only in an error case file (`memory/temp_error.sql`).                                           |
| `UPDATE IGNORE`                                             |    ✅     | `update/update_ignore.sql`                                                                      |
| `UPDATE LOW_PRIORITY`                                       |    ❌     |                                                                                                 |
| `UPDATE ... ORDER BY`                                       |    ❌     | A probe ran without error. Not tested.                                                          |
| `UPDATE ... ORDER BY ... LIMIT n` |    ✅     | `update/order_limit.sql` |
| Multi-table update with `JOIN ... USING (...)`              |    ✅     | `update/multi_table.sql`                                                                        |
| Multi-table update with `JOIN ... ON`                       |    ✅     | `update/multi_table.sql`                                                                        |
| Multi-table update with a derived table as a join source    |    ✅     | `select/derived_table.sql`                                                                      |
| Comma multi-table update, `UPDATE a, b SET ...`             |    ✅     | `update/multi_table_comma.sql` |
| Derived table as the update target, `UPDATE (SELECT ...) s` |    ❌     | `ER_NO_DB_ERROR`. See `MYSQL_GAPS.md`.                                                          |
| `WITH cte UPDATE ...`                                       |    ❌     |                                                                                                 |
| Subquery in `WHERE`                                         |    ✅     | Scalar form only. See Subqueries under SELECT.                                                  |

## INSERT

| Feature                                                               | Supported | Notes                                                                                  |
| :-------------------------------------------------------------------- | :-------: | -------------------------------------------------------------------------------------- |
| `INSERT INTO t (cols) VALUES (...)`                                   |    ✅     | `insert/insert.sql`                                                                    |
| `INSERT ... VALUE (...)` (singular keyword)                           |    ❌     |                                                                                        |
| Several rows in `VALUES`                                              |    ✅     | `insert/insert.sql`                                                                    |
| Column list in any order                                              |    ✅     | `insert/edge_cases.sql`                                                                |
| Partial column list (other columns take their default)                |    ✅     | `insert/edge_cases.sql`                                                                |
| `VALUES` without a column list                                        |    ❌     | `ER_NO: Unsupport sql feature.` `insert_handler.ts` rejects it before the engine runs. |
| `DEFAULT` as a value                                                  |    ❌     |                                                                                        |
| `VALUES ROW(...)` row constructor form                                |    ✅     | `insert/syntax.sql` |
| `INSERT ... TABLE tbl_name`                                           |    ❌     |                                                                                        |
| `INSERT INTO t SET col = value, ...`                                  |    ✅     | `insert/insert.sql`                                                                    |
| `INSERT ... SELECT`                                                   |    ✅     | `insert/insert_select.sql`                                                             |
| `INSERT ... SELECT` with a column list                                |    ✅     | `insert/insert_select.sql`                                                             |
| `INSERT IGNORE`                                                       |    ✅     | `insert/insert_select.sql`                                                             |
| `INSERT LOW_PRIORITY`, `INSERT HIGH_PRIORITY`                         |    ❌     |                                                                                        |
| `INSERT DELAYED` (accepted and ignored in 8.4)                        |    ❌     |                                                                                        |
| `INSERT ... PARTITION (p1, ...)`                                      |    ❌     |                                                                                        |
| `INSERT ... ON DUPLICATE KEY UPDATE`                                  |    ✅     | `insert/on_duplicate_key.sql`                                                          |
| `ON DUPLICATE KEY UPDATE` with `INSERT ... SET`                       |    ✅     | `insert/on_duplicate_key.sql`                                                          |
| `ON DUPLICATE KEY UPDATE` with `INSERT ... SELECT`                    |    ✅     | `insert/on_duplicate_key.sql`                                                          |
| `VALUES(col)` inside `ON DUPLICATE KEY UPDATE`                        |    ✅     | `insert/on_duplicate_key.sql`                                                          |
| `ON DUPLICATE KEY UPDATE` changing a primary key                      |    ✅     | Memory engine only (`insert/on_duplicate_key.sql`). The raw engine rejects it.         |
| Row alias `AS new_row [(col_alias, ...)]` in `VALUES` and `SET` forms |    ❌     |                                                                                        |
| `ON DUPLICATE KEY UPDATE` referencing a row alias                     |    ❌     |                                                                                        |

## REPLACE

| Feature                                                | Supported | Notes                                                    |
| :----------------------------------------------------- | :-------: | -------------------------------------------------------- |
| `REPLACE INTO t (cols) VALUES (...)`                   |    ✅     | `replace/replace.sql`                                    |
| `REPLACE INTO t SET col = value, ...`                  |    ✅     | `replace/replace.sql`                                    |
| `REPLACE ... SELECT`                                   |    ✅     | `replace/syntax.sql` |
| `REPLACE ... TABLE tbl_name`                           |    ❌     |                                                          |
| `REPLACE ... VALUES ROW(...)`                          |    ✅     | `replace/syntax.sql` |
| `REPLACE LOW_PRIORITY`, `REPLACE DELAYED` (deprecated) |    ❌     |                                                          |
| `REPLACE ... PARTITION (p1, ...)`                      |    ❌     |                                                          |

## DELETE

| Feature                                                          | Supported | Notes                                                                               |
| :--------------------------------------------------------------- | :-------: | ----------------------------------------------------------------------------------- |
| `DELETE FROM t WHERE ...`                                        |    ✅     | `delete/delete.sql`                                                                 |
| `DELETE FROM t` without `WHERE`                                  |    ✅     | `delete/delete.sql`                                                                 |
| Complex `WHERE` (`OR`, `AND`, `IS NULL`)                         |    ✅     | `delete/delete_edge_cases.sql`                                                      |
| Subquery in `WHERE`                                              |    ✅     | Scalar form only. `select/subquery.sql`                                             |
| `DELETE FROM t AS alias`                                         |    ❌     |                                                                                     |
| `DELETE ... PARTITION (p1, ...)`                                 |    ❌     |                                                                                     |
| `DELETE ... ORDER BY`                                            |    ❌     | A probe ran without error. Not tested.                                              |
| `DELETE ... ORDER BY ... LIMIT n` |    ✅     | `delete/order_limit.sql` |
| `DELETE IGNORE`                                                  |    ❌     |                                                                                     |
| `DELETE LOW_PRIORITY`, `DELETE QUICK`                            |    ❌     |                                                                                     |
| Multi-table `DELETE t1[.*] [, t2[.*]] FROM table_references ...` |    ❌     | `delete/multi_table.sql` covers one target table. |
| Multi-table `DELETE ... USING table_references ...`              |    ❌     |                                                                                     |
| `WITH cte DELETE ...`                                            |    ❌     |                                                                                     |

## USE

| Feature                             | Supported | Notes             |
| :---------------------------------- | :-------: | ----------------- |
| `USE db_name`                       |    ✅     | `ddl/drop.sql`    |
| Unqualified table names after `USE` |    ✅     | `memory/temp.sql` |

## CREATE

### CREATE DATABASE and CREATE SCHEMA

| Feature                                       | Supported | Notes                  |
| :-------------------------------------------- | :-------: | ---------------------- |
| `CREATE DATABASE db_name`                     |    ✅     | `ddl/create.sql`       |
| `CREATE DATABASE IF NOT EXISTS db_name`       |    ✅     | `ddl/create.sql`       |
| `CREATE DATABASE ... COLLATE`                 |    ✅     | `test/setup/setup.sql` |
| `CREATE DATABASE ... [DEFAULT] CHARACTER SET` |    ✅     | `ddl/create_temporary.sql` |
| `CREATE DATABASE ... [DEFAULT] ENCRYPTION`    |    ❌     |                        |
| `CREATE SCHEMA` (synonym of `DATABASE`)       |    ❌     |                        |

### CREATE TABLE

| Feature                                                                                                                                                                                                                                                                                                                                                | Supported | Notes                                                                   |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----------------------------------------------------------------------- |
| `CREATE TABLE t (column_definitions)`                                                                                                                                                                                                                                                                                                                  |    ✅     | `ddl/create_variations.sql`                                             |
| `CREATE TABLE IF NOT EXISTS`                                                                                                                                                                                                                                                                                                                           |    ✅     | `ddl/create_variations.sql`                                             |
| `CREATE TEMPORARY TABLE`                                                                                                                                                                                                                                                                                                                               |    ✅     | `select/having.sql`, `memory/memory_edge_cases.sql`                     |
| Inline `PRIMARY KEY` on a column                                                                                                                                                                                                                                                                                                                       |    ✅     | `ddl/create.sql`                                                        |
| Table constraint `PRIMARY KEY (a, b)`                                                                                                                                                                                                                                                                                                                  |    ✅     | `ddl/create.sql`                                                        |
| `UNIQUE [KEY]` column attribute                                                                                                                                                                                                                                                                                                                        |    ❌     | Accepted and not enforced. |
| `UNIQUE KEY` / `UNIQUE INDEX` table constraint                                                                                                                                                                                                                                                                                                         |    ❌     |                                                                         |
| `INDEX` / `KEY` table constraint (`[index_name] [index_type] (key_part, ...)`)                                                                                                                                                                                                                                                                         |    ❌     |                                                                         |
| `FULLTEXT` / `SPATIAL` index table constraint                                                                                                                                                                                                                                                                                                          |    ❌     |                                                                         |
| `CONSTRAINT [symbol] PRIMARY KEY` / `CONSTRAINT [symbol] UNIQUE`                                                                                                                                                                                                                                                                                       |    ❌     |                                                                         |
| `FOREIGN KEY (cols) REFERENCES tbl (cols)` table constraint                                                                                                                                                                                                                                                                                            |    ❌     |                                                                         |
| `REFERENCES tbl (cols)` inline column reference                                                                                                                                                                                                                                                                                                        |    ❌     |                                                                         |
| `MATCH FULL` / `MATCH PARTIAL` / `MATCH SIMPLE` in a reference                                                                                                                                                                                                                                                                                         |    ❌     |                                                                         |
| `ON DELETE` / `ON UPDATE` reference option (`RESTRICT`, `CASCADE`, `SET NULL`, `NO ACTION`, `SET DEFAULT`)                                                                                                                                                                                                                                             |    ❌     |                                                                         |
| `[CONSTRAINT [symbol]] CHECK (expr) [[NOT] ENFORCED]`                                                                                                                                                                                                                                                                                                  |    ❌     | Accepted and not enforced. |
| `COLLATE` column attribute                                                                                                                                                                                                                                                                                                                             |    ✅     | `select/sort.sql`                                                       |
| `CHARACTER SET` column attribute                                                                                                                                                                                                                                                                                                                       |    ✅     | `ddl/create_temporary.sql` |
| `CHARSET` column attribute (synonym)                                                                                                                                                                                                                                                                                                                   |    ❌     |                                                                         |
| `COLUMN_FORMAT {FIXED \| DYNAMIC \| DEFAULT}`                                                                                                                                                                                                                                                                                                          |    ❌     |                                                                         |
| `ENGINE_ATTRIBUTE` and `SECONDARY_ENGINE_ATTRIBUTE` column attributes                                                                                                                                                                                                                                                                                  |    ❌     |                                                                         |
| `STORAGE {DISK \| MEMORY}` column attribute                                                                                                                                                                                                                                                                                                            |    ❌     |                                                                         |
| `NOT NULL` / `NULL` column attributes                                                                                                                                                                                                                                                                                                                  |    ❌     |                                                                         |
| `DEFAULT literal` / `DEFAULT (expr)` column attribute                                                                                                                                                                                                                                                                                                  |    ❌     |                                                                         |
| `VISIBLE` / `INVISIBLE` column attribute                                                                                                                                                                                                                                                                                                               |    ❌     |                                                                         |
| `AUTO_INCREMENT` column attribute                                                                                                                                                                                                                                                                                                                      |    ❌     |                                                                         |
| `COMMENT 'string'` column attribute                                                                                                                                                                                                                                                                                                                    |    ❌     | Accepted. Not reported by `information_schema`. |
| `SRID n` column attribute                                                                                                                                                                                                                                                                                                                              |    ❌     |                                                                         |
| `ON UPDATE CURRENT_TIMESTAMP` column attribute                                                                                                                                                                                                                                                                                                         |    ❌     |                                                                         |
| Generated column `[GENERATED ALWAYS] AS (expr) [VIRTUAL \| STORED]`                                                                                                                                                                                                                                                                                    |    ❌     |                                                                         |
| Table option `ENGINE = MEMORY`                                                                                                                                                                                                                                                                                                                         |    ✅     | `memory/memory_edge_cases.sql`                                          |
| Table option `ENGINE = RAW`                                                                                                                                                                                                                                                                                                                            |    ❌     | Appears only in an error case file (`ddl/create_variations_error.sql`). |
| Table option `ENGINE = other_engine`                                                                                                                                                                                                                                                                                                                   |    ❌     |                                                                         |
| Table option `AUTO_INCREMENT = n`                                                                                                                                                                                                                                                                                                                      |    ❌     |                                                                         |
| Table option `AUTOEXTEND_SIZE`, `AVG_ROW_LENGTH`, `CHECKSUM`, `COMPRESSION`, `CONNECTION`, `DELAY_KEY_WRITE`, `ENCRYPTION`, `ENGINE_ATTRIBUTE`, `INSERT_METHOD`, `KEY_BLOCK_SIZE`, `MAX_ROWS`, `MIN_ROWS`, `PACK_KEYS`, `PASSWORD`, `ROW_FORMAT`, `SECONDARY_ENGINE_ATTRIBUTE`, `STATS_AUTO_RECALC`, `STATS_PERSISTENT`, `STATS_SAMPLE_PAGES`, `UNION` |    ❌     |                                                                         |
| Table option `[DEFAULT] CHARACTER SET`                                                                                                                                                                                                                                                                                                                 |    ✅     | `ddl/create_temporary.sql` |
| Table option `[DEFAULT] COLLATE`                                                                                                                                                                                                                                                                                                                       |    ✅     | `ddl/create_temporary.sql` |
| Table option `COMMENT 'string'`                                                                                                                                                                                                                                                                                                                        |    ❌     | Accepted and ignored. |
| Table option `TABLESPACE name [STORAGE {DISK \| MEMORY}]`                                                                                                                                                                                                                                                                                              |    ❌     |                                                                         |
| Table option `DATA DIRECTORY` / `INDEX DIRECTORY`                                                                                                                                                                                                                                                                                                      |    ❌     |                                                                         |
| Table option `START TRANSACTION`                                                                                                                                                                                                                                                                                                                       |    ❌     |                                                                         |
| Table option `IGNORE` / `REPLACE` with `AS query`                                                                                                                                                                                                                                                                                                      |    ❌     |                                                                         |
| `CREATE TABLE ... AS SELECT` (CTAS), with or without column definitions                                                                                                                                                                                                                                                                                |    ✅     | `ddl/ctas.sql`, `ddl/create_variations.sql`                             |
| CTAS with `WHERE`, expressions, or `JOIN`                                                                                                                                                                                                                                                                                                              |    ✅     | `ddl/create_variations.sql`                                             |
| `CREATE TABLE ... (LIKE other_tbl)` or `CREATE TABLE ... LIKE other_tbl`                                                                                                                                                                                                                                                                               |    ❌     |                                                                         |
| `PARTITION BY HASH / LINEAR HASH / KEY / LINEAR KEY / RANGE / LIST`, `PARTITIONS n`, subpartitions                                                                                                                                                                                                                                                     |    ❌     |                                                                         |

### Column data types (CREATE TABLE and ALTER TABLE)

| Type                                                                                                                | Supported | Notes                          |
| :------------------------------------------------------------------------------------------------------------------ | :-------: | ------------------------------ |
| `INT [(M)] [UNSIGNED] [ZEROFILL]`                                                                                   |    ✅     | `ddl/create_variations.sql`    |
| `INTEGER`                                                                                                           |    ❌     |                                |
| `VARCHAR(M) [CHARACTER SET cs] [COLLATE co]`                                                                        |    ✅     | `ddl/create_variations.sql`    |
| `BOOLEAN`                                                                                                           |    ✅     | `memory/memory_edge_cases.sql` |
| `BOOL`                                                                                                              |    ❌     |                                |
| `JSON`                                                                                                              |    ✅     | `memory/memory_json.sql`       |
| `TINYINT`, `SMALLINT`, `MEDIUMINT`, `BIGINT` (with `UNSIGNED`, `ZEROFILL`)                                          |    ❌     | Only `BIGINT UNSIGNED` matches MySQL (`ddl/create_types.sql`). The other sizes report `VAR_STRING` field types. |
| `SERIAL` and `SERIAL DEFAULT VALUE`                                                                                 |    ❌     |                                |
| `DECIMAL(M,D)`, `DEC`, `NUMERIC`, `FIXED`                                                                           |    ❌     |                                |
| `FLOAT[(p)]`, `FLOAT(M,D)` (deprecated), `DOUBLE`, `DOUBLE PRECISION`, `REAL`                                       |    ❌     |                                |
| `BIT(M)`                                                                                                            |    ❌     |                                |
| `DATE`, `TIME[(fsp)]`, `DATETIME[(fsp)]`, `TIMESTAMP[(fsp)]`, `YEAR`                                                |    ❌     | `DATE`, `TIME(3)`, `DATETIME(6)`: `ddl/create_types.sql`. `YEAR` reports `VAR_STRING`. |
| `DEFAULT CURRENT_TIMESTAMP`, `ON UPDATE CURRENT_TIMESTAMP`                                                          |    ❌     |                                |
| `CHAR(M)`, `CHARACTER(M)`, `NCHAR(M)`, `NATIONAL CHAR(M)`                                                           |    ❌     | `CHAR(3)`: `ddl/create_types.sql`. Other spellings are not tested. |
| `CHAR BYTE`                                                                                                         |    ❌     |                                |
| `CHARACTER VARYING(M)`, `NVARCHAR(M)`, `NATIONAL VARCHAR(M)`                                                        |    ❌     |                                |
| `BINARY(M)`, `VARBINARY(M)`                                                                                         |    ❌     | `VARBINARY(8)`: `ddl/create_types.sql`. `BINARY(M)` does not match MySQL. |
| `TINYBLOB`, `BLOB[(M)]`, `MEDIUMBLOB`, `LONGBLOB`                                                                   |    ❌     | `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB` without a size: `ddl/create_types.sql`. |
| `TINYTEXT`, `TEXT[(M)]`, `MEDIUMTEXT`, `LONGTEXT`, `LONG [VARCHAR]`                                                 |    ❌     | `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`: `ddl/create_types.sql`. |
| `ENUM('v', ...)`, `SET('v', ...)`                                                                                   |    ❌     | Does not match MySQL. `ENUM` and `SET` report `VAR_STRING` field types. |
| `GEOMETRY`, `POINT`, `LINESTRING`, `POLYGON`, `MULTIPOINT`, `MULTILINESTRING`, `MULTIPOLYGON`, `GEOMETRYCOLLECTION` |    ❌     |                                |
| Deprecated column attributes `BINARY`, `ASCII`, `UNICODE`                                                           |    ❌     |                                |

### CREATE INDEX

| Feature                                                                                                                            | Supported | Notes |
| :--------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----- |
| `CREATE INDEX name ON tbl (key_part, ...)`                                                                                         |    ❌     |       |
| `CREATE UNIQUE INDEX`                                                                                                              |    ❌     |       |
| `CREATE FULLTEXT INDEX`                                                                                                            |    ❌     |       |
| `CREATE SPATIAL INDEX`                                                                                                             |    ❌     |       |
| Key part `col(length)` (prefix index)                                                                                              |    ❌     |       |
| Key part `(expr)` (functional index)                                                                                               |    ❌     |       |
| Key part `(CAST json_expr AS type ARRAY)` (multi-valued index)                                                                     |    ❌     |       |
| Key part sort order `ASC` / `DESC`                                                                                                 |    ❌     |       |
| Index type `USING {BTREE \| HASH}`                                                                                                 |    ❌     |       |
| Index options `KEY_BLOCK_SIZE`, `WITH PARSER`, `COMMENT`, `VISIBLE`, `INVISIBLE`, `ENGINE_ATTRIBUTE`, `SECONDARY_ENGINE_ATTRIBUTE` |    ❌     |       |
| `ALGORITHM = {DEFAULT \| INPLACE \| COPY}` and `LOCK = ...` on index creation                                                      |    ❌     |       |

### CREATE VIEW

| Feature                                         | Supported | Notes                           |
| :---------------------------------------------- | :-------: | ------------------------------- |
| `CREATE VIEW v AS SELECT ...`                   |    ❌     | `ER_NO: Unsupport sql feature.` |
| `CREATE OR REPLACE VIEW`                        |    ❌     |                                 |
| `ALGORITHM = {UNDEFINED \| MERGE \| TEMPTABLE}` |    ❌     |                                 |
| `DEFINER = user`                                |    ❌     |                                 |
| `SQL SECURITY {DEFINER \| INVOKER}`             |    ❌     |                                 |
| View column list `v (col, ...)`                 |    ❌     |                                 |
| `WITH [CASCADED \| LOCAL] CHECK OPTION`         |    ❌     |                                 |

### CREATE TRIGGER

| Feature                                                                                       | Supported | Notes |
| :-------------------------------------------------------------------------------------------- | :-------: | ----- |
| `CREATE TRIGGER name {BEFORE \| AFTER} {INSERT \| UPDATE \| DELETE} ON tbl FOR EACH ROW body` |    ❌     |       |
| `IF NOT EXISTS` on a trigger                                                                  |    ❌     |       |
| `DEFINER = user` on a trigger                                                                 |    ❌     |       |
| `FOLLOWS other_trigger` / `PRECEDES other_trigger`                                            |    ❌     |       |
| `OLD.col` and `NEW.col` references                                                            |    ❌     |       |

### CREATE PROCEDURE and CREATE FUNCTION (stored)

| Feature                                                                                                                                                                        | Supported | Notes |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----- |
| `CREATE PROCEDURE name (params) routine_body`                                                                                                                                  |    ❌     |       |
| Parameter directions `IN`, `OUT`, `INOUT`                                                                                                                                      |    ❌     |       |
| Routine characteristics `COMMENT`, `LANGUAGE SQL`, `[NOT] DETERMINISTIC`, `CONTAINS SQL`, `NO SQL`, `READS SQL DATA`, `MODIFIES SQL DATA`, `SQL SECURITY {DEFINER \| INVOKER}` |    ❌     |       |
| `CREATE FUNCTION name (params) RETURNS type routine_body`                                                                                                                      |    ❌     |       |
| Routine body `BEGIN ... END` or single statement or `RETURN expr`                                                                                                              |    ❌     |       |
| `IF NOT EXISTS` on a routine                                                                                                                                                   |    ❌     |       |
| `CREATE AGGREGATE FUNCTION name RETURNS type SONAME 'lib'` (loadable function)                                                                                                 |    ❌     |       |
| `CREATE FUNCTION name RETURNS type SONAME 'lib'` (loadable function)                                                                                                           |    ❌     |       |

### CREATE EVENT

| Feature                                                                   | Supported | Notes |
| :------------------------------------------------------------------------ | :-------: | ----- |
| `CREATE EVENT name ON SCHEDULE AT timestamp [+ INTERVAL n unit]`          |    ❌     |       |
| `CREATE EVENT name ON SCHEDULE EVERY n unit [STARTS ...] [ENDS ...]`      |    ❌     |       |
| `ON COMPLETION [NOT] PRESERVE`                                            |    ❌     |       |
| `ENABLE`, `DISABLE`, `DISABLE ON REPLICA` (`DISABLE ON SLAVE` deprecated) |    ❌     |       |
| `COMMENT 'string'` on an event                                            |    ❌     |       |
| `DO event_body`                                                           |    ❌     |       |
| `IF NOT EXISTS` and `DEFINER = user` on an event                          |    ❌     |       |

### CREATE USER and CREATE ROLE

| Feature                                                                                                                                               | Supported | Notes |
| :---------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----- |
| `CREATE USER [IF NOT EXISTS] user [auth_option] ...`                                                                                                  |    ❌     |       |
| Authentication options `IDENTIFIED BY`, `IDENTIFIED BY RANDOM PASSWORD`, `IDENTIFIED WITH plugin [BY \| AS]`, `INITIAL AUTHENTICATION IDENTIFIED ...` |    ❌     |       |
| Multi-factor `AND 2fa_auth_option`, `AND 3fa_auth_option`                                                                                             |    ❌     |       |
| `DEFAULT ROLE role [, role] ...`                                                                                                                      |    ❌     |       |
| TLS options `REQUIRE NONE`, `SSL`, `X509`, `CIPHER`, `ISSUER`, `SUBJECT`, `AND`                                                                       |    ❌     |       |
| Resource options `WITH MAX_QUERIES_PER_HOUR`, `MAX_UPDATES_PER_HOUR`, `MAX_CONNECTIONS_PER_HOUR`, `MAX_USER_CONNECTIONS`                              |    ❌     |       |
| Password options `PASSWORD EXPIRE [DEFAULT \| NEVER \| INTERVAL n DAY]`, `PASSWORD HISTORY`, `PASSWORD REUSE INTERVAL`, `PASSWORD REQUIRE CURRENT`    |    ❌     |       |
| `FAILED_LOGIN_ATTEMPTS n`, `PASSWORD_LOCK_TIME {n \| UNBOUNDED}`                                                                                      |    ❌     |       |
| `ACCOUNT LOCK` / `ACCOUNT UNLOCK`                                                                                                                     |    ❌     |       |
| `COMMENT 'string'` / `ATTRIBUTE 'json'` on an account                                                                                                 |    ❌     |       |
| `CREATE ROLE [IF NOT EXISTS] role [, role] ...`                                                                                                       |    ❌     |       |

### CREATE SERVER, TABLESPACE, LOGFILE GROUP, RESOURCE GROUP, SPATIAL REFERENCE SYSTEM

| Feature                                                                                                                                                                                                                               | Supported | Notes |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------: | ----- |
| `CREATE SERVER name FOREIGN DATA WRAPPER w OPTIONS (...)`                                                                                                                                                                             |    ❌     |       |
| `CREATE [UNDO] TABLESPACE name` with `ADD DATAFILE`, `FILE_BLOCK_SIZE`, `AUTOEXTEND_SIZE`, `ENCRYPTION`, `USE LOGFILE GROUP`, `EXTENT_SIZE`, `INITIAL_SIZE`, `MAX_SIZE`, `NODEGROUP`, `WAIT`, `COMMENT`, `ENGINE`, `ENGINE_ATTRIBUTE` |    ❌     |       |
| `CREATE LOGFILE GROUP name ADD UNDOFILE 'f' ... ENGINE = NDB`                                                                                                                                                                         |    ❌     |       |
| `CREATE RESOURCE GROUP name TYPE = {SYSTEM \| USER} [VCPU = ...] [THREAD_PRIORITY = n] [ENABLE \| DISABLE]`                                                                                                                           |    ❌     |       |
| `CREATE [OR REPLACE] SPATIAL REFERENCE SYSTEM [IF NOT EXISTS] srid NAME ... DEFINITION ... ORGANIZATION ... IDENTIFIED BY ... [DESCRIPTION ...]`                                                                                      |    ❌     |       |

## DROP

| Feature                                                   | Supported | Notes                                    |
| :-------------------------------------------------------- | :-------: | ---------------------------------------- |
| `DROP DATABASE db_name`                                   |    ✅     | `ddl/create.sql`                         |
| `DROP DATABASE IF EXISTS db_name`                         |    ✅     | `test/setup/setup.sql`                   |
| `DROP SCHEMA db_name` (synonym)                           |    ✅     | `ddl/drop_multi.sql` |
| `DROP TABLE t`                                            |    ✅     | `ddl/create.sql`                         |
| `DROP TABLE IF EXISTS t`                                  |    ✅     | `ddl/drop.sql`                           |
| `DROP TEMPORARY TABLE t`                                  |    ❌     |                                          |
| `DROP TABLE t1, t2, ...` (several tables)                 |    ❌     | Drops only the first table in the list. The other tables are not dropped. |
| `DROP TABLE ... RESTRICT \| CASCADE`                      |    ❌     | Parsed and ignored in MySQL. Not tested. |
| `DROP INDEX name ON tbl [ALGORITHM ...] [LOCK ...]`       |    ❌     |                                          |
| `DROP INDEX PRIMARY ON tbl`                               |    ❌     |                                          |
| `DROP VIEW [IF EXISTS] v [, v] ... [RESTRICT \| CASCADE]` |    ❌     |                                          |
| `DROP TRIGGER [IF EXISTS] [db.]name`                      |    ❌     |                                          |
| `DROP PROCEDURE [IF EXISTS] name`                         |    ❌     |                                          |
| `DROP FUNCTION [IF EXISTS] name` (stored and loadable)    |    ❌     |                                          |
| `DROP EVENT [IF EXISTS] name`                             |    ❌     |                                          |
| `DROP USER [IF EXISTS] user [, user] ...`                 |    ❌     |                                          |
| `DROP ROLE [IF EXISTS] role [, role] ...`                 |    ❌     |                                          |
| `DROP SERVER [IF EXISTS] name`                            |    ❌     |                                          |
| `DROP [UNDO] TABLESPACE name`                             |    ❌     |                                          |
| `DROP LOGFILE GROUP name ENGINE = engine`                 |    ❌     |                                          |
| `DROP RESOURCE GROUP name [FORCE]`                        |    ❌     |                                          |
| `DROP SPATIAL REFERENCE SYSTEM [IF EXISTS] srid`          |    ❌     |                                          |

## ALTER

### ALTER TABLE

| Feature                                                                                                                                                                                                                                                                                                   | Supported | Notes                                  |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | -------------------------------------- |
| `ALTER TABLE t ADD [COLUMN] col definition`                                                                                                                                                                                                                                                               |    ❌     | Not green. On temporary tables, `SELECT *` omits the added column. |
| `ADD COLUMN` with `FIRST` or `AFTER col`                                                                                                                                                                                                                                                                  |    ❌     | Column position is ignored, and the column is missing from `SELECT *`. |
| `ADD [COLUMN] (col def, ...)` several columns in one list                                                                                                                                                                                                                                                 |    ❌     |                                        |
| Several alter operations in one `ALTER TABLE`                                                                                                                                                                                                                                                             |    ❌     | Not tested. See `MYSQL_GAPS.md` for `ADD COLUMN` on temporary tables. |
| `ADD {INDEX \| KEY}`, `ADD {FULLTEXT \| SPATIAL}`, `ADD [CONSTRAINT] PRIMARY KEY`, `ADD [CONSTRAINT] UNIQUE`, `ADD [CONSTRAINT] FOREIGN KEY`, `ADD [CONSTRAINT] CHECK (expr) [[NOT] ENFORCED]`                                                                                                            |    ❌     |                                        |
| `DROP [COLUMN] col`                                                                                                                                                                                                                                                                                       |    ❌     | Not implemented. |
| `DROP {INDEX \| KEY} name`, `DROP PRIMARY KEY`, `DROP FOREIGN KEY fk`, `DROP CHECK name`, `DROP CONSTRAINT name`                                                                                                                                                                                          |    ❌     |                                        |
| `ALTER [COLUMN] col SET DEFAULT {literal \| (expr)}`, `ALTER [COLUMN] col DROP DEFAULT`                                                                                                                                                                                                                   |    ❌     |                                        |
| `ALTER [COLUMN] col SET {VISIBLE \| INVISIBLE}`                                                                                                                                                                                                                                                           |    ❌     |                                        |
| `ALTER INDEX name {VISIBLE \| INVISIBLE}`                                                                                                                                                                                                                                                                 |    ❌     |                                        |
| `ALTER {CHECK \| CONSTRAINT} name [NOT] ENFORCED`                                                                                                                                                                                                                                                         |    ❌     |                                        |
| `CHANGE [COLUMN] old new definition [FIRST \| AFTER col]`                                                                                                                                                                                                                                                 |    ❌     | Not implemented. |
| `MODIFY [COLUMN] col definition [FIRST \| AFTER col]`                                                                                                                                                                                                                                                     |    ❌     | Not implemented. |
| `RENAME COLUMN old TO new`                                                                                                                                                                                                                                                                                |    ❌     | Not implemented. |
| `RENAME {INDEX \| KEY} old TO new`                                                                                                                                                                                                                                                                        |    ❌     |                                        |
| `RENAME [TO \| AS] new_tbl_name`                                                                                                                                                                                                                                                                          |    ❌     |                                        |
| `ALGORITHM [=] {DEFAULT \| INSTANT \| INPLACE \| COPY}`                                                                                                                                                                                                                                                   |    ❌     |                                        |
| `LOCK [=] {DEFAULT \| NONE \| SHARED \| EXCLUSIVE}`                                                                                                                                                                                                                                                       |    ❌     |                                        |
| `{WITHOUT \| WITH} VALIDATION`                                                                                                                                                                                                                                                                            |    ❌     |                                        |
| `[DEFAULT] CHARACTER SET [=] cs [COLLATE [=] co]`                                                                                                                                                                                                                                                         |    ❌     |                                        |
| `CONVERT TO CHARACTER SET cs [COLLATE co]`                                                                                                                                                                                                                                                                |    ❌     |                                        |
| `{DISABLE \| ENABLE} KEYS`                                                                                                                                                                                                                                                                                |    ❌     |                                        |
| `{DISCARD \| IMPORT} TABLESPACE`                                                                                                                                                                                                                                                                          |    ❌     |                                        |
| `ORDER BY col [, col] ...`                                                                                                                                                                                                                                                                                |    ❌     |                                        |
| `FORCE`                                                                                                                                                                                                                                                                                                   |    ❌     |                                        |
| `ENGINE = engine`, `ROW_FORMAT`, `ENCRYPTION`, `AUTO_INCREMENT`, `COMMENT`, `TABLESPACE`, `DATA DIRECTORY`, and the other table options listed under CREATE TABLE                                                                                                                                         |    ❌     |                                        |
| `ALTER TABLE ... PARTITION BY ...` (repartition), `REMOVE PARTITIONING`                                                                                                                                                                                                                                   |    ❌     |                                        |
| `ADD PARTITION`, `DROP PARTITION`, `DISCARD PARTITION ... TABLESPACE`, `IMPORT PARTITION ... TABLESPACE`, `TRUNCATE PARTITION`, `COALESCE PARTITION`, `REORGANIZE PARTITION`, `EXCHANGE PARTITION`, `ANALYZE PARTITION`, `CHECK PARTITION`, `OPTIMIZE PARTITION`, `REBUILD PARTITION`, `REPAIR PARTITION` |    ❌     |                                        |

### ALTER DATABASE, VIEW, EVENT, PROCEDURE, FUNCTION, INSTANCE, SERVER, USER, TABLESPACE, LOGFILE GROUP, RESOURCE GROUP

| Feature                                                                                                                       | Supported | Notes |
| :---------------------------------------------------------------------------------------------------------------------------- | :-------: | ----- |
| `ALTER {DATABASE \| SCHEMA} db [CHARACTER SET] [COLLATE] [ENCRYPTION] [READ ONLY]`                                            |    ❌     |       |
| `ALTER VIEW v ...` (redefines the view)                                                                                       |    ❌     |       |
| `ALTER EVENT name ...` (schedule, completion, rename, enable/disable, comment, body)                                          |    ❌     |       |
| `ALTER PROCEDURE name characteristics`                                                                                        |    ❌     |       |
| `ALTER FUNCTION name characteristics`                                                                                         |    ❌     |       |
| `ALTER INSTANCE {ENABLE \| DISABLE} INNODB REDO_LOG`                                                                          |    ❌     |       |
| `ALTER INSTANCE ROTATE INNODB MASTER KEY`                                                                                     |    ❌     |       |
| `ALTER INSTANCE ROTATE BINLOG MASTER KEY`                                                                                     |    ❌     |       |
| `ALTER INSTANCE RELOAD TLS [FOR CHANNEL ...] [NO ROLLBACK ON ERROR]`                                                          |    ❌     |       |
| `ALTER INSTANCE RELOAD KEYRING`                                                                                               |    ❌     |       |
| `ALTER SERVER name OPTIONS (...)`                                                                                             |    ❌     |       |
| `ALTER USER [IF EXISTS] user [auth_option] ... [REQUIRE ...] [WITH ...] [password_option \| lock_option] ...`                 |    ❌     |       |
| `ALTER USER [IF EXISTS] USER() ...` (current user)                                                                            |    ❌     |       |
| `ALTER USER ... DEFAULT ROLE {NONE \| ALL \| role [, role] ...}`                                                              |    ❌     |       |
| `ALTER USER ... REPLACE 'current' [RETAIN CURRENT PASSWORD]`                                                                  |    ❌     |       |
| `ALTER USER ... DISCARD OLD PASSWORD`                                                                                         |    ❌     |       |
| `ALTER USER ... {ADD \| MODIFY \| DROP} {2 \| 3} FACTOR ...` and `INITIATE REGISTRATION`, `FINISH REGISTRATION`, `UNREGISTER` |    ❌     |       |
| `ALTER TABLESPACE name ADD DATAFILE / DROP DATAFILE / RENAME TO / SET {ACTIVE \| INACTIVE} / AUTOEXTEND_SIZE / ENCRYPTION`    |    ❌     |       |
| `ALTER LOGFILE GROUP name ADD UNDOFILE 'f' ENGINE = NDB`                                                                      |    ❌     |       |
| `ALTER RESOURCE GROUP name [VCPU = ...] [THREAD_PRIORITY = n] [ENABLE \| DISABLE [FORCE]]`                                    |    ❌     |       |

## RENAME, TRUNCATE, and table maintenance

| Feature                                                                                        | Supported | Notes                              |
| :--------------------------------------------------------------------------------------------- | :-------: | ---------------------------------- |
| `RENAME TABLE a TO b [, c TO d] ...`                                                           |    ❌     |                                    |
| `RENAME USER old TO new [, ...]`                                                               |    ❌     |                                    |
| `TRUNCATE [TABLE] tbl_name`                                                                    |    ❌     | `Unsupported query type: truncate` |
| `ANALYZE [NO_WRITE_TO_BINLOG \| LOCAL] TABLE t [, t] ...`                                      |    ❌     |                                    |
| `ANALYZE TABLE t UPDATE HISTOGRAM ON col [, col] ... [WITH n BUCKETS] [AUTO \| MANUAL] UPDATE` |    ❌     |                                    |
| `ANALYZE TABLE t UPDATE HISTOGRAM ON col USING DATA 'json'`                                    |    ❌     |                                    |
| `ANALYZE TABLE t DROP HISTOGRAM ON col [, col] ...`                                            |    ❌     |                                    |
| `OPTIMIZE [NO_WRITE_TO_BINLOG \| LOCAL] TABLE t [, t] ...`                                     |    ❌     |                                    |
| `CHECK TABLE t [, t] ... [FOR UPGRADE \| QUICK \| FAST \| MEDIUM \| EXTENDED \| CHANGED]`      |    ❌     |                                    |
| `REPAIR [NO_WRITE_TO_BINLOG \| LOCAL] TABLE t [, t] ... [QUICK] [EXTENDED] [USE_FRM]`          |    ❌     |                                    |
| `CHECKSUM TABLE t [, t] ... [QUICK \| EXTENDED]`                                               |    ❌     |                                    |

## SHOW

| Feature                                                                                                                                         | Supported | Notes                                                 |
| :---------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----------------------------------------------------- |
| `SHOW TABLES`                                                                                                                                   |    ✅     | `ddl/show.sql`                                        |
| `SHOW [EXTENDED] [FULL] TABLES [{FROM \| IN} db] [LIKE 'p' \| WHERE expr]`                                                                      |    ❌     | `FROM`, `LIKE`, `WHERE`, `FULL`, `EXTENDED` untested. |
| `SHOW DATABASES` / `SHOW SCHEMAS` `[LIKE \| WHERE]`                                                                                             |    ❌     | A probe returned the database list. Not tested.       |
| `SHOW [EXTENDED] [FULL] {COLUMNS \| FIELDS} {FROM \| IN} tbl [{FROM \| IN} db] [LIKE \| WHERE]`                                                 |    ❌     |                                                       |
| `SHOW CREATE DATABASE / SCHEMA [IF NOT EXISTS] db`                                                                                              |    ❌     |                                                       |
| `SHOW CREATE TABLE tbl`                                                                                                                         |    ❌     | `ER_NO: Unsupport sql feature.`                       |
| `SHOW CREATE VIEW v`, `SHOW CREATE EVENT e`, `SHOW CREATE FUNCTION f`, `SHOW CREATE PROCEDURE p`, `SHOW CREATE TRIGGER t`, `SHOW CREATE USER u` |    ❌     |                                                       |
| `SHOW [EXTENDED] {INDEX \| INDEXES \| KEYS} {FROM \| IN} tbl [{FROM \| IN} db] [WHERE expr]`                                                    |    ❌     |                                                       |
| `SHOW [GLOBAL \| SESSION] STATUS [LIKE \| WHERE]`                                                                                               |    ❌     |                                                       |
| `SHOW [GLOBAL \| SESSION] VARIABLES [LIKE \| WHERE]`                                                                                            |    ❌     |                                                       |
| `SHOW ENGINES`, `SHOW [STORAGE] ENGINES`, `SHOW ENGINE name STATUS`, `SHOW ENGINE INNODB MUTEX`, `SHOW ENGINE NDB STATUS`                       |    ❌     |                                                       |
| `SHOW ERRORS [LIMIT ...]`, `SHOW COUNT(*) ERRORS`                                                                                               |    ❌     |                                                       |
| `SHOW WARNINGS [LIMIT ...]`, `SHOW COUNT(*) WARNINGS`                                                                                           |    ❌     |                                                       |
| `SHOW EVENTS [{FROM \| IN} db] [LIKE \| WHERE]`                                                                                                 |    ❌     |                                                       |
| `SHOW FUNCTION CODE f`, `SHOW PROCEDURE CODE p`                                                                                                 |    ❌     | Debug builds only.                                    |
| `SHOW FUNCTION STATUS [LIKE \| WHERE]`, `SHOW PROCEDURE STATUS [LIKE \| WHERE]`                                                                 |    ❌     |                                                       |
| `SHOW GRANTS [FOR user_or_role [USING role ...]]`                                                                                               |    ❌     |                                                       |
| `SHOW OPEN TABLES [{FROM \| IN} db] [LIKE \| WHERE]`                                                                                            |    ❌     |                                                       |
| `SHOW PLUGINS`                                                                                                                                  |    ❌     |                                                       |
| `SHOW PRIVILEGES`                                                                                                                               |    ❌     |                                                       |
| `SHOW [FULL] PROCESSLIST`                                                                                                                       |    ❌     |                                                       |
| `SHOW PROFILE [types] [FOR QUERY n] [LIMIT ...]`, `SHOW PROFILES` (deprecated)                                                                  |    ❌     |                                                       |
| `SHOW TABLE STATUS [{FROM \| IN} db] [LIKE \| WHERE]`                                                                                           |    ❌     |                                                       |
| `SHOW TRIGGERS [{FROM \| IN} db] [LIKE \| WHERE]`                                                                                               |    ❌     |                                                       |
| `SHOW {CHARACTER SET \| CHARSET} [LIKE \| WHERE]`                                                                                               |    ❌     |                                                       |
| `SHOW COLLATION [LIKE \| WHERE]`                                                                                                                |    ❌     |                                                       |
| `SHOW BINARY LOG STATUS`, `SHOW MASTER STATUS` (deprecated name)                                                                                |    ❌     |                                                       |
| `SHOW BINARY LOGS`                                                                                                                              |    ❌     |                                                       |
| `SHOW BINLOG EVENTS [IN 'log'] [FROM pos] [LIMIT ...]`                                                                                          |    ❌     |                                                       |
| `SHOW RELAYLOG EVENTS [IN 'log'] [FROM pos] [LIMIT ...] [FOR CHANNEL c]`                                                                        |    ❌     |                                                       |
| `SHOW REPLICA STATUS [FOR CHANNEL c]`, `SHOW SLAVE STATUS` (deprecated name)                                                                    |    ❌     |                                                       |
| `SHOW REPLICAS`, `SHOW SLAVE HOSTS` (deprecated name)                                                                                           |    ❌     |                                                       |
| `SHOW OPEN TABLES`, `SHOW PRIVILEGES`                                                                                                           |    ❌     |                                                       |
| `LIKE 'pattern'` and `WHERE expr` clauses on any SHOW                                                                                           |    ❌     |                                                       |

## DESCRIBE and EXPLAIN

| Feature                                                   | Supported | Notes                                                         |
| :-------------------------------------------------------- | :-------: | ------------------------------------------------------------- |
| `DESCRIBE tbl` / `DESC tbl` / `EXPLAIN tbl`               |    ❌     | `DESCRIBE tbl` fails with `ER_PARSE_ERROR`. MySQL accepts it. |
| `DESCRIBE tbl col` and `DESCRIBE tbl wild`                |    ❌     |                                                               |
| `EXPLAIN [FORMAT = {TRADITIONAL \| JSON \| TREE}] stmt`   |    ❌     |                                                               |
| `EXPLAIN FORMAT = JSON INTO @var stmt`                    |    ❌     |                                                               |
| `EXPLAIN [FORMAT = ...] FOR CONNECTION id`                |    ❌     |                                                               |
| `EXPLAIN [FORMAT = ...] FOR {SCHEMA \| DATABASE} db stmt` |    ❌     |                                                               |
| `EXPLAIN ANALYZE [FORMAT = TREE] stmt`                    |    ❌     |                                                               |

## SET

| Feature                                                                              | Supported | Notes                                     |
| :----------------------------------------------------------------------------------- | :-------: | ----------------------------------------- |
| `SET @var = expr`                                                                    |    ✅     | `expression/variables.sql`                |
| `SET @var := expr`                                                                   |    ✅     | `expression/set_statements.sql` |
| Several assignments in one `SET`                                                     |    ✅     | `expression/variables.sql`                |
| `SET @var = (SELECT ...)`                                                            |    ✅     | `expression/variables.sql`                |
| `SET @@var = expr` (no scope keyword)                                                |    ✅     | `expression/variables.sql`                |
| `SET @@SESSION.var = expr`                                                           |    ✅     | `expression/variables.sql`                |
| `SET time_zone = expr` with no scope keyword |    ✅     | `expression/set_statements.sql` |
| `SET SESSION time_zone = expr` and `SET LOCAL time_zone = expr` |    ✅     | `expression/set_statements.sql` |
| `SET @@LOCAL.var = expr`                                                             |    ❌     |                                           |
| `SET GLOBAL var = expr`, `SET @@GLOBAL.var = expr`                                   |    ❌     |                                           |
| `SET PERSIST var = expr`, `SET @@PERSIST.var = expr`                                 |    ❌     |                                           |
| `SET PERSIST_ONLY var = expr`, `SET @@PERSIST_ONLY.var = expr`                       |    ❌     |                                           |
| `SET var = DEFAULT`                                                                  |    ❌     |                                           |
| `SET GLOBAL a = x, b = y` (scope applies to later assignments)                       |    ❌     |                                           |
| `SET @@time_zone = ...` (session variable forms)                                     |    ✅     | `expression/timezone.sql`                 |
| `SET param_name = expr` and `SET local_var = expr` in stored programs                |    ❌     |                                           |
| `SET autocommit = {0 \| 1}`                                                          |    ❌     | `ER_UNKNOWN_SYSTEM_VARIABLE`. Not tested. |
| `SET sql_log_bin = {OFF \| ON}`                                                      |    ❌     |                                           |
| `SET {CHARACTER SET \| CHARSET} {'cs' \| DEFAULT}`                                   |    ❌     |                                           |
| `SET NAMES {'cs' [COLLATE 'co'] \| DEFAULT}`                                         |    ❌     | `ER_PARSE_ERROR`. MySQL accepts it.       |
| `SET [GLOBAL \| SESSION] TRANSACTION ISOLATION LEVEL ...`                            |    ❌     |                                           |
| `SET [GLOBAL \| SESSION] TRANSACTION READ {WRITE \| ONLY}`                           |    ❌     |                                           |
| `SET [GLOBAL \| SESSION] transaction_isolation = ...`, `transaction_read_only = ...` |    ❌     |                                           |
| `SET PASSWORD [FOR user] auth_option [REPLACE ...] [RETAIN CURRENT PASSWORD]`        |    ❌     |                                           |
| `SET PASSWORD [FOR user] = 'auth_string'`, `SET PASSWORD [FOR user] TO RANDOM`       |    ❌     |                                           |
| `SET ROLE DEFAULT / NONE / ALL / ALL EXCEPT role / role [, role]`                    |    ❌     |                                           |
| `SET DEFAULT ROLE {NONE \| ALL \| role} TO user [, user]`                            |    ❌     |                                           |
| `SET RESOURCE GROUP name [FOR thread_id [, ...]]`                                    |    ❌     |                                           |

## Transactions and locking

| Feature                                                                 | Supported | Notes                                                                                 |
| :---------------------------------------------------------------------- | :-------: | ------------------------------------------------------------------------------------- |
| `BEGIN`                                                                 |    ✅     | `ddl/transactions.sql`                                                                |
| `BEGIN WORK`                                                            |    ✅     | `ddl/transaction_modes.sql` |
| `START TRANSACTION`                                                     |    ✅     | `insert/on_duplicate_key.sql`                                                         |
| `START TRANSACTION READ ONLY`, `READ WRITE`                             |    ❌     | Accepted and not enforced. `UPDATE` succeeds in a read-only transaction. |
| `START TRANSACTION WITH CONSISTENT SNAPSHOT`                            |    ❌     |                                                                                       |
| `COMMIT`                                                                |    ✅     | `ddl/transactions.sql`                                                                |
| `COMMIT [WORK] [AND [NO] CHAIN] [[NO] RELEASE]`                         |    ❌     |                                                                                       |
| `ROLLBACK`                                                              |    ✅     | `insert/on_duplicate_key.sql`. Raw engine writes are not undone. See `RAW_ENGINE.md`. |
| `ROLLBACK [WORK] [AND [NO] CHAIN] [[NO] RELEASE]`                       |    ❌     |                                                                                       |
| `SAVEPOINT name`                                                        |    ❌     | `ER_PARSE_ERROR`. MySQL accepts it.                                                   |
| `ROLLBACK [WORK] TO [SAVEPOINT] name`                                   |    ❌     |                                                                                       |
| `RELEASE SAVEPOINT name`                                                |    ❌     |                                                                                       |
| `LOCK {TABLE \| TABLES} tbl [AS alias] {READ [LOCAL] \| WRITE} [, ...]` |    ❌     |                                                                                       |
| `UNLOCK {TABLE \| TABLES}`                                              |    ❌     |                                                                                       |
| `XA START \| BEGIN xid [JOIN \| RESUME]`                                |    ❌     |                                                                                       |
| `XA END xid [SUSPEND [FOR MIGRATE]]`                                    |    ❌     |                                                                                       |
| `XA PREPARE xid`, `XA COMMIT xid [ONE PHASE]`, `XA ROLLBACK xid`        |    ❌     |                                                                                       |
| `XA RECOVER [CONVERT XID]`                                              |    ❌     |                                                                                       |

## Prepared statements

| Feature                                                | Supported | Notes |
| :----------------------------------------------------- | :-------: | ----- |
| `PREPARE name FROM 'sql'` and `PREPARE name FROM @var` |    ❌     |       |
| `EXECUTE name`                                         |    ❌     |       |
| `EXECUTE name USING @var [, @var] ...`                 |    ❌     |       |
| `DEALLOCATE PREPARE name`, `DROP PREPARE name`         |    ❌     |       |
| Placeholder `?` in a prepared statement                |    ❌     |       |

## Stored programs, compound statements, and CALL

| Feature                                                                                                                      | Supported | Notes |
| :--------------------------------------------------------------------------------------------------------------------------- | :-------: | ----- |
| `CALL proc_name([args])`, `CALL proc_name` without parentheses                                                               |    ❌     |       |
| `DO expr [, expr] ...`                                                                                                       |    ❌     |       |
| `[label:] BEGIN [statements] END [label]`                                                                                    |    ❌     |       |
| `DECLARE var_name [, ...] type [DEFAULT value]`                                                                              |    ❌     |       |
| `DECLARE name CONDITION FOR mysql_error_code \| SQLSTATE [VALUE] 'state'`                                                    |    ❌     |       |
| `DECLARE {CONTINUE \| EXIT \| UNDO} HANDLER FOR condition [, ...] statement`                                                 |    ❌     |       |
| Handler conditions `SQLWARNING`, `NOT FOUND`, `SQLEXCEPTION`, error code, SQLSTATE, condition name                           |    ❌     |       |
| `DECLARE cursor CURSOR FOR select`                                                                                           |    ❌     |       |
| `OPEN cursor`, `FETCH [[NEXT] FROM] cursor INTO var, ...`, `CLOSE cursor`                                                    |    ❌     |       |
| `IF ... THEN ... [ELSEIF ... THEN ...] [ELSE ...] END IF`                                                                    |    ❌     |       |
| `CASE value WHEN ... THEN ... END CASE` (statement form)                                                                     |    ❌     |       |
| `CASE WHEN condition THEN ... END CASE` (statement form)                                                                     |    ❌     |       |
| `[label:] LOOP ... END LOOP [label]`                                                                                         |    ❌     |       |
| `[label:] WHILE cond DO ... END WHILE [label]`                                                                               |    ❌     |       |
| `[label:] REPEAT ... UNTIL cond END REPEAT [label]`                                                                          |    ❌     |       |
| `LEAVE label`, `ITERATE label`                                                                                               |    ❌     |       |
| `RETURN expr` (stored functions)                                                                                             |    ❌     |       |
| `SIGNAL SQLSTATE [VALUE] 'state' [SET item = value, ...]`, `SIGNAL condition_name [SET ...]`, `SIGNAL mysql_error [SET ...]` |    ❌     |       |
| `RESIGNAL [condition_value] [SET ...]`                                                                                       |    ❌     |       |
| `GET [CURRENT \| STACKED] DIAGNOSTICS target = item, ...`, `GET ... DIAGNOSTICS CONDITION n item`                            |    ❌     |       |

## GRANT and REVOKE

| Feature                                                                                        | Supported | Notes |
| :--------------------------------------------------------------------------------------------- | :-------: | ----- |
| `GRANT priv [(cols)] ON [object_type] level TO user_or_role [WITH GRANT OPTION] [AS user ...]` |    ❌     |       |
| `GRANT PROXY ON user TO user [WITH GRANT OPTION]`                                              |    ❌     |       |
| `GRANT role [, role] ... TO user [WITH ADMIN OPTION]`                                          |    ❌     |       |
| `GRANT` priv level forms `*`, `*.*`, `db.*`, `db.tbl`, `tbl`, `db.routine`                     |    ❌     |       |
| `REVOKE [IF EXISTS] priv [(cols)] ON [object_type] level FROM user [IGNORE UNKNOWN USER]`      |    ❌     |       |
| `REVOKE ALL [PRIVILEGES], GRANT OPTION FROM user`                                              |    ❌     |       |
| `REVOKE PROXY ON user FROM user`                                                               |    ❌     |       |
| `REVOKE [IF EXISTS] role [, role] ... FROM user`                                               |    ❌     |       |

## Replication and binary log

| Feature                                                                                                                                                                                                                                                | Supported | Notes |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | ----- |
| `CHANGE REPLICATION SOURCE TO option [, option] ... [FOR CHANNEL c]`                                                                                                                                                                                   |    ❌     |       |
| `CHANGE REPLICATION FILTER filter [, filter] ... [FOR CHANNEL c]` (filters `REPLICATE_DO_DB`, `REPLICATE_IGNORE_DB`, `REPLICATE_DO_TABLE`, `REPLICATE_IGNORE_TABLE`, `REPLICATE_WILD_DO_TABLE`, `REPLICATE_WILD_IGNORE_TABLE`, `REPLICATE_REWRITE_DB`) |    ❌     |       |
| `START REPLICA [IO_THREAD \| SQL_THREAD] [UNTIL ...] [connection options] [FOR CHANNEL c]`                                                                                                                                                             |    ❌     |       |
| `STOP REPLICA [IO_THREAD \| SQL_THREAD] [FOR CHANNEL c]`                                                                                                                                                                                               |    ❌     |       |
| `RESET REPLICA [ALL] [FOR CHANNEL c]`                                                                                                                                                                                                                  |    ❌     |       |
| `START GROUP_REPLICATION [USER=...] [PASSWORD=...] [DEFAULT_AUTH=...]`                                                                                                                                                                                 |    ❌     |       |
| `STOP GROUP_REPLICATION`                                                                                                                                                                                                                               |    ❌     |       |
| `PURGE BINARY LOGS TO 'log'`, `PURGE BINARY LOGS BEFORE datetime`                                                                                                                                                                                      |    ❌     |       |
| `RESET BINARY LOGS AND GTIDS [TO n]`                                                                                                                                                                                                                   |    ❌     |       |
| `RESET {BINARY LOGS AND GTIDS \| REPLICA}` (`RESET` option forms)                                                                                                                                                                                      |    ❌     |       |
| `BINLOG 'str'`                                                                                                                                                                                                                                         |    ❌     |       |
| `CACHE INDEX tbl_index_list IN key_cache`                                                                                                                                                                                                              |    ❌     |       |
| `LOAD INDEX INTO CACHE tbl_index_list [IGNORE LEAVES]`                                                                                                                                                                                                 |    ❌     |       |

## Administration, plugins, components, and cloning

| Feature                                                                                                                                                                                                                         | Supported | Notes |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------: | ----- |
| `FLUSH [NO_WRITE_TO_BINLOG \| LOCAL] {option ...}` (`BINARY LOGS`, `ENGINE LOGS`, `ERROR LOGS`, `GENERAL LOGS`, `LOGS`, `OPTIMIZER_COSTS`, `PRIVILEGES`, `RELAY LOGS [FOR CHANNEL c]`, `SLOW LOGS`, `STATUS`, `USER_RESOURCES`) |    ❌     |       |
| `FLUSH {TABLE \| TABLES} [tbl ...] [WITH READ LOCK] [FOR EXPORT]`                                                                                                                                                               |    ❌     |       |
| `KILL [CONNECTION \| QUERY] processlist_id`                                                                                                                                                                                     |    ❌     |       |
| `RESET reset_option [, ...]`                                                                                                                                                                                                    |    ❌     |       |
| `RESET PERSIST [IF EXISTS] [system_var]`                                                                                                                                                                                        |    ❌     |       |
| `HELP 'search_string'`                                                                                                                                                                                                          |    ❌     |       |
| `INSTALL PLUGIN name SONAME 'lib'`, `UNINSTALL PLUGIN name`                                                                                                                                                                     |    ❌     |       |
| `INSTALL COMPONENT 'name' [SET ...]`, `UNINSTALL COMPONENT 'name'`                                                                                                                                                              |    ❌     |       |
| `CLONE LOCAL DATA DIRECTORY [=] 'dir'`                                                                                                                                                                                          |    ❌     |       |
| `CLONE INSTANCE FROM 'user'@'host':port IDENTIFIED BY 'pw' [DATA DIRECTORY ...] [REQUIRE [NO] SSL]`                                                                                                                             |    ❌     |       |
| `RESTART`, `SHUTDOWN`                                                                                                                                                                                                           |    ❌     |       |
| `IMPORT TABLE FROM 'sdi_file' [, ...]`                                                                                                                                                                                          |    ❌     |       |

## Data loading

| Feature                                                                                                                      | Supported | Notes |
| :--------------------------------------------------------------------------------------------------------------------------- | :-------: | ----- |
| `LOAD DATA [LOW_PRIORITY \| CONCURRENT] [LOCAL] INFILE 'f' [REPLACE \| IGNORE] INTO TABLE t ...`                             |    ❌     |       |
| `LOAD DATA ... [PARTITION (...)] [CHARACTER SET cs]`                                                                         |    ❌     |       |
| `LOAD DATA ... FIELDS/COLUMNS TERMINATED BY ... [OPTIONALLY] ENCLOSED BY ... ESCAPED BY ...`                                 |    ❌     |       |
| `LOAD DATA ... LINES STARTING BY ... TERMINATED BY ...`                                                                      |    ❌     |       |
| `LOAD DATA ... IGNORE n {LINES \| ROWS}`                                                                                     |    ❌     |       |
| `LOAD DATA ... (col_or_var, ...) SET col = {expr \| DEFAULT}, ...`                                                           |    ❌     |       |
| `LOAD XML [LOW_PRIORITY \| CONCURRENT] [LOCAL] INFILE 'f' [REPLACE \| IGNORE] INTO TABLE t [ROWS IDENTIFIED BY '<tag>'] ...` |    ❌     |       |

## Lexical syntax

### Literals

| Feature                                                                                                                                 | Supported | Notes                                                                            |
| :-------------------------------------------------------------------------------------------------------------------------------------- | :-------: | -------------------------------------------------------------------------------- |
| Double-quoted string literal `"text"`                                                                                                   |    ✅     | Used throughout `test/`. MySQL treats it as a string unless `ANSI_QUOTES` is on. |
| Single-quoted string literal `'text'`                                                                                                   |    ✅     | Used throughout `test/`.                                                         |
| Doubled quote inside a string `'it''s'`, `"say ""hi"""`                                                                                 |    ✅     | `select/syntax.sql` |
| Backslash escapes `\'`, `\"`, `\\`, `\n`, `\t`, `\0`, `\b`, `\r`, `\Z`, `\%`, `\_`                                                      |    ❌     | `\\` appears in `memory/memory_json.sql`. Others untested.                       |
| Adjacent string literals concatenate `'a' 'b'`                                                                                          |    ❌     |                                                                                  |
| Character set introducer `_charset'string'` and `_binary'string'`                                                                       |    ❌     |                                                                                  |
| National string `N'literal'`                                                                                                            |    ❌     |                                                                                  |
| Integer literal, signed or unsigned                                                                                                     |    ✅     | Used throughout `test/`.                                                         |
| Decimal literal `1.5`, `.5`                                                                                                             |    ✅     | `expression/variables.sql` (`SET @myvar = 2.5`)                                  |
| Exponent literal `1e20`, `2.5E-3`                                                                                                       |    ✅     | `expression/exponent_literal_types.sql`                                          |
| Hexadecimal `X'hex'` and `0xhex`                                                                                                        |    ✅     | `select/syntax.sql` |
| Bit value `b'01'` and `0b01`                                                                                                            |    ❌     |                                                                                  |
| `TRUE` and `FALSE` literals                                                                                                             |    ✅     | `expression/operators.sql`                                                       |
| `NULL` literal                                                                                                                          |    ✅     | `select/null_handling.sql`                                                       |
| Date literal `DATE 'str'`, `{d 'str'}` (ODBC)                                                                                           |    ❌     | `DATE` used only as a function argument in tests. Typed literal not tested.      |
| Time literal `TIME 'str'`, `{t 'str'}`                                                                                                  |    ❌     |                                                                                  |
| Timestamp literal `TIMESTAMP 'str'`, `{ts 'str'}`                                                                                       |    ❌     |                                                                                  |
| Date and datetime string forms (`'YYYY-MM-DD'`, `'YYYY-MM-DD hh:mm:ss'`, `'YYYY-MM-DDThh:mm:ss'`, fractional seconds, time zone offset) |    ✅     | `expression/date.sql`, `expression/datetime.sql` (strings used as input).        |
| Number forms of dates and times (`YYYYMMDD`, `YYMMDDhhmmss`, `hhmmss`)                                                                  |    ❌     |                                                                                  |
| Time string forms (`'D hh:mm:ss'`, `'hh:mm'`, `'hhmmss'`, fractional)                                                                   |    ❌     |                                                                                  |
| Interval literal `INTERVAL expr unit` (single unit)                                                                                     |    ✅     | `expression/interval.sql` (`DAY` is used).                                       |
| Interval compound units (`'D H:M:S' DAY_SECOND`, `'Y-M' YEAR_MONTH`, and others)                                                        |    ❌     |                                                                                  |

### Identifiers and qualifiers

| Feature                                                     | Supported | Notes                         |
| :---------------------------------------------------------- | :-------: | ----------------------------- |
| Unquoted identifier                                         |    ✅     | Used throughout `test/`.      |
| Backtick-quoted identifier `` `name` ``                     |    ✅     | `select/alias.sql`            |
| Doubled backtick inside an identifier `` `a``b` ``          |    ❌     |                               |
| Double-quoted identifier under `ANSI_QUOTES`                |    ❌     |                               |
| `db.table` qualifier                                        |    ✅     | `select/select.sql`           |
| `table.column` qualifier                                    |    ✅     | `join/join.sql`               |
| `db.table.column` qualifier                                 |    ❌     |                               |
| Whitespace around the qualifier dot                         |    ❌     |                               |
| Identifier starting with `$`                                |    ❌     |                               |
| Alias up to 256 characters, identifiers up to 64 characters |    ❌     | Length limits are not tested. |

### Variables

| Feature                                                 | Supported | Notes                                             |
| :------------------------------------------------------ | :-------: | ------------------------------------------------- |
| User variable `@name`                                   |    ✅     | `expression/variables.sql`                        |
| User variable `` @`name` ``, `@'name'`, `@"name"`       |    ❌     |                                                   |
| `@name := expr` assignment inside an expression         |    ✅     | `select/syntax.sql` |
| System variable read `@@name`                           |    ✅     | `expression/variables.sql` (`SELECT @@time_zone`) |
| System variable `@@SESSION.name`                        |    ✅     | `expression/variables.sql`                        |
| System variable `@@GLOBAL.name`, `@@LOCAL.name`         |    ❌     |                                                   |
| System variable `@@PERSIST.name`, `@@PERSIST_ONLY.name` |    ❌     |                                                   |
| Query placeholder `?`                                   |    ❌     |                                                   |

### Comments and optimizer hints

| Feature                                                                                                           | Supported | Notes                                                                                                       |
| :---------------------------------------------------------------------------------------------------------------- | :-------: | ----------------------------------------------------------------------------------------------------------- |
| `-- comment` (dash-dash with a space)                                                                             |    ❌     | The test runner strips `--` comments before sending SQL (`test/test_sql_helper.ts`). A probe accepted them. |
| `# comment`                                                                                                       |    ❌     | A probe accepted it. Not tested.                                                                            |
| `/* comment */`                                                                                                   |    ✅     | `select/syntax.sql` |
| Executable comment `/*! code */` and `/*!NNNNN code */` (versioned)                                               |    ❌     |                                                                                                             |
| Optimizer hint `/*+ hint */` after `SELECT`, `INSERT`, `REPLACE`, `UPDATE`, `DELETE`, `EXPLAIN SELECT`            |    ❌     |                                                                                                             |
| Hint `MAX_EXECUTION_TIME(n)`, `SET_VAR(...)`, `RESOURCE_GROUP(...)`, `QB_NAME(...)`                               |    ❌     |                                                                                                             |
| Hint `JOIN_ORDER`, `JOIN_PREFIX`, `JOIN_SUFFIX`, `JOIN_FIXED_ORDER`, `SEMIJOIN`, `NO_SEMIJOIN`, `SUBQUERY`        |    ❌     |                                                                                                             |
| Table and index hints `BKA`, `NO_BKA`, `BNL`, `NO_BNL`, `MERGE`, `NO_MERGE`, `INDEX`, `NO_INDEX`, `MRR`, `NO_ICP` |    ❌     |                                                                                                             |

### Statement separators and execution

| Feature                                           | Supported | Notes                                                   |
| :------------------------------------------------ | :-------: | ------------------------------------------------------- |
| Several statements in one query, separated by `;` |    ✅     | `client_opts/multiple_statements.sql`                   |
| `DELIMITER` command, `\g`, `\G`, `source`, `\.`   |    ❌     | `mysql` client commands, not server syntax. Not tested. |

## Expression syntax

Operator semantics and function behavior are in `FUNCTIONS.md`. The rows below cover the grammar.

### Operators, by family

| Feature                                                 | Supported | Notes                                                            |
| :------------------------------------------------------ | :-------: | ---------------------------------------------------------------- |
| Arithmetic `+`, `-`, `*`, `/`                           |    ✅     | `select/operators.sql`                                           |
| Unary `+expr`, `-expr`                                  |    ✅     | `expression/unary_expression.sql`                                |
| Integer division `DIV`                                  |    ✅     | `expression/operator_control_flow.sql`                           |
| Modulo `MOD` and `%`                                    |    ✅     | `MOD` and `%` are tested in `select/syntax.sql`. |
| Bitwise `&`, `\|`, `^`, `~`, `<<`, `>>`                 |    ❌     | See `FUNCTIONS.md`.                                              |
| Logical `AND`, `OR`, `XOR`, `NOT`                       |    ✅     | `select/where.sql`                                               |
| Symbolic `&&`, `\|\|`, `!`                              |    ❌     | `!` is tested. `&&` and `\|\|` are listed in `FUNCTIONS.md`.     |
| Comparison `=`, `<>`, `!=`, `<`, `<=`, `>`, `>=`, `<=>` |    ✅     | `select/operators.sql`                                           |
| Assignment `:=` (outside `SET`)                         |    ✅     | `select/syntax.sql` |
| `                                                       |           | `as string concatenation under`PIPES_AS_CONCAT`                  | ❌  |     |
| `BINARY expr` prefix (cast to binary string)            |    ❌     |                                                                  |
| JSON path operators `column -> path`, `column ->> path` |    ✅     | `memory/memory_json_arrow.sql`                                   |

### Predicates and special constructs

| Feature                                                                                                            | Supported | Notes                                       |
| :----------------------------------------------------------------------------------------------------------------- | :-------: | ------------------------------------------- |
| `CASE value WHEN ... THEN ... [ELSE ...] END` (simple)                                                             |    ✅     | `expression/case.sql`                       |
| `CASE WHEN condition THEN ... [ELSE ...] END` (searched)                                                           |    ✅     | `expression/case.sql`                       |
| `CAST(expr AS CHAR)`                                                                                               |    ✅     | `select/cast.sql`                           |
| `CAST(expr AS SIGNED [INTEGER])`                                                                                   |    ✅     | `select/cast.sql`                           |
| `CAST(expr AS UNSIGNED [INTEGER])`                                                                                 |    ❌     |                                             |
| `CAST(expr AS DECIMAL[(M[,D])])`                                                                                   |    ✅     | `select/cast.sql`                           |
| `CAST(expr AS DOUBLE)`                                                                                             |    ✅     | `expression/function_least.sql`             |
| `CAST(expr AS FLOAT[(p)])`, `CAST(expr AS REAL)`                                                                   |    ❌     |                                             |
| `CAST(expr AS DATE)`, `CAST(expr AS DATETIME[(M)])`                                                                |    ✅     | `expression/date.sql`                       |
| `CAST(expr AS TIME[(M)])`                                                                                          |    ✅     | `expression/cast_edge_cases.sql`            |
| `CAST(expr AS YEAR)`                                                                                               |    ❌     |                                             |
| `CAST(expr AS BINARY[(N)])`, `CAST(expr AS NCHAR[(N)])`, `CAST(expr AS CHAR[(N)] [CHARACTER SET cs] [COLLATE co])` |    ❌     | `CAST AS CHAR` is tested. The rest are not. |
| `CAST(expr AS JSON)`                                                                                               |    ✅     | `expression/function_json_storage_size.sql` |
| `CAST(expr AS type ARRAY)` (multi-valued index)                                                                    |    ❌     |                                             |
| `CAST(timestamp AT TIME ZONE tz AS DATETIME[(p)])`                                                                 |    ❌     |                                             |
| `CONVERT(expr, type)` and `CONVERT(expr USING charset)`                                                            |    ❌     |                                             |
| `COLLATE collation_name` after an expression                                                                       |    ✅     | `select/collation_raw.sql`                  |
| Character set introducer before a string                                                                           |    ❌     |                                             |
| `INTERVAL expr unit` (single unit, and `expr unit + date`)                                                         |    ✅     | `expression/interval.sql`                   |
| `value MEMBER OF (json_array)`                                                                                     |    ✅     | `expression/function_json_member_of.sql`    |
| `MATCH (cols) AGAINST (expr [IN NATURAL LANGUAGE MODE \| IN BOOLEAN MODE] [WITH QUERY EXPANSION])`                 |    ❌     |                                             |
| Row constructor `(a, b)` and `ROW(a, b)`                                                                           |    ❌     |                                             |
| Row comparison `(a, b) op (c, d)`                                                                                  |    ❌     |                                             |
| `(expr)` parenthesized expression                                                                                  |    ✅     | Used throughout `test/`.                    |
| Escape in `LIKE`, `LIKE ... ESCAPE 'c'`                                                                            |    ❌     |                                             |
| `IS [NOT] UNKNOWN`                                                                                                 |    ❌     |                                             |
| `SOUNDS LIKE`, `[NOT] REGEXP`, `[NOT] RLIKE`                                                                       |    ❌     | See `FUNCTIONS.md`.                         |
| ODBC escape `{identifier expr}`                                                                                    |    ❌     |                                             |
| Placeholders `?` in expressions                                                                                    |    ❌     |                                             |
| `EXISTS (subquery)` as an expression                                                                               |    ❌     | See Subqueries under SELECT.                |

### JSON path syntax

| Feature                                       | Supported | Notes                                  |
| :-------------------------------------------- | :-------: | -------------------------------------- |
| Path scope `$`                                |    ✅     | `expression/function_json_extract.sql` |
| Object member `.key`                          |    ✅     | `expression/function_json_extract.sql` |
| Quoted object member `."key name"`            |    ✅     | `select/syntax.sql` |
| Array element `[N]`                           |    ✅     | `expression/function_json_extract.sql` |
| Last element `[last]`, relative `[last-N]`    |    ❌     | `[last]` matches MySQL: `select/syntax.sql`. `[last-N]` is not tested. |
| Array range `[M to N]`, `[M to last-N]`       |    ❌     |                                        |
| Wildcard `.*`, `[*]`                          |    ❌     |                                        |
| Any depth `**`, `$**.key`, `[prefix]**suffix` |    ❌     |                                        |

## Other MySQL 8.4 statements

These statements are not implemented. The engine has no handler for them (see the statement switch in `src/query.ts`).

| Feature                                                                | Supported | Notes                       |
| :--------------------------------------------------------------------- | :-------: | --------------------------- |
| `HANDLER tbl OPEN`, `HANDLER tbl READ ...`, `HANDLER tbl CLOSE`        |    ❌     |                             |
| `DO expr`                                                              |    ❌     |                             |
| `LOAD DATA`, `LOAD XML`                                                |    ❌     | See Data loading.           |
| `CALL`, `PREPARE`, `EXECUTE`, `DEALLOCATE PREPARE`                     |    ❌     | See the sections above.     |
| `INSTALL`, `UNINSTALL`, `CLONE`, `RESTART`, `SHUTDOWN`, `IMPORT TABLE` |    ❌     | See Administration.         |
| `CREATE` and `ALTER` for stored programs and objects                   |    ❌     | See CREATE and ALTER above. |
