# TODO: MySQL client compatibility gaps

Ordered by ease of implementation, easiest first. Status is taken from `SQL_GRAMMAR.md`, `FUNCTIONS.md`, `RAW_ENGINE.md`, `MEMORY_ENGINE.md`, and the source. Nothing here was run against a live engine.

A statement is a gap only when all four docs support it. Items marked "Unimplemented" are ❌ in the docs, so they are out of scope under `AGENTS.md` until the docs mark them supported.

1. **`COUNT(DISTINCT ...)`**: Unimplemented.
2. **`UNION` and `UNION` inside a derived table**: Unimplemented, and silently wrong (only the first query's rows are returned). Needs a multi-query pipeline. Blocks the privilege probes.
3. **`SELECT COUNT(*) FROM (SELECT DISTINCT SUBSTRING_INDEX(...) ...)`**: Blocked by item 2.
4. **`SELECT 1 FROM mysql.user`**: Out of scope. Requires a `mysql` system schema, which DynamoSQL does not have.
5. **Collation propagation through the expression engine**: Functions such as `LOWER()` drop the collation of their argument, so `DISTINCT LOWER(s)` on an `_ai_ci` column returns `'é'` and `'e'` as separate rows. Fix in `_getExprCollation` (`src/lib/helpers/collation.ts`). `COLLATION()` is also ❌ in `FUNCTIONS.md`.
6. **`_as_ci`, `_as_cs`, and `_bin` column collations**: `CREATE TEMPORARY TABLE` with `COLLATE utf8mb4_0900_as_ci` or `utf8mb4_bin` fails with `ER_UNKNOWN_COLLATION` on DynamoSQL. Blocks `DISTINCT` tests under those collations.
