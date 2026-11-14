# MySQL gaps

Scenarios where DynamoSQL does not match MySQL 8.4. Each entry gives the query, the MySQL result, and the DynamoSQL result.

Matching MySQL is not a goal for illegal statements. Parse errors (`ER_PARSE_ERROR`) and other errors for invalid statements, such as `ER_CANT_REOPEN_TABLE`, are not hard requirements. Entries about those errors are kept only as reference and are not targets to fix. Valid MySQL syntax that DynamoSQL rejects, and valid queries that return different results, are gaps. Only features marked as supported in `../../SQL_GRAMMAR.md` or `../../FUNCTIONS.md` are listed here.

## Column resolution

- `SELECT extra FROM t JOIN (SELECT id, extra FROM u) s ON s.id = t.id;`, where `extra` exists only in the derived table: MySQL returns the values of `s.extra`. DynamoSQL returns `ER_BAD_FIELD_ERROR`. An unqualified column resolves through the first FROM item (`firstFrom` in `_resolveObject`), and derived tables are not searched.
- `SELECT s.ID FROM (SELECT id FROM t) s;` with a mismatched alias case, such as `S.NAME` for alias `s`: MySQL returns `ER_BAD_FIELD_ERROR`. DynamoSQL returns `ER_NO_SUCH_TABLE`, because table and alias lookup both fail with the table error. This is an error case for an invalid statement, so it is kept as reference only.

## Named locks

- `SELECT IS_USED_LOCK('x');` while another session holds `x`: MySQL returns that session's connection id. DynamoSQL returns the holder's session thread id, which can differ from the MySQL connection id.
