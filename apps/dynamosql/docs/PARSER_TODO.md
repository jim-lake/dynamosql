# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- Decimal literals with no leading digit (`SELECT .5`, `SELECT .5E0`) fail to parse. MySQL 8.4 accepts them.

## Resolved

- `MEMBER OF` followed by `=` or `IS`, or used as the right operand of `=` (`1 MEMBER OF('[1]') = 1`, `1 = 1 MEMBER OF('[1]')`, `1 MEMBER OF('[1]') IS TRUE`). Tests: `test/types/mysql/member-of.sql`, `json-table-and-aggregates.spec.ts`.
- `NATURAL JOIN`, `NATURAL LEFT JOIN`, `NATURAL RIGHT JOIN`, and `NATURAL INNER JOIN` (parsed as `NATURAL JOIN`). `ON`, `USING`, and `NATURAL CROSS JOIN` are rejected, as MySQL 8.4 rejects them. Tests: `test/types/mysql/natural-join.sql`, `natural-join.spec.ts`.
