# TODO: MySQL client compatibility gaps

Ordered by ease of implementation, easiest first. Status is taken from `SQL_GRAMMAR.md`, `FUNCTIONS.md`, `RAW_ENGINE.md`, `MEMORY_ENGINE.md`, and the source. Nothing here was run against a live engine.

A statement is a gap only when all four docs support it. Items marked "Unimplemented" are ❌ in the docs, so they are out of scope under `AGENTS.md` until the docs mark them supported.

1. **Undefined system variable error (`SELECT @@storage_engine`)**: Already returns `ER_UNKNOWN_SYSTEM_VARIABLE` (1193), which matches MySQL. Needs a test only.
2. **`SET collation_connection = '...'`**: `COLLATION_CONNECTION` is defined. Verify the bare `SET` form. The docs cover bare `SET` only for `time_zone`.
3. **System variables `@@version`, `@@version_comment`, `@@lower_case_table_names`, `@@default_storage_engine`, `@@have_profiling`**: Gap. None is defined in `src/constants/system_variables.ts`. Values must match MySQL 8.4. Confirm that the docs cover reads of these names before adding them.
4. **`SUBSTRING_INDEX()`**: Unimplemented (❌ in `FUNCTIONS.md`). Add it to `func_string_basic.ts` and register it in `functions.ts`. Update the docs before it counts as supported.
5. **`SET lc_messages = 'en_US'`**: Gap. MySQL accepts it. The variable is not defined. Low value, but a one-line definition.
6. **`SHOW WARNINGS`**: Unimplemented. The result is always an empty set with columns `Level, Code, Message`, because the engine never emits warnings.
7. **`SHOW MASTER STATUS` and `SHOW REPLICA STATUS` / `SHOW SLAVE STATUS`**: Unimplemented. Both return an empty result set with fixed column lists. `SHOW BINARY LOG STATUS` is the 8.4 name. Each needs its own docs entry.
8. **`SHOW BINARY LOGS` / `SHOW MASTER LOGS`**: Unimplemented. MySQL returns `ER_NO_BINARY_LOGGING` (1381) when binary logging is off. Return the same code.
9. **`SET NAMES 'cs' COLLATE 'co'`**: Parser gap. The parser rejects it with `ER_PARSE_ERROR`, and the docs list it as ❌. Record the parser mismatch in `docs/PARSER_TODO.md`.
10. **`SHOW SESSION VARIABLES LIKE 'x'` and `SHOW VARIABLES`**: Unimplemented. Needs a variable listing and `LIKE` filtering. Result columns are `Variable_name, Value`.
11. **`SHOW TABLES FROM db`**: Unimplemented (❌ for `FROM`). The engine ignores the database name and lists the current database instead, which returns wrong rows without an error (`show_handler.ts`). The minimum fix is to raise `ER_BAD_DB_ERROR` (1049) for a missing database. Listing another database's tables needs more work.
12. **`LIKE` with a column or expression on the right side (`'x' LIKE col`)**: Verify. The docs cover `LIKE` only for a literal pattern.
13. **`SELECT *, expr AS alias, ...` (star mixed with expressions)**: Verify. The docs list `SELECT *` and expressions separately, not mixed.
14. **`ORDER BY ... LIMIT` inside a derived table**: Verify. The docs list derived tables and `ORDER BY` separately.
15. **`USER()`, `CURRENT_USER()`, `SESSION_USER()`, `SYSTEM_USER()`**: Unimplemented. Needs a connection user identity. The expected value for a root connection is `root@%`.
16. **`SHOW GRANTS`**: Unimplemented. Depends on item 15. Result column is `Grants for <user>@<host>`.
17. **`SHOW COLUMNS FROM tbl [FROM db]` and `SHOW FULL COLUMNS`**: Unimplemented. Expected columns are `Field, Type, Null, Key, Default, Extra`. The FULL form adds `Collation, Privileges, Comment`. Confirm that `SHOW  COLUMNS` (double space) parses.
18. **`SHOW INDEXES` / `SHOW INDEX` / `SHOW KEYS`**: Unimplemented. Needs index metadata for the table. Result has 15 columns, starting with `Table, Non_unique, Key_name, Seq_in_index, Column_name`.
19. **`SELECT DISTINCT`**: Unimplemented, and silently wrong (duplicate rows are returned). Needs a set of rows already seen, which the streaming design allows only when a clause requires it. Decide whether `DISTINCT` counts as one of those clauses before implementing it.
20. **`COUNT(DISTINCT ...)`**: Unimplemented. Shares the design decision in item 19.
21. **`UNION` and `UNION` inside a derived table**: Unimplemented, and silently wrong (only the first query's rows are returned). Needs a multi-query pipeline. Blocks the privilege probes.
22. **`SELECT COUNT(*) FROM (SELECT DISTINCT SUBSTRING_INDEX(...) ...)`**: Blocked by items 4 and 19.
23. **`SHOW CREATE TABLE`**: Unimplemented. Must render MySQL DDL text, including per-column `CHARACTER SET` and `COLLATE` and the table's `ENGINE`, `DEFAULT CHARSET`, and `COLLATE` options. The DDL renderer is the largest piece of this item.
24. **`information_schema` tables (`SCHEMATA`, `TABLES`, `COLUMNS`, `CATALOGS` are implemented)**: Out of scope. No support doc lists `information_schema`. The README roadmap includes it. Add the docs entry before treating these tables as supported.
25. **Missing `information_schema` tables (`CHARACTER_SETS`, `COLLATIONS`, `VIEWS`, `ROUTINES`, `EVENTS`, and the four privilege tables)**: Out of scope under the same rule as item 24. The privilege tables also depend on items 15 and 21.
26. **`SELECT 1 FROM mysql.user`**: Out of scope. Requires a `mysql` system schema, which DynamoSQL does not have.
