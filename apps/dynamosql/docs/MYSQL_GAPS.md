# MySQL gaps found by CASE tests

These queries were removed from `test/expression/case.sql` because DynamoSQL does not match MySQL 8.4. Each entry names the query and the gap.

## Unsupported syntax

Parser output checked with `npm run query:parse`. The parser accepts the query, so the gap is in the engine.

- `SELECT CASE WHEN 1 THEN 1 ELSE 2 END AS result FROM DUAL;`: the parser returns `from: [{ type: 'dual' }]`. `src/lib/select_handler.ts` accepts only base tables in `FROM`, so it throws `Invalid from clause`.
