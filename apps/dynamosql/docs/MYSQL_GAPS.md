# MySQL gaps found by CASE tests

These queries were removed from `test/expression/case.sql` because DynamoSQL does not match MySQL 8.4. Each entry names the query and the gap.

## Literal types

- `SELECT CASE WHEN 1 THEN 1 ELSE 2.5E0 END AS result;`: `2.5E0` is typed NEWDECIMAL. MySQL types it DOUBLE. Standalone `SELECT 2.5E0` shows the same mismatch.
- `SELECT CASE WHEN 1 THEN 1.5E0 ELSE 2 END AS result;`: same cause as above.
- `SELECT CASE WHEN 0 THEN 1.5E0 ELSE 2.25 END AS result;`: same cause as above.
- `SELECT CASE WHEN 1 THEN 1.5E0 ELSE 2.25 END AS result;`: same cause as above.
- `SELECT CASE WHEN 1 THEN 12345678901234567890 ELSE 1 END AS result;`: the literal is typed LONGLONG. MySQL treats it as unsigned, so a union with a signed value gives DECIMAL.
- `SELECT CASE WHEN 0 THEN 12345678901234567890 ELSE 1 END AS result;`: same cause as above.

## Arithmetic on NULL

- `SELECT CASE WHEN 0 THEN 10 END + 1 AS result;`: the result is DOUBLE. MySQL gives LONGLONG. The same mismatch appears with `SELECT IF(0, 10, NULL) + 1` and `SELECT CAST(NULL AS SIGNED) + 1`. The arithmetic chooses the type from the NULL value, not from the column type.

## Unsupported syntax

Parser output checked with `npm run query:parse`. The parser accepts both queries, so the gaps are in the engine.

- `SELECT CASE WHEN NULL <=> NULL THEN 'null safe' ELSE 'diff' END AS result;`: the parser returns `binary_expr` with operator `<=>`. The engine has no `<=>` entry in the operator map in `src/lib/expression/binary_expression.ts`, so it fails with `ER_SP_DOES_NOT_EXIST`.
- `SELECT CASE WHEN 1 THEN 1 ELSE 2 END AS result FROM DUAL;`: the parser returns `from: [{ type: 'dual' }]`. `src/lib/select_handler.ts` accepts only base tables in `FROM`, so it throws `Invalid from clause`.
