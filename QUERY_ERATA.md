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

## Last bit of DOUBLE results

The last bit of a DOUBLE result is not reliable across environments. The same expression can differ by one unit in the last place depending on the exact MySQL version, the Node.js version, and the CPU. Both engines compute the value with a libm or V8 routine, and those routines do not always agree in the final bit.

- `SELECT SIN(-2.5) AS r;`: MySQL returns `-0.5984721441039565`. DynamoSQL returns `-0.5984721441039564` in the same environment.
- `SELECT RADIANS(-3) AS r;`: MySQL returns `-0.05235987755982989`. DynamoSQL returns `-0.05235987755982988`.

## Lock function placement

`GET_LOCK()`, `RELEASE_LOCK()`, `IS_FREE_LOCK()`, `IS_USED_LOCK()`, and `RELEASE_ALL_LOCKS()` are supported only in the select list of a SELECT. MySQL accepts them in WHERE, HAVING, and other clauses. DynamoSQL raises `ER_FEATURE_UNSUPPORTED` when it evaluates a lock call in those positions.

- `SELECT a FROM t WHERE GET_LOCK('x', 0) = 1;`: MySQL runs the query. DynamoSQL returns `ER_FEATURE_UNSUPPORTED`.
- `SELECT id FROM t ORDER BY GET_LOCK('x', 0), id;`: MySQL runs the query. DynamoSQL returns `ER_FEATURE_UNSUPPORTED` once the sort compares rows.

## Case mapping and multi-character expansions

`UPPER()` and `LOWER()` are a known design limitation and will not be fixed.

MySQL maps case one character to one character. JavaScript's `toUpperCase()` and `toLowerCase()` use full Unicode mappings, which can expand one character into several.

- `SELECT UPPER("ß") AS u, LOWER("İ") AS w;`: MySQL returns `'ß'` and `'i'`. DynamoSQL returns `'SS'` and `'i̇'` (two code points).

The entries below are not yet decided. They are listed here so tests do not pin DynamoSQL output as correct until the decision is made. A decision goes in `docs/MYSQL_GAPS.md` only if the behavior is supported and the team decides to fix it.

### Collation-based comparison with multi-character weights (undecided)

Under `utf8mb4_0900_ai_ci`, MySQL gives `ß` the same weight as `ss`. DynamoSQL compares one code point at a time, so it does not expand `ß`, and it compares strings with `localeCompare` in `stringCompare`, which has different results.

- `SELECT POSITION('ss' IN 'ß' COLLATE utf8mb4_0900_ai_ci) AS r;` (also `LOCATE('ss', 'ß' COLLATE ...)` and `INSTR('ß' COLLATE ..., 'ss')`): MySQL returns `1`. DynamoSQL returns `0`.
- `SELECT 'ß' COLLATE utf8mb4_0900_ai_ci = 'ss' AS r;`: MySQL and DynamoSQL both return `1`. This is listed because the `=` operator agrees, unlike the search functions above.
- `SELECT STRCMP('ß' COLLATE utf8mb4_0900_ai_ci, 'ss') AS r;`: MySQL returns `0`. DynamoSQL returns `1`.
- `SELECT FIELD('ß' COLLATE utf8mb4_0900_ai_ci, 'ss') AS r;`: MySQL returns `1`. DynamoSQL returns `0`.
- `SELECT FIELD('ss', 'ß' COLLATE utf8mb4_0900_ai_ci) AS r;`: MySQL and DynamoSQL both return `0`.

### Accent folding in comparison (agrees with MySQL)

These results match. They are listed so the same check is not repeated.

- `SELECT 'é' COLLATE utf8mb4_0900_ai_ci = 'e' AS r;`: both return `1`.
- `SELECT 'ﬁ' COLLATE utf8mb4_0900_ai_ci = 'fi' AS r;`: both return `1`.
- `SELECT POSITION('é' IN 'E' COLLATE utf8mb4_0900_ai_ci) AS r;`: both return `0`.

### SOUNDEX on non-ASCII letters (undecided)

MySQL keeps the first character when it is not an ASCII letter. DynamoSQL converts it to the ASCII letter.

- `SELECT SOUNDEX('ß') AS r;`: MySQL returns `'ß000'`. DynamoSQL returns `'S000'`.
- `SELECT SOUNDEX('ǅ') AS r;`: MySQL returns `'ǅ000'`. DynamoSQL returns `'Ǆ000'`.

Whether `SOUNDEX` is a supported function must be checked in `FUNCTIONS.md` before any gap is recorded.

Tests must not pin the DynamoSQL output for these characters as correct.

## JSON integers outside the safe range (won't fix)

DynamoSQL holds JSON numbers as JavaScript doubles. Integers beyond ±2^53 − 1 (`Number.MAX_SAFE_INTEGER`) lose precision when JSON text is parsed. MySQL keeps them exactly. Tests must not use these values in JSON.

- `INSERT INTO t (doc) VALUES ('9007199254740993'); SELECT CAST(doc AS CHAR) FROM t;`: MySQL returns `'9007199254740993'`. DynamoSQL returns `'9007199254740992'`.
- `SELECT JSON_VALUE('{"x":18446744073709551615}', '$.x' RETURNING UNSIGNED) AS v;`: MySQL returns `18446744073709551615`. DynamoSQL returns `NULL`.

## PI() display precision

MySQL shows `PI()` with 6 decimal places in the text protocol, because the result field has `decimals` 6. The value is still the full double. Other DOUBLE results print full precision. DynamoSQL treats `PI()` as a plain DOUBLE and returns the full value, so it does not reproduce the 6-place display.

- `SELECT PI();`: MySQL returns `3.141593`. DynamoSQL returns `3.141592653589793`.
