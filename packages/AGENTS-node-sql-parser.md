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
2. **Add SQL fixtures in `test/types/mysql/<topic>.sql`.** This is the default test form. Each statement ends with `;` followed by a newline. The reader splits on `";\n"`, so a statement without that terminator is merged with the next one.
3. **Wire new fixture files into `all-sql-test.spec.ts`.** Every existing `.sql` file has a `readSqlFile('<name>.sql')` test in `test/types/mysql/all-sql-test.spec.ts`. A new `.sql` file runs only after you add that test. Insert the test in alphabetical order, and use the statement guard that matches the fixture (for example `isSelect` for `select.sql`).
4. **Add property-level assertions only when a fixture cannot check the claim.** Use `*.spec.ts` files in `test/types/mysql/`. They import `Parser` from `./parser-loader.mjs`, guards from `./types.guard.ts`, and `assertType` from `./assert-type.ts`. Follow an existing spec, such as `json-table-and-aggregates.spec.ts`, for the pattern.
5. **Change the grammar only if the parse is wrong.** Edit `pegjs/mysql.pegjs` (or a shared fragment, per the scope rules above). Then rebuild (see below).

Types-only changes do not need a rebuild, because the parser output does not change. Grammar changes do.

## Writing tests

Most tests in this package are SQL statements in `.sql` files. Write a test in a `.spec.ts` file only when one of the following applies:

- **Property checks.** You need to check AST fields, operator nesting, or other values that a statement list cannot express. Example: `json-table-and-aggregates.spec.ts` checks that `MEMBER OF` folds left to right.
- **Sqlify output.** You need to check the string produced by `parser.sqlify`.
- **Rejected SQL.** `readSqlFile` fails on any statement that does not parse, so a `.sql` file cannot hold a form that MySQL rejects. Put those in a spec with `assert.throws`, using the `assertRejected` helper from `json-table-and-aggregates.spec.ts`.

Do not add a spec whose only check is "this statement parses". Do not put one statement in both a `.sql` file and a spec. Pick the `.sql` file.

When you fix a grammar gap, add the statements from the report to a `.sql` file for that topic, one statement per line, and add the rejected forms to a spec. Then run the full checklist below.

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
5. `grep -nE "\b(any|unknown)\b" types/mysql.d.ts` prints nothing.
6. Every new operator, node shape, or field has a test that checks its value, not only that the statement parses or that the guard passes.

If you cannot run one of these, say so in your report. Do not claim the change is verified.

## Types must be tight

`types/mysql.d.ts` describes the exact shape the parser produces. Keep it that way.

- Never use `any` or `unknown`, in any form, including `as any`, `any[]`, `Record<string, any>`, and `[key: string]: any`. If a shape is hard to write, model the actual shape. Do not widen it.
- Do not use `{}`, `object`, or an index signature to stand in for an AST node.
- Use a literal `type` discriminator on every node that has one, for example `type: "binary_expr"`.
- Where the parser emits a closed set of values (operators, keyword flags, `dataType` names), write the set as a literal union. Do not write `string` for a value the parser cannot produce.
- Know the limit of the generated guards. `ts-auto-guard` checks a `string` field only with `typeof === "string"`. A guard that passes proves the shape roughly, not the value. Assert the values in a spec (`assert.strictEqual(expr.operator, "MEMBER OF")`) for every new operator or shape.
- If a grammar change keeps the AST shape the same, the types do not change. Say so in the report, and cover the change with value assertions. Do not claim the types were checked just because `test:types:mysql` passed.
- If a grammar change adds or changes a node, field, or value set, update `types/mysql.d.ts` in the same change, then run `npm run test:types:mysql`.

Known loose spots that predate these rules: `Binary.operator` and `Unary.operator` are `string` in `types/mysql.d.ts`. Tightening them to literal unions changes a public type, so do it as its own task that lists every operator the grammar emits, not as a side effect of a parser fix.

## Style

- Match the surrounding grammar and type declarations. Do not reformat unrelated code.
- Keep fixture statements realistic MySQL. Use the same forms MySQL 8 accepts.
- Keep type changes minimal. Do not rename or restructure existing AST interfaces unless the task requires it, since downstream code depends on these names.
