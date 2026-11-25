# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

- `JSON_VALUE(doc, '$.s' RETURNING CHAR(3) CHARACTER SET utf8mb4)`: node-sql-parser rejects `CHARACTER SET` after the `CHAR(n)` returning type with a parse error. MySQL 8.4 accepts it.
- `JSON_VALUE(doc, '$.i' RETURNING SIGNED INTEGER)`: node-sql-parser returns the dataType `SIGNED INTEGER`, not `SIGNED`. The same applies to `UNSIGNED INTEGER`. MySQL 8.4 treats both as the plain SIGNED and UNSIGNED types.
- `CAST(expr AS UNSIGNED)`: node-sql-parser rejects it with "FUNCTION UNSIGNED does not exist". MySQL 8.4 accepts it.
