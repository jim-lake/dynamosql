# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- `SET NAMES 'utf8mb4' COLLATE 'utf8mb4_bin'`: rejected with a parse error. MySQL 8.4 accepts it.
- `SHOW BINARY LOG STATUS`: rejected with a parse error. MySQL 8.4 accepts it.
- `SHOW REPLICA STATUS`: rejected with a parse error. MySQL 8.4 accepts it.
- `SHOW COLUMNS FROM tbl FROM db`: rejected with a parse error. MySQL 8.4 accepts the second `FROM`.
- `SHOW KEYS FROM tbl`: rejected with a parse error. MySQL 8.4 accepts it.
- `SHOW PROFILES`: rejected with a parse error. MySQL 8.4 accepts it and returns an empty result.
- `SHOW ERRORS`: rejected with a parse error. MySQL 8.4 accepts it and returns an empty result.
