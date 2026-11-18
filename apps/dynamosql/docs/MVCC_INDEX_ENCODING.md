# MVCC primary-key and index encoding

## Identity

- Resolve index `columns` through schema `column_name` to stable `dynamodb_name`. Apply SQL column coercion and precision rules before key encoding.
- Key equality and ascending byte order follow SQL equality and order, subject to the [PAD SPACE approximation](#character-weights). Types and component counts come from the index definition.
- Primary keys forbid NULL. Secondary keys sort NULL before non-NULL. Only full-column ASC indexes are specified.
- Preserve the PK-suffix rules of [hash_nonunique_index.ts](../src/lib/helpers/hash_nonunique_index.ts) and [hash_nullable_index.ts](../src/lib/helpers/hash_nullable_index.ts); replace their string serialization with the ordered encoding below.
- Persist original column values separately. Encoded keys need not recover original spelling or collation-equivalent values. Never truncate or hash a key to make it fit.

## Primary partition key

The PRIMARY index's `dynamodb_name` selects the data-table partition-key attribute.

| Primary definition         | Attribute                | Value                                        |
| -------------------------- | ------------------------ | -------------------------------------------- |
| One directly usable column | Column's `dynamodb_name` | Its native N, S, or B value                  |
| Other declared PK          | `DB_ROW_KEY`             | Binary tuple of declared PK values, native B |
| No declared PK             | `DB_ROW_ID`              | Generated positive signed BIGINT, native N   |

Each physical generation uses the representation selected by its PRIMARY definition for every row.

Direct use requires native equality to match SQL equality. Choose the representation from the column definition, never per row. Numeric columns whose entire permitted range uses N may use their stored value; fixed nonempty binary columns may use B. Variable binary columns permitting empty values use the binary tuple representation.

Raw string bytes in a primary key or index have the implicit NO PAD collation `utf8mb4_0900_bin` (UTF-8 byte order). A single string PK may use native S only under `utf8mb4_0900_bin`. When native S is used, reject a write whose PK is the empty string after SQL coercion. DynamoDB requires at least one byte in a partition key. A framed string component can represent the empty string. Every other string PK collation uses a binary tuple in `DB_ROW_KEY`. For `ascii_bin`, trim trailing U+0020 when deriving the tuple for writes and lookups. The separate column attribute preserves the SQL value, including user-visible trailing spaces.

A DOUBLE PK permitting both N and B storage uses the binary tuple representation for every key; its partition-key type cannot vary per row. Composite PKs always use binary tuples, including those containing buffers. `DB_ROW_KEY` for a declared PK is its encoding, not an allocated surrogate. The data-table sort key remains numeric `TX_ID`.

The data-table partition key is accessed only by hashed equality, so its encoding is for identity, not range order, and `DB_ROW_KEY` need not be byte-order-preserving. A PRIMARY key MAY, but is not required to, have a separate ordered index table to support range scans and ordering on the primary key. Whether and when to provide one is left to the implementation.

## Secondary sort key

Let I be the tuple of indexed values and P the tuple of primary-key values in PRIMARY column order. For a hidden PK, P contains its generated `DB_ROW_ID`. For a declared composite PK, P contains the declared key columns, the same values `DB_ROW_KEY` encodes. Append the full P, including columns also present in I.

| Index case                 | Entry identity E |
| -------------------------- | ---------------- |
| Unique, no NULL components | I                |
| Unique, any NULL component | I followed by P  |
| Nonunique                  | I followed by P  |

`INDEX_PARTITION = "ALL"`.

`INDEX_TX_ID = E || U64(TX_ID)`.

TX_ID occupies the final eight bytes, after any PK suffix. P uses its component encodings, not a nested encoded partition-key attribute. A unique non-NULL entry's target PK is stored in its item, not its key.

Different rows sharing a nonunique/NULL-containing key remain distinct within one transaction. A unique non-NULL key has one final mapping or tombstone per transaction; coalesce deletion/reassignment of that key. SQL uniqueness includes snapshot visibility and own writes; final head publication validates the snapshot.

## Key length limits

DynamoDB bounds key sizes, and keys are never truncated or hashed to fit, so the limits are enforced at definition time.

| Key                                                               | Limit (bytes) | Measured length                                                       |
| ----------------------------------------------------------------- | ------------- | --------------------------------------------------------------------- |
| Primary partition key (`DB_ROW_KEY` or a direct-use column value) | 2048          | The complete encoded attribute value                                  |
| Secondary sort key (`INDEX_TX_ID`)                                | 1024          | The full `INDEX_TX_ID`: E, including any PK suffix P, plus the TX_ID. |

- A definition is rejected if the maximum encoded length of any key it produces can exceed its limit. The check runs on `CREATE TABLE`, `CREATE INDEX`, and `ALTER TABLE` statements that add or change an index, a primary key, or a column used by one. Rejection is a definition error, not a write-time error.
- The maximum length is computed from the column definitions alone, never from current values. It sums the worst-case size of every component: the 1-byte marker, the fixed value width, and for variable-width components the worst-case escaped payload plus the 2-byte terminator. Escaping counts each `00` byte as two bytes. Character components use the worst-case weight output for the column's bound under its collation, at natural length after key normalization. A permitted value can occupy the full column bound without ending in a space. Binary components use the column's maximum byte length with every byte `00`.
- P counts toward a secondary index's limit exactly when E includes P. A nonunique index is measured as I, P, and TX_ID. A unique index with any nullable column is also measured with P, because an entry with a NULL component includes it. A unique index whose columns are all NOT NULL is measured as I and TX_ID only. An index whose measured length can exceed 1024 bytes is rejected even if I alone would fit.
- A column type with no finite maximum encoded length, such as an unbounded TEXT or BLOB without a declared bound, cannot appear in a key and is rejected.
- Changing a column's length, bound, or collation re-runs the check for every key containing that column.

## Tuple framing

Hex bytes are written without `0x`. `||` concatenates bytes. `U_w(x)` is unsigned big-endian in exactly w bytes; `U64(x)=U_8(x)`.

| Component                     | Bytes |
| ----------------------------- | ----- |
| NULL                          | `00`  |
| Non-NULL fixed-width value    | `01   |     | value_bytes`        |
| Non-NULL variable-width value | `01   |     | escape(value_bytes) |     | 00 00` |

`escape` replaces each `00` with `00 ff`; other bytes are unchanged. A tuple concatenates its components without a header, count, separator, or final terminator. Each variable component has its own terminator. Fixed widths are determined by schema. Empty binary/text values remain distinct from NULL.

## Value bytes

| Type             | Encoding                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| Signed integer   | `U64(x + 2^63)`                                                                         |
| Unsigned integer | `U64(x)`                                                                                |
| BIT              | `U64(x)`                                                                                |
| DECIMAL(p,s)     | Let `n=x*10^s`, `M=10^p-1`; encode `U_w(n+M)`, with smallest w satisfying `256^w > 2*M` |
| FLOAT            | Ordered IEEE binary32, 4 bytes                                                          |
| DOUBLE           | Ordered IEEE binary64, 8 bytes                                                          |
| Binary           | Escaped stored bytes                                                                    |
| BLOB             | Escaped stored bytes                                                                    |
| Character        | Escaped collation weight bytes                                                          |
| TEXT             | Escaped collation weight bytes                                                          |
| DATE             | `U64((year*10000 + month*100 + day)*86400000000)`                                       |
| DATETIME         | DATE integer plus time-of-day microseconds, encoded U64                                 |
| TIMESTAMP        | `U64(epoch_microseconds+1)`; SQL zero timestamp uses `U64(0)`                           |
| TIME             | `U64(duration_microseconds + 2^63)`                                                     |
| YEAR             | `U_2(year)`; SQL zero year uses 0                                                       |

Escape and terminate variable-width payloads exactly once, using tuple framing. Integer/decimal arithmetic is exact. DECIMAL uses the same bias for signed and unsigned declarations; no binary floating-point conversion. Width and scale never depend on the current value. An unsigned DECIMAL only ever occupies the upper half of the biased range, so its bytes are not comparable to a signed DECIMAL of the same `(p,s)`; re-encode per the index column's own type before constructing any byte range, as with the N-versus-B DOUBLE and mixed-numeric cases.

For FLOAT/DOUBLE, apply SQL precision and normalize either zero to positive zero. Interpret IEEE bits as unsigned: complement every bit for negative values; otherwise flip the sign bit. Write the result big-endian. NaN and infinities are invalid. Out-of-N-range DOUBLE row values store these same eight value bytes without the component marker. Index encoding is identical for N-backed and B-backed DOUBLEs; reuse a B-backed value's ordered bytes without transforming them again.

Temporal key encodings use SQL values, not the stored epoch/sentinel representation. Decode non-calendar date sentinels before encoding calendar fields. Preserve microseconds exactly. DATETIME fields are UTC. DATE/DATETIME compare calendar fields, including permitted zero components; TIMESTAMP compares UTC instants; TIME compares signed durations. The calendar integer fits U64 through year 9999.

JSON, spatial, ENUM, SET, prefix, expression, and descending key encodings are unspecified; reject such index definitions until their encodings are specified.

### Character weights

Storage and indexes use only NO PAD encoding. Encode character keys at their natural weight length under the declared collation. For a NO PAD collation, preserve trailing spaces. For a PAD SPACE collation, index builders and writers strip only trailing ordinary spaces (U+0020) from the SQL value before generating weights. Keep tabs, other whitespace, and internal spaces. Apply the same rule to every key component, including PK suffixes, and to every lookup value and range endpoint. Binary SQL types use their stored bytes.

This trimming approximates MySQL PAD SPACE. Under `ascii_bin` and `ascii_general_ci`, if one trimmed value ends at a shared prefix and the other continues with zero or more spaces followed by a control character (`0x00`–`0x1F`), MySQL orders the longer value first. The unpadded index orders the shorter value first. For example, MySQL places `a<TAB>b` below `a`, so an index scan for `col < 'a'` can miss that value. Any characters following that control leave this comparison unchanged. For other PAD SPACE collations, the comparison depends on the collation weights of the suffix and of space.

A multi-level collation returns all primary weights for the string, then `00 00`, all secondary weights, and for utf8mb4_0900_as_cs then `00 00` and all tertiary weights, not per-character weights. utf8mb4_0900_as_ci stops after the secondary weights. Both are NO PAD, so the same value in CHAR(2) and CHAR(300) gives the same key bytes. A single character contributes at most 16 bytes per level, so at most 48 bytes under as_cs and 32 under as_ci, plus 4 (as_cs) or 2 (as_ci) separator bytes per value. Keep bounds constant per column. Preserve all collation levels, contractions, expansions, and ignorables; never truncate. Equal values such as `a` and `a` plus combining acute under an accent-insensitive collation must have identical bytes. Lowercasing and host-locale comparison are insufficient. Reject unavailable transforms; changing weights or bounds requires rebuilding affected keys.

Generate weights locally and frame them as a variable-width component (`01 || escape(weight) || 00 00`). MySQL 8.4 defines the collation weights. Matching the output bytes of `WEIGHT_STRING` is optional. [MySQL collation handler](https://github.com/mysql/mysql-server/blob/8.4/include/mysql/strings/m_ctype.h) and [UCA implementation](https://github.com/mysql/mysql-server/blob/8.4/strings/ctype-uca.cc).

| Value        | Collation                      | Bound   | Raw weight             | Framed component                         |
| ------------ | ------------------------------ | ------- | ---------------------- | ---------------------------------------- |
| `a`          | utf8mb4_0900_ai_ci (NO PAD)    | natural | `1C47`                 | `011c470000`                             |
| `ab`         | utf8mb4_0900_ai_ci (NO PAD)    | natural | `1C471C60`             | `011c471c600000`                         |
| `'a '`       | utf8mb4_general_ci (PAD SPACE) | CHAR(3) | `0041`                 | `0100ff410000`                           |
| `''` (empty) | utf8mb4_0900_ai_ci (NO PAD)    | natural | (empty)                | `010000`                                 |
| `''` (empty) | utf8mb4_general_ci (PAD SPACE) | CHAR(3) | (empty)                | `010000`                                 |
| `a`          | utf8mb4_0900_as_cs (NO PAD)    | natural | `1C470000002000000002` | `011c4700ff00ff00ff2000ff00ff00ff020000` |
| `A`          | utf8mb4_0900_as_cs (NO PAD)    | natural | `1C470000002000000008` | `011c4700ff00ff00ff2000ff00ff00ff080000` |
| `''` (empty) | utf8mb4_0900_as_cs (NO PAD)    | natural | `00000000`             | `0100ff00ff00ff00ff0000`                 |
| `A`          | utf8mb4_0900_as_ci (NO PAD)    | natural | `1C4700000020`         | `011c4700ff00ff00ff200000`               |
| `''` (empty) | utf8mb4_0900_as_ci (NO PAD)    | natural | `0000`                 | `0100ff00ff0000`                         |

Under utf8mb4_0900_ai_ci, `a` and `a`+combining acute (U+0301) are two distinct inputs that both transform to `1C47`, so their framed components are byte-identical. Under utf8mb4_general_ci, both `'a'` and `'a '` encode to the single weight `0041`.

An empty text value is distinct from NULL under every collation: its framed component always begins `01`, never the NULL marker `00`. Under a NO PAD collation with a single-level transform (utf8mb4_0900_bin, utf8mb4_0900_ai_ci) its weight is empty, so it frames to `010000`, identical to an empty binary component. Under a multi-level collation (utf8mb4_0900_as_cs) its weight is the level separators `00000000`, which frames to `0100ff00ff00ff00ff0000`. Under utf8mb4_0900_as_ci it is `0000`, which frames to `0100ff00ff0000`. Under a PAD SPACE collation, an empty string and a string consisting entirely of U+0020 spaces both encode from the empty input.

## Reads and updates

- Group secondary versions by E, removing the last eight bytes. Select the latest visible TX_ID before predicates or returning its target row. A selected DELETED item suppresses older mappings.
- Validate target rows at the same snapshot. Updates tombstone the old E and write the new E; unchanged E writes only its final item.
- An exact entry lookup uses `[E||U64(0), E||U64(M)]`, where M is the snapshot's highest committed TX_ID. Apply visibility at its head H to entries within that range. A nonunique or NULL-containing index-value lookup scans prefix I across all PK suffixes and applies visibility per E.
- Leading-column probes use complete component encodings: Q is the concatenation of fully framed components (marker, escaped payload, and terminator for variable-width), never a raw value. `successor` operates on those framed bytes. Prefix Q covers `[Q, successor(Q))`; successor increments the last non-ff byte and drops following bytes. An all-ff prefix has no finite upper bound. Do not append TX_ID before the remaining key components. Example: an equality probe on a variable binary indexed value `61` frames to `01 61 00 00`, and the scan range is `[01 61 00 00, 01 61 00 01)`.
- Re-encode predicates using the index column types and collations, including the same trailing-space trim used to build PAD SPACE entries. Incompatible SQL coercions require SQL evaluation rather than an incorrect byte range.

## Byte fixtures

| Input                                             | Hex                                                    |
| ------------------------------------------------- | ------------------------------------------------------ |
| NULL component                                    | `00`                                                   |
| Empty binary component                            | `010000`                                               |
| Binary `00 ff` component                          | `0100ffff0000`                                         |
| Binary `61` component                             | `01610000`                                             |
| Binary `61 00` component                          | `016100ff0000`                                         |
| Signed BIGINT -1 component                        | `017fffffffffffffff`                                   |
| Signed BIGINT 0 component                         | `018000000000000000`                                   |
| Signed BIGINT 1 component                         | `018000000000000001`                                   |
| Unsigned BIGINT 1 component                       | `010000000000000001`                                   |
| DECIMAL(4,2) -1.00 component                      | `0126ab`                                               |
| DECIMAL(4,2) 0.00 component                       | `01270f`                                               |
| DECIMAL(4,2) 1.00 component                       | `012773`                                               |
| DOUBLE -1 component                               | `01400fffffffffffff`                                   |
| DOUBLE 0 component                                | `018000000000000000`                                   |
| DOUBLE 1 component                                | `01bff0000000000000`                                   |
| FLOAT -1 component                                | `01407fffff`                                           |
| FLOAT 0 component                                 | `0180000000`                                           |
| FLOAT 1 component                                 | `01bf800000`                                           |
| `'a'` CHAR utf8mb4_0900_ai_ci component           | `011c470000`                                           |
| `'ab'` CHAR utf8mb4_0900_ai_ci component          | `011c471c600000`                                       |
| `'a'` CHAR(3) utf8mb4_general_ci component        | `0100ff410000`                                         |
| `'a'` CHAR utf8mb4_0900_as_cs component           | `011c4700ff00ff00ff2000ff00ff00ff020000`               |
| TX_ID 42 suffix                                   | `000000000000002a`                                     |
| Unique unsigned key 5, TX_ID 42                   | `010000000000000005000000000000002a`                   |
| Nonunique unsigned key 5, unsigned PK 7, TX_ID 42 | `010000000000000005010000000000000007000000000000002a` |
| Unique NULL key, unsigned PK 7, TX_ID 42          | `00010000000000000007000000000000002a`                 |
