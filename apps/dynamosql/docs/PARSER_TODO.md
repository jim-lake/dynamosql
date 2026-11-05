# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

- `JSON_VALUE(json, path RETURNING type)`: `RETURNING` clause is a parse error.
- `JSON_VALUE(json, path DEFAULT x ON EMPTY | ON ERROR ...)`: `ON EMPTY` and `ON ERROR` clauses are parse errors.
- `value MEMBER OF(json)`: the `MEMBER OF` operator is a parse error.
- `JSON_TABLE(json, path COLUMNS (...)) AS alias`: table function in FROM is a parse error (`JSON_TABLE` is read as a table name).
- `JSON_TABLE` column forms `FOR ORDINALITY`, `EXISTS PATH`, `NESTED PATH`, and per-column `DEFAULT ... ON EMPTY | ON ERROR`: not reachable until `JSON_TABLE` parses.
- `SUM/AVG/MIN/MAX(DISTINCT expr)`: `DISTINCT` is a parse error. Only `COUNT` accepts it.
- `JSON_ARRAYAGG` and `JSON_OBJECTAGG`: parsed as generic `function` nodes, not `aggr_func`, so `_hasAgg` in `group.ts` will not detect them as aggregates.
- `JSON_ARRAYAGG(*)`: parses, but MySQL 8.4 rejects it with a syntax error.
