# Parser TODO

Mismatches between node-sql-parser (MySQL grammar) and MySQL 8.4. Each form was checked against MySQL 8.4.11.

## Open

### Column data types

- The `MysqlType` union in node-sql-parser's `types/mysql.d.ts` leaves out `REAL`, `DOUBLE PRECISION`, `DEC`, `BOOL`, `SERIAL`, `NCHAR`, `NVARCHAR`, and `CHARACTER VARYING`, but the parser returns each of them as `dataType`. Typed code cannot match those spellings, so `convertType` reports their result fields as VAR_STRING.
- `CHARACTER(3)` parses as `dataType` `CHARACTER VARYING`. MySQL stores it as `char(3)`.
- `INT1`, `INT2`, `INT3`, and `INT8` all parse as `INT`. MySQL stores them as `tinyint`, `smallint`, `mediumint`, and `bigint`.
- `FLOAT8` parses as `FLOAT`. MySQL stores it as `double`.
- `FIXED(5,2)` is rejected. MySQL accepts it as `decimal(5,2)`.
- `MIDDLEINT` is rejected. MySQL accepts it as `mediumint`.
- `NATIONAL CHAR(3)` and `NATIONAL VARCHAR(5)` are rejected. MySQL accepts them as `char(3)` and `varchar(5)` with `utf8mb3`.
- `LONG` and `LONG VARCHAR` are rejected. MySQL accepts both as `mediumtext`.
