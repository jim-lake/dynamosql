# TODO: MySQL client compatibility gaps

Ordered by ease of implementation, easiest first. Status is taken from `SQL_GRAMMAR.md`, `FUNCTIONS.md`, `RAW_ENGINE.md`, `MEMORY_ENGINE.md`, and the source. Nothing here was run against a live engine.

A statement is a gap only when all four docs support it. Items marked "Unimplemented" are ❌ in the docs, so they are out of scope under `AGENTS.md` until the docs mark them supported.

1. **`SHOW COLUMNS FROM tbl [FROM db]` and `SHOW FULL COLUMNS`**: Unimplemented. Expected columns are `Field, Type, Null, Key, Default, Extra`. The FULL form adds `Collation, Privileges, Comment`. Confirm that `SHOW  COLUMNS` (double space) parses.
2. **`SHOW INDEXES` / `SHOW INDEX` / `SHOW KEYS`**: Unimplemented. Needs index metadata for the table. Result has 15 columns, starting with `Table, Non_unique, Key_name, Seq_in_index, Column_name`.
3. **`SELECT DISTINCT`**: Unimplemented, and silently wrong (duplicate rows are returned). Needs a set of rows already seen, which the streaming design allows only when a clause requires it. Decide whether `DISTINCT` counts as one of those clauses before implementing it.
4. **`COUNT(DISTINCT ...)`**: Unimplemented. Shares the design decision in item 3.
5. **`UNION` and `UNION` inside a derived table**: Unimplemented, and silently wrong (only the first query's rows are returned). Needs a multi-query pipeline. Blocks the privilege probes.
6. **`SELECT COUNT(*) FROM (SELECT DISTINCT SUBSTRING_INDEX(...) ...)`**: Blocked by item 3.
7. **`SHOW CREATE TABLE`**: Unimplemented. Must render MySQL DDL text, including per-column `CHARACTER SET` and `COLLATE` and the table's `ENGINE`, `DEFAULT CHARSET`, and `COLLATE` options. The DDL renderer is the largest piece of this item.
8. **`information_schema` tables (`SCHEMATA`, `TABLES`, `COLUMNS`, `CATALOGS` are implemented)**: Out of scope. No support doc lists `information_schema`. The README roadmap includes it. Add the docs entry before treating these tables as supported.
9. **Missing `information_schema` tables (`CHARACTER_SETS`, `COLLATIONS`, `VIEWS`, `ROUTINES`, `EVENTS`, and the four privilege tables)**: Out of scope under the same rule as item 8. The privilege tables also depend on items 2 and 8.
10. **`SELECT 1 FROM mysql.user`**: Out of scope. Requires a `mysql` system schema, which DynamoSQL does not have.
