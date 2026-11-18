# @dynamosql/mvcc-index-encode

Ordered byte encoding for DynamoSQL MVCC primary-key and index values. The
encoded bytes are stored in an external system whose only comparator is
bytewise, under a small key size limit. The requirement is order equivalence
with MySQL, not byte equivalence: for any two values, comparing our bytes must
give the same result (less, equal, greater) as comparing MySQL's
`WEIGHT_STRING` bytes. Size matters as much as correctness. The rules below
and the oracle fixtures are the source of truth for this package.

## Status

Only `weightString` and `weightFramed` are implemented. Other value encodings
(integers, DECIMAL, FLOAT/DOUBLE, temporal types) and the key/index builders are
not written yet. `STRING_ENCODING.md` is the only description of the string
key and framing formats; do not restate them here.

## Layout

```
packages/mvcc-index-encode/
├── STRING_ENCODING.md        # Key format for every supported collation
├── src/
│   ├── index.ts              # Public entry; re-exports the modules below
│   ├── weight_string.ts      # weightString: order-preserving sort key for a SQL value
│   ├── collations.ts         # Supported collation list; per-character, multi-level, and byte kinds
│   ├── generated/
│   │   ├── collation_weights.ts  # GENERATED from MySQL. Do not edit.
│   │   └── uca_0900_as_cs.ts     # GENERATED from MySQL. Do not edit.
│   ├── uca.ts                # UCA table lookup: level 1 for ai_ci, levels 1-3 for as_ci/as_cs
│   ├── tuple.ts              # encodeVariable helper
│   └── bytes.ts              # hex and byte helpers
├── test/
│   ├── order.ts              # compareBytes and expectSameOrder helpers
│   ├── weight_string.test.ts # ASCII, ai_ci, and bin order against the oracle
│   ├── as_cs.test.ts         # as_cs and as_ci order
│   ├── uca.test.ts           # UCA table lookups and implicit Han weights
│   ├── utf8_decode.test.ts
│   ├── weight_framed.test.ts
│   ├── framed_concat.test.ts
│   ├── tuple.test.ts
│   └── fixtures/oracle.json  # GENERATED from MySQL. Do not edit.
├── scripts/
│   ├── dump-oracle.mjs       # Regenerates the generated files above
│   └── rollup-plugin-inc-version.mjs
├── rollup.config.mjs
├── eslint.config.mjs
└── tsconfig.json
```

## Rules

- Collations: only `ascii_bin`, `ascii_general_ci`, `utf8mb4_0900_bin`,
  `utf8mb4_0900_ai_ci`, `utf8mb4_0900_as_ci`, and `utf8mb4_0900_as_cs`. Do not
  add others without an oracle check.
- `utf8mb4_0900_as_cs` and `utf8mb4_0900_as_ci` are multi-level collations
  with 3 and 2 levels, so they cannot use the per-character `writeWeight`
  model. Both are NO PAD and ignore `maxChars`. All three UCA collations share
  the table in `generated/uca_0900_as_cs.ts`. The dump asserts that every
  `ai_ci` weight equals level 1 of `as_cs` and every `as_ci` weight equals
  levels 1 and 2. The table still holds MySQL's exact weights, and the encoder
  derives the compact key from them.
- The `as_cs` and `as_ci` key is: all level 1 weights (2 bytes each), `01`,
  then one section per further level, each ending with an end token. Almost
  every level 2 weight is `0020` and level 3 weight is `0002`, so those
  defaults are not written. Each non-default weight is a token carrying the
  count of defaults before it, and the section ends with an end token carrying
  the trailing default count. Weights below the default sort before it and
  weights above sort after it, so counts are encoded to keep that order. Do not
  reintroduce the MySQL `00 00` level separators. `STRING_ENCODING.md` documents
  the format. Keep it in sync with any change to the encoding.
- `weightString` returns this key for `as_cs` and `as_ci` and MySQL's bytes for
  the other collations. Do not rely on the key matching `WEIGHT_STRING` for
  `as_cs` and `as_ci`. Change the format only if the order tests still pass and
  the key does not get larger for typical text.
- Non-ASCII input throws for the ASCII-only collations. The UCA collations
  throw on invalid UTF-8 and map code points through the shared table. Code
  points absent from the table have an empty weight, except implicit Han.
- `utf8mb4_0900_bin` returns the input bytes as the weight, without a copy, a
  UTF-8 check, or a length check. The caller guarantees valid UTF-8 and the
  character bound, and must not mutate the result.
- `maxChars` is read only for PAD SPACE collations, where it sets the padding.
  It is required there, and a value longer than it throws. NO PAD collations
  ignore it. Never truncate a value to fit a bound.
- Empty PAD SPACE text pads the weight output, not the input. Empty NO PAD text
  has an empty weight.
- Tests compare order, not bytes. Use `expectSameOrder` from `test/order.ts`: it
  sorts the oracle rows by MySQL's bytes and requires every adjacent pair to
  compare the same under our bytes, ties included. Do not assert exact hex for
  `as_cs` or `as_ci` keys. Hand-written cases use `expectAscending` chains.
  Compare PAD SPACE rows only within the same bound.
- The oracle samples are seeded pseudo-random in `scripts/dump-oracle.mjs`:
  ASCII, UTF-8, mixed scripts, and a dense set over a small alphabet (case,
  accents, combining marks in both orders, NUL, Han, emoji) with long runs
  around the 239 to 257 length boundaries. Add a new sample set there when a bug
  shows a shape it misses.
- Regenerate, do not hand-edit, `generated/collation_weights.ts`, `generated/uca_0900_as_cs.ts`, and `oracle.json`. Run
  `node scripts/dump-oracle.mjs` against a local MySQL 8.4 server.
- No comments. Do not add function or type doc comments, comments that restate
  the code, or file header comments, except the one-line "Generated by" header
  that generated files carry to mark them as do-not-edit. Add a single-line
  comment only where the behavior is non-obvious, and keep it to what the reader
  needs to know.

## Benchmarks

Run with `npm run test:bench -- <collation> [scale]`. The bench prints one row per
workload and mode (`weight` and `weight+frame`), plus a total.

- The baseline run must take at least 10 s in total. Raise `scale` until it does.
  At scale 0.22, `utf8mb4_0900_ai_ci` takes about 11 s, but `ascii_bin` takes about
  3 s, so `ascii_bin` needs about scale 0.8. Runs shorter than 10 s are noise, not
  evidence.
- Compare against `HEAD` in a temporary worktree, not against numbers recorded in
  an earlier session. Remove the worktree afterwards. Symlink `node_modules` into it
  from the repo root and the package.
- Run at least 3 times per side. Compare the median ops/s for each row, not only the
  total. A row is a regression only if the current median is lower and the current
  max is below the baseline min.
- Compare every workload, including `weight` and `weight+frame` for each. A faster
  total can hide a slower row.
- Never compare runs at different scales.
- Do not store benchmark results in any doc. Run the baseline and the current code fresh each time, and report the numbers in the conversation only.

## Commands

Run from `packages/mvcc-index-encode/`:

| Task       | Command            |
| ---------- | ------------------ |
| Type check | `npm run ts:check` |
| Test       | `npm test`         |
| Build      | `npm run build`    |
| Lint       | `npm run lint`     |

`npm run build` bumps the patch version in `package.json`. `npm run pretty`
rewrites files on disk. Run it only when the user asks.
