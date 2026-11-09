# Temporary table design differences

## Self-join of a temporary table

MySQL rejects a query that references the same `TEMPORARY` table more than once, with `ER_CANT_REOPEN_TABLE` (1137). The memory engine allows it. For example, `SELECT a.id FROM t AS a JOIN t AS b ON b.id = a.id` on a temporary table `t` returns rows.

This is a design choice. Matching MySQL's error codes for illegal statements is not a goal, so the memory engine does not reject the self-join. `ENGINE=MEMORY` tables allow self-joins in MySQL, and the memory engine returns the same rows for them.
