# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- `UPDATE db.t JOIN ... SET db.t.col = ...` (database-qualified column in SET) fails with ER_PARSE_ERROR. MySQL 8.4 accepts it.
