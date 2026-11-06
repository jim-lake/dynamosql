# AGENTS.md

Guidance for AI agents editing this package (`node-sql-parser`, version 5.4.0).

## Scope: MySQL only

We work on the MySQL dialect only. Do not change other dialects.

- Grammar: `pegjs/mysql.pegjs`.
- Shared fragments: `mysql.pegjs` pulls in `pegjs/common/**/*.pegjs` with `@import`. Fourteen grammar files reference `common/`, including `mysql.pegjs`, so a change to a fragment can affect other dialects. Check with `grep -l "common/<file>" pegjs/*.pegjs` before editing one. If a fix only matters for MySQL, prefer a MySQL-specific rule in `mysql.pegjs`.
- Types: `types/mysql.d.ts`. Do not edit other `types/*.d.ts` files.
- Do not edit `build/`, `umd/`, `node_modules/`, or `test/types/mysql/types.guard.ts`. The first three are generated, and the guard file is regenerated from `types/mysql.d.ts`.

## Primary workflow

Most changes follow this order:

1. **Update the AST types in `types/mysql.d.ts`.** Describe the shape the parser produces for the statement or expression you are changing. Keep the existing style: `export interface` per node, a `type` literal discriminator where one exists, and doc comments on non-obvious fields.
2. **Add SQL fixtures in `test/types/mysql/<topic>.sql`.** Each statement ends with `;` followed by a newline. The reader splits on `";\n"`, so a statement without that terminator is merged with the next one.
3. **Wire new fixture files into `all-sql-test.spec.ts`.** Every existing `.sql` file has a `readSqlFile('<name>.sql')` test in `test/types/mysql/all-sql-test.spec.ts`. A new `.sql` file runs only after you add that test.
4. **Add property-level assertions when needed.** Use `*.spec.ts` files in `test/types/mysql/`. They import `Parser` from `./parser-loader.mjs`, guards from `./types.guard.ts`, and `assertType` from `./assert-type.ts`. Follow an existing spec, such as `create-user.spec.ts`, for the pattern.
5. **Change the grammar only if the parse is wrong.** Edit `pegjs/mysql.pegjs` (or a shared fragment, per the scope rules above). Then rebuild (see below).

Types-only changes do not need a rebuild, because the parser output does not change. Grammar changes do.

## Commands

Run these from `packages/node-sql-parser/`.

| Task | Command |
| --- | --- |
| Regenerate MySQL guards and run the MySQL type tests | `npm run test:types:mysql` |
| Lint `src/` | `npm run lint` |
| Rebuild all bundles after a grammar change | `npx rollup -c` |
| Full unit suite (mocha, `test/**/*.spec.js`) | `npm run test:only` |
| Lint plus full suite | `npm test` |

Notes on these commands:

- `test:types:mysql` runs `ts-auto-guard` on `types/mysql.d.ts`. It writes the guards to `test/types/mysql/types.guard.ts`, then runs `tsx --test` on `test/types/mysql/*.spec.ts`. Run it after every change to `types/mysql.d.ts`.
- The type tests load `build/mysql.js` through `parser-loader.mjs`. After a grammar change, run `npx rollup -c` before the tests, or they check the old parser.
- `npx rollup -c` builds every dialect. There is no MySQL-only build option in `rollup.config.js`.
- Do not run `npm run build` for MySQL work. It runs `typegen.js`, which generates types from the PostgreSQL grammar.
- To run a single type-test file, use `npx tsx --test test/types/mysql/<file>.spec.ts`. The guard file must already be generated.

## Validation checklist

Before you report a change as done:

1. `npm run test:types:mysql` passes, including `all-sql-test.spec.ts`.
2. If the grammar changed, `npx rollup -c` finished without errors and the type tests ran against the new build.
3. `npm run lint` passes if you touched `src/`.
4. The new fixtures parse. A failing statement appears in the output as `parse failed: <sql>`.

If you cannot run one of these, say so in your report. Do not claim the change is verified.

## Style

- Match the surrounding grammar and type declarations. Do not reformat unrelated code.
- Keep fixture statements realistic MySQL. Use the same forms MySQL 8 accepts.
- Keep type changes minimal. Do not rename or restructure existing AST interfaces unless the task requires it, since downstream code depends on these names.
