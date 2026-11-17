# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- `SET NAMES 'utf8mb4' COLLATE 'utf8mb4_bin'`: rejected with a parse error. MySQL 8.4 accepts it.
