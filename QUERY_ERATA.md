# Query errata

Query results that DynamoSQL does not match with MySQL 8.4, where DynamoSQL is correct or where no single answer exists. These entries are not gaps and are not targets to fix. Gaps are listed in `apps/dynamosql/docs/MYSQL_GAPS.md`.

## Non-deterministic column choice

MySQL picks a value from one row of each group for a non-aggregated column. The choice is not defined by SQL, and it is not consistent across queries, plans, or versions. DynamoSQL picks a different row. A query that depends on that choice produces different non-determinism on each engine, so it cannot be expected to match.

- `SELECT comment, other, SUM(other) AS t FROM _dynamodb.foo WHERE id LIKE 'win%' GROUP BY comment;` on rows win1 (test, 100), win2 (test, 200), win3 (test, 300), win4 (other, 150): MySQL returns `other = 100` for `test`. DynamoSQL returns `other = 200`.
- `SELECT comment, SUM(other) OVER () AS s, other FROM _dynamodb.foo WHERE id LIKE 'win%' GROUP BY comment;` on the same rows: MySQL returns `s = 250`. DynamoSQL returns `s = 350`, because the window sums the representative `other` values that DynamoSQL chose.

`ANY_VALUE()` has the same property. It returns an arbitrary value from the group, and the caller cannot control which one. `ANY_VALUE()` is not supported yet (see `FUNCTIONS.md`). Tests must not pin the value it returns.

## AVG precision

`AVG()` returns a NEWDECIMAL on both engines. The column type matches MySQL. The value differs in precision:

- `SELECT AVG(v) AS a FROM w;` on values 10, 20, 5 and a NULL: MySQL returns `11.6666666667`. DynamoSQL returns `11.666666666666666`, the full double.

DynamoSQL keeps the double from the calculation and never converts it to a string and back. The extra digits are intentional. The same applies to `AVG(v) OVER ()`.
