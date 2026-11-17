# @dynamodb/mvcc-types

TypeScript types for the DynamoSQL MVCC storage spec. The source of truth is
`apps/dynamosql/docs/MVCC_STORAGE_SPEC.md`. Types only: the build emits an empty
runtime bundle and a declaration file.

## Layout

```
packages/mvcc-types/
├── src/
│   ├── index.ts      # Public entry; re-exports every module
│   ├── raw.ts        # Raw DynamoDB attribute shapes (N is a string, B is Uint8Array)
│   ├── table.ts      # Physical row and index-entry items
│   ├── state.ts      # Control-table items (state, transaction, spill, counter, schema, lease)
│   ├── changes.ts    # Decoded transaction and spill payload JSON
│   ├── schema.ts     # Decoded schema catalog JSON
│   ├── values.ts     # JSON value forms (Base64Value, ColumnValue, PrimaryKey)
│   └── sdk_compat.ts # Compile-time check against @aws-sdk/client-dynamodb (not exported)
├── rollup.config.mjs
├── eslint.config.mjs
└── tsconfig.json
```

## Rules

- Use the spec's attribute names exactly. `DELETED` and `invalidated` have no `?`.
  The `?` in the spec's table headings is markdown, not part of the name.
- Items are raw DynamoDB shapes because the codebase does not use the document
  client. Do not model them as decoded JSON. Payload JSON (`payload_zstd`) uses
  `{"base64": ...}` wrappers for B values.
- `@aws-sdk/client-dynamodb` is a devDependency only. Do not import it from
  `src/` except through `sdk_compat.ts`, which must stay unexported. Rollup has no
  externals, so any runtime import of the SDK would bundle it.
- No `any` or `unknown`. Keep types tight, and do not use index signatures wider
  than the attribute shapes they can hold.

## Commands

Run from `packages/mvcc-types/`:

| Task       | Command            |
| ---------- | ------------------ |
| Type check | `npm run ts:check` |
| Build      | `npm run build`    |
| Lint       | `npm run lint`     |

`npm run pretty` rewrites files on disk. Run it only when the user asks.
