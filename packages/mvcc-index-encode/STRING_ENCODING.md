# String encoding

Keys are compared bytewise and have a size limit. For two values in a
collation, comparing their encodings bytewise gives the same result (less,
equal, greater) as comparing the values under that collation. Values that
compare equal encode to identical bytes. Encodings cannot be decoded.

## API

- `weightString(value, collation, maxChars?)`: key before framing.
- `weightFramed(value, collation, maxChars?)`: `encodeVariable(weightString(...))`. This is the stored form.

`value` is UTF-8 bytes (ASCII bytes for `ascii_*`). `maxChars` is the declared
`CHAR(n)` length and is read only by PAD SPACE collations.

## Framing

```
01 || escape(key) || 00 00
```

`escape` replaces each `00` with `00 FF`. The empty string frames as `01 00 00`.

## Collations

| Collation            | Pad       | Key                                                              |
| -------------------- | --------- | ---------------------------------------------------------------- |
| `ascii_bin`          | PAD SPACE | 1 weight byte per character (the byte itself), padded            |
| `ascii_general_ci`   | PAD SPACE | 1 weight byte per character (letters fold to upper case), padded |
| `utf8mb4_0900_bin`   | NO PAD    | input bytes, not copied                                          |
| `utf8mb4_0900_ai_ci` | NO PAD    | level 1 weights                                                  |
| `utf8mb4_0900_as_ci` | NO PAD    | compact 2-level key                                              |
| `utf8mb4_0900_as_cs` | NO PAD    | compact 3-level key                                              |

Other collations throw `RangeError`.

### ASCII

Bytes `>= 0x80` throw. The key is padded with the space weight (`20`) to
`maxChars` characters, so `a` and `a ` encode identically. `maxChars` is
required. A longer value throws. Keys are comparable only with the same
`maxChars`.

```
ascii_bin         'A' maxChars 3  ->  41 20 20
ascii_general_ci  'a' maxChars 3  ->  41 20 20
```

### `utf8mb4_0900_bin`

The key is the input bytes. The caller guarantees valid UTF-8 and must not
modify the result. `maxChars` is ignored.

### `utf8mb4_0900_ai_ci`

Invalid UTF-8 throws. Each code point contributes its level 1 weight from the
UCA table: one or more 2-byte units, none for ignorable code points, 4 bytes
for implicit Han. The key is the concatenation of those weights.

```
'a'  ->  1C 47
```

### `utf8mb4_0900_as_ci` and `utf8mb4_0900_as_cs`

```
as_cs:  L1 || 01 || level 2 tokens || level 3 tokens
as_ci:  L1 || 01 || level 2 tokens
```

- **L1:** level 1 weights, as in `ai_ci`. Every L1 unit starts with a byte `>= 02`, so `01` sorts below any continuation.
- **Levels 2 and 3:** the 2-byte units of all code points in order. The default unit `D` is `0020` at level 2 and `0002` at level 3. Runs of `D` are written as a count. Each unit that differs from `D` ends a run and is written in a token. Each level ends with an end token.

Token, with `g` = number of `D` units before it:

| Ends with    | Bytes                       |
| ------------ | --------------------------- |
| end of level | `gap(g)` `02`               |
| unit `u < D` | `gap(g)` `03` `u` (2 bytes) |
| unit `u > D` | `~gap(g)` `u - D` (1 byte)  |

`~` XORs each byte with `FF`.

`gap(g)`:

| `g`        | Bytes                                            |
| ---------- | ------------------------------------------------ |
| 0..121     | `g + 2`                                          |
| 122 and up | `7B + s`, then `g - 122` as `s` big-endian bytes |

`s` is the smallest value in 1..4 with `g - 122 < 256^s`.

The current table has no level 2 unit below `0020` and no level 3 unit below
`0002`, so `03` is not produced. Every unit above `D` is at most `D + FF`
(level 2 maximum `0114`, level 3 maximum `001E`), so `u - D` fits one byte and is never `00`.
A new table must keep that bound.

Order at the first position where two sequences differ, each side being end,
`< D`, `D`, or `> D`: end < `< D` < `D` < `> D`.

- A `gap` byte for end or `< D` is in `02..7F`. A `~gap` byte for `> D` is in `80..FD`. So end and `< D` sort below `> D` with no class byte. Within the low class, end (`02`) sorts below `03`.
- A larger count means the deviation comes later. For end or `< D`, a later deviation sorts higher, so `gap` increases. For `> D`, a later deviation sorts lower, so `~gap` is used.
- `gap` is prefix-free: the first byte gives the length. Equal class and count compare unit bytes.

Examples (`as_cs`):

| Text  | Key                          |
| ----- | ---------------------------- |
| empty | `01 02 02 02 02`             |
| `a`   | `1C 47 01 03 02 03 02`       |
| `A`   | `1C 47 01 03 02 FD 06 02 02` |
| `á`   | `1C 47 01 FC 04 02 02 04 02` |
| `ab`  | `1C 47 1C 60 01 04 02 04 02` |

`as_ci` is the same without the level 3 tokens: `a` is `1C 47 01 03 02`.

### Size

- L1: 2 bytes per unit.
- Each of levels 2 and 3: 2 bytes for the end token plus 2 bytes per non-default unit (1 byte `gap`, 1 byte unit). A count `>= 122` adds 1 to 4 bytes to its `gap`.
- `01` separator: 1 byte. Framing: 3 bytes. Each `00` in a large `gap` payload adds 1 byte when framed.

Unaccented lower case text costs about `2n + 8` bytes for `n` characters in
`as_cs`. Each upper case letter adds 2 bytes, and each precomposed accent adds 2 bytes.

## Errors

`RangeError` for: unknown collation, missing or invalid `maxChars` on PAD
SPACE, value longer than `maxChars`, non-ASCII input to `ascii_*`, invalid
UTF-8 for the UCA collations.
