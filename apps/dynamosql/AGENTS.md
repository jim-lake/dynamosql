# @dynamosql/dynamosql

Core query engine for DynamoSQL. It parses MySQL-compatible SQL and executes it against DynamoDB. The package sits in the `apps/dynamosql` workspace of the monorepo. See the root `AGENTS.md` for monorepo-wide setup.

## Layout

```
apps/dynamosql/
├── src/
│   ├── index.ts              # Public entry point (exports createConnection, createPool, escape, etc.)
│   ├── session.ts, pool.ts   # Connection/session handling
│   ├── types.ts, error.ts    # Public types and SQLError
│   ├── constants/            # MySQL constants and system variables
│   ├── lib/
│   │   ├── alter_handler.ts, create_handler.ts, delete_handler.ts, drop_handler.ts
│   │   ├── dynamodb/         # DynamoDB client wrapper
│   │   ├── engine/           # Storage engines: raw (DynamoDB), memory, information_schema
│   │   ├── expression/       # Expression evaluation and SQL functions
│   │   └── helpers/          # Shared helpers (ast_helper, sql_conversion, charset, collation, ...)
├── test/                     # Mocha tests (see Testing)
├── examples/query.js         # Example usage
├── dist/                     # Rollup build output (generated, do not edit)
├── eslint.config.mjs         # ESLint config (flat config)
├── rollup.config.mjs         # Build config
├── tsconfig.json
└── .env / .env.example      # AWS and MySQL test settings (never commit real values)
```

Module-level notes:

- `main` in `package.json` points to `dist/dynamosql.js`. Run `npm run build` before consuming the package from outside the workspace.
- Source is TypeScript. Test helpers in `test/` are mixed: `test_client.ts`, `test_session.ts`, `test_sql_helper.ts`, `unit_helper.ts`, plus JS files such as `dynamo.js`, `proxy.js`.
- `scripts/run-tests.sh` is the wrapper behind every `npm run test*` script. It writes the full output to `/tmp` and prints the log path plus `SUCCESS <passing>, SKIP: <n>` or `FAIL <failing>/<total>, SKIP: <n>`.

## Commands

Run these from `apps/dynamosql/`:

| Task                                       | Command                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| Create DynamoDB/MySQL tables               | `npm run test:setup`                                                    |
| Full test run                              | `npm test`                                                              |
| Single test file                           | `npm run test:single -- test/select/<file>.test.js`                     |
| Include slow tests                         | `npm run test:slow` or `npm run test:single:slow -- <file>`             |
| Type check                                 | `npm run ts:check`                                                      |
| Lint                                       | `npm run lint` (runs `eslint src test examples --fix`)                  |
| Format                                     | `npm run pretty`                                                        |
| Build                                      | `npm run build`                                                         |
| Export check                               | `npm run test:export:check`                                             |
| Manual query (MySQL / Dynamo / parse tree) | `npm run query:mysql` / `npm run query:session` / `npm run query:parse` |

After any code change, run `npm run ts:check && npm run lint`, then `npm test`. Run `npm run test:setup` first if table definitions changed.

`npm run lint` must always be run before you finish a task. It runs `eslint --fix`, so it may reformat files you did not edit. Never revert those files with git or by hand. Leave every change lint makes, even in files outside your task.

## Testing Rules

- Test runs always write the complete output to a `/tmp` log file. The terminal shows only the log path and `SUCCESS`/`FAIL`. Use `grep` or `sed` on the log file to find details. Do not pipe the test command itself through a filter.
- Tests run each query against MySQL and DynamoDB and compare the results. A MySQL server must be running and configured in the .env.
- JSON results are compared by parsing both sides with `JSON.parse` and comparing the parsed values with deep equality. Never compare the raw JSON text from MySQL with DynamoSQL output. MySQL point releases can change JSON text formatting (spacing, key order, number rendering), and tests that depend on that text would break without any real behavior change.
- We are EXPLICITLY NOT trying to match MySQL behavior for JSON key ordering or JSON stringification. MySQL states these are NOT STABLE across versions. Do NOT investigate the exact parameters of key sorting or stringification, EVER.
- Tests need AWS credentials with DynamoDB access, read from the environment or `.env`.
- When asked to write tests, read the implementation first. Cover the full behavior of implemented functionality, and skip anything not implemented. Tests must fail when the implemented behavior differs from MySQL. Pass and fail results are both acceptable; coverage is the goal.
- When doing generic work implementing SQL Functions, DO NOT TEST SQL parse failure edge cases where MySQL returns ER_PARSE_ERROR. That error is not behavior end users depend on, so skip it in most cases.
- Matching MySQL's behavior for illegal statements is not a goal. Parse errors (ER_PARSE_ERROR) are not a hard requirement, and neither are other errors for invalid statements, such as ER_CANT_REOPEN_TABLE. Treat these as the same kind of case as parse errors: skip them unless there is a specific reason to test them.
- Error messages do not need to match MySQL's text exactly. Error codes should match MySQL exactly for valid statements, except where the difference is a design choice.
- Raw engine design choices are documented in `../../RAW_ENGINE.md`.
- The memory engine should not have design gaps in general.
- Mocha timeout is 15 seconds per test.
- Test directories: `select/`, `insert/`, `update/`, `delete/`, `replace/`, `join/`, `expression/`, `ddl/`, `memory/`, `client_opts/`, `unit_misc/`, `setup/`.
- Each feature directory holds `.sql` query files and `.test.js` or `.test.ts` files that compare results. Follow the pattern of the neighboring tests.
- Run a subset of tests by name with `npm test -- --grep 'pattern'`. Most tests come from `.sql` files: each statement in a `.sql` file becomes a test case titled with the statement text. Do not guess test file names for these. Search by a fragment of the SQL text instead, for example `npm test -- --grep 'JSON_ARRAY'`. Avoid `npm run test:single`. Very few `.test.js` files exist, so only use it when you have confirmed a specific `.test.js` or `.test.ts` file exists.
- For development, use all three manual query commands on the same SQL. Use `npm run query:mysql` for the MySQL result, `npm run query:session` for the DynamoSQL engine result, and `npm run query:parse` for the parse tree that the engine receives. When a query fails, run `npm run query:parse` first. If the tree is correct, the gap is in the engine. If the parser rejects the SQL or returns a wrong tree, the gap is in the parser. Use these to compare the outputs before writing a test.

## Code Conventions

### Types

- Valid column/value types include `longlong`, `double`, `string`, `date`, `datetime`, `time`, `number`, `buffer`, and others defined in `src/types.ts`.
- `number` maps to MySQL's NEWDECIMAL (0xf6) and is used for decimal literals.
- Never use `newdecimal` as a type name. Use `number`.

### Where functions live

- Comparison operators and `NULLIF`: `src/lib/expression/compare.ts`. Reuse `_convertCompare()` for type coercion. It converts to numbers when either operand is numeric and to strings otherwise.
- String functions: `src/lib/expression/func_string_basic.ts`, `func_string_advanced.ts`, `func_string_encoding.ts`.
- Math functions: `src/lib/expression/func_math_basic.ts`, `func_math_advanced.ts`.
- Date and time functions: `src/lib/expression/func_date_basic.ts`, `func_date_calc.ts`, `func_time.ts`, `interval.ts`.
- Miscellaneous functions: `src/lib/expression/func_misc.ts`.
- Other function groups: `func_comp.ts`. Check its contents before adding to it.
- Function registry: `src/lib/expression/functions.ts`. Register every new function there.

### Reuse existing helpers

- Do not write new conversion helpers. Use `String()` for basic string conversion and `convertString()` from `src/lib/helpers/sql_conversion.ts` for temporal types.
- Temporal types (SQLDate, SQLDateTime, SQLTime) need the existing helpers. Do not handle them ad hoc.
- Use the comparison and conversion logic in `compare.ts` rather than re-implementing it.

### General patterns

- NEVER write one-line functions. A one-line function never reduces code lines, so the ideal code uses as few lines as possible. A one-line function with no logic is a complete waste in all cases.
- Exception: one-line exported functions are allowed when they fulfil an external contract (such as a registry entry with a fixed signature) and only delegate to a shared helper with constant arguments.
- Inline any function that has only one caller. Extract a helper only when at least two call sites exist now or the function is recursive. Do not design shared code for possible future use. Extract it when a change adds a second caller.
- After the code is written, verified, and finished, re-read the changed code for every function invoked in only one place. Decide for each one whether it should be inlined. A single-caller helper that adds no reuse or recursion is wrong and must be inlined before the work is reported as complete.
- Round float arguments used as counts, positions, or lengths with `Math.round()`.
- Import directly from the defining module. Do not add unnecessary re-export chains.
- Match the Prettier style: single quotes, 2-space indent, ES5 trailing commas. Run `npm run pretty` before finishing.
- ESLint enforces Unix line endings.

### Comments

- No file-level comments.
- No function or method comments, except on the true external interface (exports of `src/index.ts` and other public API).
- Do not add comments that restate what the code clearly does.
- If the code is non-obvious, rename variables or functions to make it clear before adding a comment.
- If a comment is still needed, keep it to one concise line.
- Never write comments about the history of the code or tell stories about past changes.

## Dependencies

Production:

- `@aws-sdk/client-dynamodb` (AWS SDK v3 DynamoDB client)
- `node-sql-parser` (SQL parsing)
- `sqlstring` (string escaping)

Development:

- `@dynamosql/lint` (shared lint config), `prettier`
- `mysql` and `@types/mysql` (MySQL client for comparison tests)
- `@types/sqlstring`
- Test tooling (`mocha`, `tsx`, `dotenv`) comes from the workspace root.

## Gap Documents

- `docs/PARSER_TODO.md` holds only parser-grammar mismatches: real MySQL 8.4 syntax that node-sql-parser's MySQL grammar rejects or misparses. Add one concise line per mismatch. Do not put parser issues in `docs/MYSQL_GAPS.md`.
- `docs/MYSQL_GAPS.md` holds behavior gaps: valid queries that DynamoSQL rejects or returns differently from MySQL 8.4, where the parser accepts the SQL and the gap is in the engine. Record the query, the MySQL result, and the DynamoSQL result.

## Notes

- The agent ALWAYS has DynamoDB access. Use the settings in `.env` (including `AWS_REGION`) for all development, testing, and investigation. Do not assume DynamoDB is unavailable, and do not report it as unavailable without checking `.env` first.
- The agent ALWAYS has MySQL access too, using the `DB_*` settings in `.env`. Never complain about a missing environment or say tests cannot be run because of it.
- AWS credentials come from the SDK default chain (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, or `~/.aws/credentials`).
- DynamoDB tables are created in the `_dynamodb` database namespace on the MySQL side.
- Build output in `dist/` is generated. Do not edit it by hand. Do not revert `dist/` changes with git just because you ran `npm run build`; keep the regenerated output so it matches the source.
