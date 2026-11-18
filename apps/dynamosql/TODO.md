# TODO: MySQL client compatibility gaps

Ordered by ease of implementation, easiest first. Status is taken from `SQL_GRAMMAR.md`, `FUNCTIONS.md`, `RAW_ENGINE.md`, `MEMORY_ENGINE.md`, and the source. Nothing here was run against a live engine.

A statement is a gap only when all four docs support it. Items marked "Unimplemented" are ❌ in the docs, so they are out of scope under `AGENTS.md` until the docs mark them supported.

1. **`SELECT DISTINCT`**: Unimplemented, and silently wrong (duplicate rows are returned). Needs a set of rows already seen, which the streaming design allows only when a clause requires it. Decide whether `DISTINCT` counts as one of those clauses before implementing it.
2. **`COUNT(DISTINCT ...)`**: Unimplemented. Shares the design decision in item 3.
3. **`UNION` and `UNION` inside a derived table**: Unimplemented, and silently wrong (only the first query's rows are returned). Needs a multi-query pipeline. Blocks the privilege probes.
4. **`SELECT COUNT(*) FROM (SELECT DISTINCT SUBSTRING_INDEX(...) ...)`**: Blocked by item 3.
5. **`SELECT 1 FROM mysql.user`**: Out of scope. Requires a `mysql` system schema, which DynamoSQL does not have.
