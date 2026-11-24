# MVCC hash index encoding

This document controls HASH indexes (`index_type` `HASH`) and the data-table partition key: keys used only for equality lookup, with no range scans and no ordering. [MVCC_ORDERED_INDEX.md](MVCC_ORDERED_INDEX.md) controls ORDERED (`BTREE`) indexes.

Character values are normalized with `canonicalString` from `@dynamosql/mvcc-index-encode`. [Equality key](../../../packages/mvcc-index-encode/STRING_ENCODING.md#equality-key) defines its output.

## Identity

- Resolve index `columns` through schema `column_name` to stable `dynamodb_name`. Apply SQL column coercion and precision rules before encoding.
- Two keys are equal exactly when SQL equality holds for every component under the column types and collations.
- Persist original column values separately. A hash key cannot recover the original value.
- Hash keys have no order. Range predicates and ORDER BY on a hash index require an ordered index or SQL evaluation.
- Re-encode lookup values using the index column's own type, scale and collation.

## Normalized component bytes

Each component has one byte form that depends only on its value and its column definition. `LE_w(x)` is little-endian in exactly w bytes, two's complement for signed values.

| Type                                      | Normalized bytes                                                         | Width    |
| ----------------------------------------- | ------------------------------------------------------------------------ | -------- |
| TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT | `LE_w(x)` with w of 1, 2, 3, 4 or 8 by declared type, signed or unsigned | Fixed    |
| BIT(M)                                    | `LE_w(x)` unsigned, `w = ceil(M/8)`                                      | Fixed    |
| FLOAT                                     | IEEE binary32, little-endian                                             | Fixed    |
| DOUBLE                                    | IEEE binary64, little-endian                                             | Fixed    |
| DECIMAL(p,s)                              | See [DECIMAL](#decimal)                                                  | Variable |
| DATE, DATETIME, TIMESTAMP, TIME, YEAR     | Stored millisecond value as IEEE binary64, little-endian                 | Fixed    |
| Character, TEXT                           | UTF-8 bytes of `canonicalString(value, collation)`                       | Variable |
| Binary, BLOB                              | Stored bytes                                                             | Variable |

- Integer width never depends on the value.
- For FLOAT and DOUBLE, apply SQL precision and normalize either zero to positive zero. NaN and infinities are invalid. A DOUBLE has the same bytes whether its column value is stored as N or B.
- Temporal values use the stored N value from [column values](MVCC_STORAGE_SPEC.md#column-values), including the zero and non-calendar sentinels, rounded once to the nearest binary64. Fractional milliseconds are exact near 1970 and lose precision far from it: at `fsp` 6 only between about 1691 and 2248, at `fsp` 5 only before about 4199.
- Every collation is NO PAD, so trailing spaces are part of the value. Reject unsupported collations.
- JSON, spatial, ENUM and SET columns cannot appear in a hash index. Reject such definitions.

### DECIMAL

Let `n = x*10^s`, the exact scaled integer. DECIMAL normalized bytes depend on the value:

| Value                      | Normalized bytes                               |
| -------------------------- | ---------------------------------------------- |
| `-(2^53-1) <= n <= 2^53-1` | `n` as IEEE binary64, little-endian, 8 bytes   |
| Otherwise                  | `LE_32(n)`, 256-bit two's complement, 32 bytes |

A binary64 represents every integer in that range exactly. DECIMAL precision is at most 65 digits, so every `n` fits in 256 bits. The length prefix in [hashed keys](#hashed-keys) separates the two widths. Zero is positive zero.

## Key representation

The representation is chosen from the index definition, never per row. A given index always produces one attribute type. Each NOT NULL single-column index takes the first row that applies.

| Index definition                                                                           | Key                                            |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| One NOT NULL direct column whose maximum stored length is at most 2048 bytes               | The column's stored N, S or B value, unchanged |
| One NOT NULL DOUBLE column                                                                 | B, the 8 normalized bytes                      |
| One NOT NULL FLOAT column                                                                  | B, the 4 normalized bytes                      |
| One NOT NULL character column, other collation, maximum normalized length at most 16 bytes | S, `canonicalString(value, collation)`         |
| Anything else, including every composite index and every index with a nullable column      | B, the [hashed key](#hashed-keys)              |

A direct column is one whose stored value already is its hash key, so the key never duplicates the value:

| Direct column type                       | Stored value | Maximum stored length             |
| ---------------------------------------- | ------------ | --------------------------------- |
| Integer                                  | N            | Fits                              |
| DECIMAL(p,s) with `p <= 38`              | N            | Fits                              |
| Temporal                                 | N            | Fits                              |
| Binary, BLOB                             | B            | Declared length in bytes          |
| Character, TEXT under `utf8mb4_0900_bin` | S            | Four bytes per declared character |
| Character, TEXT under `ascii_bin`        | S            | One byte per declared character   |

- A direct key is the column's own attribute. The item stores the value once, under the column's `dynamodb_name`.
- 2048 bytes is DynamoDB's partition-key limit. A direct column whose maximum stored length exceeds it, or has no declared bound, is hashed.
- A DECIMAL with `p <= 38` fits DynamoDB's 38-digit N exactly. DynamoDB trims leading and trailing zeros, so equal values at the declared scale give equal N keys.
- The maximum normalized length of a character column is four bytes per declared character for `utf8mb4` collations and one byte per character for ASCII collations. A `canonicalString` key never exceeds the UTF-8 length of its input.
- An index with any column that permits NULL is always hashed, even with one column. The key's attribute type cannot vary per row.
- DynamoDB requires a nonempty partition key. A raw S or B key can be empty. An empty primary key is illegal, and a row with an empty secondary hash key is not saved in that index. See [MVCC_STORAGE_SPEC.md](MVCC_STORAGE_SPEC.md#hash-indexes-hash).
- Every key fits DynamoDB's partition-key limit by construction, so no key-length check applies beyond the 2048-byte direct cutoff.

## Primary partition key

The PRIMARY definition is encoded as a hash key. PK columns forbid NULL, so the NULL rules never apply. The data-table sort key is numeric `TX_ID`.

| Primary definition | Attribute                | Value                                      |
| ------------------ | ------------------------ | ------------------------------------------ |
| One direct column  | Column's `dynamodb_name` | Its stored N, S or B value                 |
| Other declared PK  | `DB_ROW_KEY`             | The S or B key from the table above        |
| No declared PK     | `DB_ROW_ID`              | Generated positive signed BIGINT, native N |

- `DB_ROW_KEY` holds the derived key, and the column attributes keep the original SQL values.
- `DB_ROW_KEY` for a declared PK is its encoding, not an allocated surrogate. Each physical generation uses the representation selected by its PRIMARY definition for every row.

## Hashed keys

The hashed key is `SHA-256` of the concatenated component frames in index order, applied once, 32 bytes.

| Component                                     | Frame                                                |
| --------------------------------------------- | ---------------------------------------------------- |
| Fixed-width value                             | Its normalized bytes                                 |
| Variable-width value                          | `LE_4(byte length)` followed by its normalized bytes |
| NULL, in a column that permits NULL           | `00`                                                 |
| Non-NULL value, in a column that permits NULL | `01` followed by its frame as above                  |

- The schema fixes each component's type and nullability, and every variable-width value carries its length, so distinct component lists never produce the same input bytes.
- When any component of a row's key is NULL, append the row's PK frames after the index components, so NULL-containing rows never share a key. The PK frames are the declared PK components in PK order, framed as above, or `LE_8(DB_ROW_ID)` for a hidden PK. When no component is NULL, append nothing.

## Index table

The hash index table's partition key is the indexed column's own attribute for a direct key, and `INDEX_KEY` otherwise. Its sort key is the numeric `TX_ID` of the writing transaction. Items also store the indexed column values and the target PK attributes, and tombstones keep them, as in [MVCC_ORDERED_INDEX.md](MVCC_ORDERED_INDEX.md#secondary-sort-key). The PK is never part of the key except in the NULL case above.

## Byte fixtures

| Input                                             | Key                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| NOT NULL INT 1, single column                     | N `1`                                                                                                       |
| NOT NULL DECIMAL(5,2) 1.50, single column         | N `1.5`                                                                                                     |
| BIGINT -1 normalized bytes                        | `ffffffffffffffff`                                                                                          |
| DATE 2000-01-01 normalized bytes                  | `000080f5598d6b42`, binary64 946684800000                                                                   |
| TIME -00:00:01.5 normalized bytes                 | `00000000007097c0`, binary64 -1500                                                                          |
| YEAR 2024 normalized bytes                        | `0000401f25cc7842`, binary64 1704067200000                                                                  |
| Zero DATE normalized bytes                        | `0080faca73f93fc3`, binary64 -9000000000000000                                                              |
| DECIMAL(5,2) 1.50 normalized bytes                | `0000000000c06240`, binary64 150                                                                            |
| DECIMAL(65,0) 2^53 normalized bytes               | `0000000000002000000000000000000000000000000000000000000000000000`                                          |
| NOT NULL DOUBLE 1, single column                  | B `000000000000f03f`                                                                                        |
| NOT NULL DOUBLE -1, single column                 | B `000000000000f0bf`                                                                                        |
| NOT NULL DOUBLE -0, single column                 | B `0000000000000000`                                                                                        |
| `utf8mb4_0900_bin` `abc` in NOT NULL VARCHAR(4)   | S `abc`, direct                                                                                             |
| `ascii_bin` 17 `a` in NOT NULL VARCHAR(17)        | S `aaaaaaaaaaaaaaaaa`, direct                                                                               |
| `ascii_general_ci` 17 `a` in NOT NULL VARCHAR(17) | B `SHA-256(11000000 41×17)` = `b664e05a93365551f927d89d91c9e2bacecf16b8e44bc8d06dcaa8dd35f39f32`            |
| (`ab`, `c`), composite NOT NULL VARCHARs          | B `SHA-256(02000000 6162 01000000 63)` = `60014a36d7b05b0730e42a8b96faa1ffb4bd28469aea4000191179f01561ddb7` |
| (`a`, `bc`), composite NOT NULL VARCHARs          | B `SHA-256(01000000 61 02000000 6263)` = `47ea6f805c5b663e33012cd34184e1398ad81a0dcea50071346f05d26692e843` |
| (INT 1, INT 2), composite NOT NULL                | B `SHA-256(01000000 02000000)` = `34fb5c825de7ca4aea6e712f19d439c1da0c92c37b423936c5f618545ca4fa1f`         |
| Nullable INT 1, single column                     | B `SHA-256(01 01000000)` = `b3844634762d8e075473fc1cd774d0f251c6512e27e67e43e7b9ae69efff56f3`               |
| Nullable INT NULL, BIGINT PK 10                   | B `SHA-256(00 0a00000000000000)` = `82451e648f5a389de8890552888439415478ffa3d3595a17639e69f2b839486a`       |
| Nullable VARCHAR `ab`, single column              | B `SHA-256(01 02000000 6162)` = `50689cfad79bcb0617484629f2d4ea14e2547e22aef83bebda6bdf51e7b963d8`          |
