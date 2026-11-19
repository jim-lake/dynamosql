# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- `SHOW GRANTS FOR CURRENT_USER()`: node-sql-parser rejects `CURRENT_USER()` after `FOR` (`Expected [A-Za-z0-9_$...] but "(" found`).
- `POSITION(substr IN str)`: node-sql-parser parses the whole `'a' IN 'abc'` as one `binary_expr` argument instead of two arguments, so DynamoSQL raises `ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT`.
