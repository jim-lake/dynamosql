# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- `UPDATE db.t JOIN ... SET db.t.col = ...` (database-qualified column in SET) fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
- `STD(x)` and `VARIANCE(x)` fail with ER_PARSE_ERROR: the grammar treats both names as reserved words. MySQL 8.4 accepts them as aggregates. Verified on MySQL 8.4.11.
- `STDDEV`, `STDDEV_POP`, `STDDEV_SAMP`, `VAR_POP`, `VAR_SAMP`, `BIT_AND`, `BIT_OR`, and `BIT_XOR` parse as generic `function` nodes instead of `aggr_func`. MySQL 8.4 treats them as aggregates. DynamoSQL maps these nodes to the aggregate code (`isAggregateNode` in `src/lib/expression/aggregate_functions.ts`), so results match, but the parse tree is wrong. Verified on MySQL 8.4.11.
