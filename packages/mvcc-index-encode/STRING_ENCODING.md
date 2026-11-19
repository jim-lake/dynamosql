# String encoding

Keys are compared bytewise and have a size limit. For two values in a
collation, comparing their encodings bytewise gives the same result (less,
equal, greater) as comparing the values under that collation. Values that
compare equal encode to identical bytes. Encodings cannot be decoded.

## API

- `weightString(value, collation, maxChars?)`: key before framing.
- `weightFramed(value, collation, maxChars?)`: the stored form, defined under Framing.

`value` is UTF-8 bytes (ASCII bytes for `ascii_*`). `maxChars` is the declared
`CHAR(n)` length and is read only by PAD SPACE collations.

## Framing

`weightFramed` returns the whole component, with no marker byte. A NULL component is the single byte `00`. A non-NULL string component never starts with `00` and is never empty, so it needs no `01` marker. Another component or a TX_ID may follow, so no framed key may be a proper prefix of another.

| Collation                                  | Framed form              | Overhead                                    |
| ------------------------------------------ | ------------------------ | ------------------------------------------- |
| `utf8mb4_0900_as_cs`, `utf8mb4_0900_as_ci` | `weightString` unchanged | 0                                           |
| `utf8mb4_0900_ai_ci`                       | `weightString \|\| 01`   | 1                                           |
| `utf8mb4_0900_bin`                         | `escape(bytes) \|\| 01`  | 1, plus 1 per input byte `00`, `01` or `02` |
| `ascii_bin`, `ascii_general_ci`            | each weight byte plus 1  | 0                                           |

- The `as_cs` key ends with the level 3 end byte `02`. The `as_ci` key ends with its level 2 end token. Every L1 code starts with a byte `>= 02`, and the `01` separator follows L1, so no key is a proper prefix of another.
- `ai_ci` keys can be prefixes of each other, so `01` ends them. Every unit starts with a byte `>= 02`.
- `bin` escapes `00`, `01` and `02` as `02 x`, so the terminator `01` never appears in the payload.
- The ASCII key is padded to `maxChars`, so its width is fixed for a column. Weights are 0 to 127, and adding 1 keeps them above `00`, so the key never starts with the NULL byte.

The empty string frames as `01` for `ai_ci`, `01` for `bin`, `01 02 02` for `as_cs`, and `01 02` for `as_ci`.

## Collations

| Collation            | Pad       | Key                                                              |
| -------------------- | --------- | ---------------------------------------------------------------- |
| `ascii_bin`          | PAD SPACE | 1 weight byte per character (the byte itself), padded            |
| `ascii_general_ci`   | PAD SPACE | 1 weight byte per character (letters fold to upper case), padded |
| `utf8mb4_0900_bin`   | NO PAD    | input bytes, not copied                                          |
| `utf8mb4_0900_ai_ci` | NO PAD    | level 1 weights, 2 bytes each                                    |
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

- **L1:** the level 1 weights of the code points in order. Each weight is a
  one-byte code or a two-byte code, not the raw 2-byte UCA unit:
  - 24 weights have one-byte codes `03` to `F6`: `FB40` (implicit base for CJK
    Unified Ideographs) and the level 1 weights of U+FDFA, U+FDFB, U+1F1A9,
    U+321D and U+1F19C.
  - Every other weight takes two bytes. The lead byte is in `02` to `FB` and
    is shared by up to 256 weights. Lead bytes and one-byte codes come from one
    counter, so they never collide.
  - Every L1 code starts with a byte `>= 02`, so `01` sorts below any L1 continuation.
- **Level 2:** the level 2 weights of all code points in order. The default
  unit `D` is `0020`. Every level 2 unit is `>= D` and at most `D + F4` (the
  largest is `0114`). Runs of `D` are counted. Each unit `u > D` is written as a
  deviation token.
- **Level 3:** the level 3 weights in order. The default unit `D` is `0002`.
  The non-default units are all between `0003` and `001E`. At most 27 distinct
  ones occur, and they are ranked 0 to 26 in ascending order. Every level 3
  unit is `>= D`.

Tokens. `g` is the number of `D` units before the token:

| Level | Token                       | Bytes                                         |
| ----- | --------------------------- | --------------------------------------------- |
| 2     | unit `u > D`                | `~gap(g)`, then `u - D` (1 byte)              |
| 2     | end of level                | `gap(g)`, where `g` counts the trailing `D`s  |
| 3     | unit with rank `r`, `g = 0` | `E5 + r` (1 byte, `E5`..`FF`)                 |
| 3     | unit with rank `r`, `g > 0` | `ascending(g)`, then `r` (1 byte, `00`..`1A`) |
| 3     | end of level                | `02`                                          |

`~` XORs each byte with `FF`.

`gap(g)` for level 2:

| `g`        | Bytes                                            |
| ---------- | ------------------------------------------------ |
| 0..121     | `g + 2` (`02`..`7B`)                             |
| 122 and up | `7B + s`, then `g - 122` as `s` big-endian bytes |

`s` is the smallest value in 1..4 with `g - 122 < 256^s`.

`ascending(g)` for level 3:

| `g`        | Bytes                                                                 |
| ---------- | --------------------------------------------------------------------- |
| 1..217     | `228 - g` (one byte, `0B`..`E3`)                                      |
| 218 and up | `7 - s`, then `g - 218` as `s` big-endian bytes, each XORed with `FF` |

`s` is the smallest value in 1..4 with `g - 218 < 256^s`.

Order. At the first position where two level sequences differ, the sides are
the end token, a deviation, or the default `D` (there is no deviation below
`D` in the table). Ends sort first, deviations above `D` sort above `D`, and
a deviation earlier in the level sorts above one later in the level:

- Level 2: `gap` bytes are `02..7F`. `~gap` bytes are `80..FD`. So the end
  token sorts below every deviation. A larger `g` gives a smaller `~gap`, so an
  earlier deviation sorts higher. A larger `g` gives a larger end token, so a
  longer run before the end sorts higher.
- Level 3: the end byte `02` sorts below every token. A zero-gap deviation
  (`E5`..`FF`) sorts above every positive-gap deviation (`03`..`E3`). Among
  positive gaps, a larger `g` gives a smaller `ascending` byte. Equal gaps
  compare by rank.

The `gap` and `ascending` forms are prefix-free because the first byte gives the length.

Examples:

| Text  | `as_cs`                | `as_ci`             |
| ----- | ---------------------- | ------------------- |
| empty | `01 02 02`             | `01 02`             |
| `a`   | `23 07 01 03 02`       | `23 07 01 03`       |
| `A`   | `23 07 01 03 E9 02`    | `23 07 01 03`       |
| `á`   | `23 07 01 FC 04 02 02` | `23 07 01 FC 04 02` |
| `ab`  | `23 07 23 14 01 04 02` | `23 07 23 14 01 04` |

`ai_ci` for `a` is `1C 47`. The `as_cs` L1 code for `a` is `23 07`.

## Size and worst case

Per collation, `n` is the number of characters, and the length is the framed key.

| Collation            | Worst case                                                                                                                                                | Basis                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `ascii_*`            | exactly `maxChars` bytes                                                                                                                                  | Fixed width. `maxChars` is required.                                                                                                         |
| `utf8mb4_0900_bin`   | `<= 4n + 1` bytes                                                                                                                                         | Proven. A 4-byte character is never escaped. Each input byte `00`..`02` (ASCII only) costs 2 bytes, so no character costs more than 4 bytes. |
| `utf8mb4_0900_ai_ci` | `<= 16n + 1` bytes                                                                                                                                        | Proven from the table. The largest character (U+337F) has 8 units, each 2 bytes.                                                             |
| `utf8mb4_0900_as_ci` | Measured: 12.07 bytes per character (U+3316 repeated 41 times, 495 bytes). No bound in tests.                                                             | Measured, not proven.                                                                                                                        |
| `utf8mb4_0900_as_cs` | Bound enforced by tests: `24n + 3 + 4 * floor(8n / 122) + 4 * floor(8n / 218)`. Measured: 18.1 bytes per character (U+3316 repeated 41 times, 742 bytes). | Checked on per-character maxima, repeated worst-case characters, and 500 seeded mixed samples. Not a proof over arbitrary concatenation.     |

The largest `n` whose `as_cs` bound fits the 1012-byte tuple budget is 41
(bound 999).

Typical size, for scale:

- Unaccented lower case text costs `2n + 3` bytes in `as_cs` while `n <= 121`.
  Each lower case letter costs its 2-byte L1 code, and a run of letters costs
  one L2 end token.
- Each level 3 deviation, such as an upper case letter, costs 1 byte when no
  default unit precedes it since the last deviation, and 2 bytes otherwise.
- Each level 2 deviation, such as a precomposed accent, costs 2 bytes (the
  `~gap` and the unit).

## Errors

`RangeError` for: unknown collation, missing or invalid `maxChars` on PAD
SPACE, value longer than `maxChars`, non-ASCII input to `ascii_*`, invalid
UTF-8 for the UCA collations.
