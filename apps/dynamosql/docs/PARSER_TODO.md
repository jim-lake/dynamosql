# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

- `MEMBER OF` cannot be followed by `=` or `IS`, or be the right operand of `=`, without parentheses (`1 MEMBER OF('[1]') = 1`, `1 = 1 MEMBER OF('[1]')`, `1 MEMBER OF('[1]') IS TRUE`). MySQL 8.4 accepts them.
