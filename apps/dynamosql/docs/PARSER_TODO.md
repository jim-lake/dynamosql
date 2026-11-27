# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

- Nested parenthesized union `(SELECT 1 UNION SELECT 2) UNION SELECT 3` fails to parse with "Expected [A-Za-z0-9_$\x80-\u{FFFF}] but ' ' found".
