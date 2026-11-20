# String encoding

`weightString(value, collation, maxChars?)` returns an ordered key. `weightFramed` returns a component suitable for concatenation. Equal values have identical bytes within each function. A NULL component is `00`. A non-NULL frame has a nonzero first byte and ends before the next component. The encoder accepts UTF-8 bytes and validates them for the UCA collations. Binary callers supply valid UTF-8.

| Collation          | Padding   | Frame                                                   |
| ------------------ | --------- | ------------------------------------------------------- |
| ascii_bin          | PAD SPACE | Pack padded MySQL weight ranks as a fixed-width integer |
| ascii_general_ci   | PAD SPACE | Pack padded case-folded ranks as a fixed-width integer  |
| utf8mb4_0900_bin   | NO PAD    | Ordered scalar codes followed by an end byte            |
| utf8mb4_0900_ai_ci | NO PAD    | Primary bit stream                                      |
| utf8mb4_0900_as_ci | NO PAD    | Primary and secondary bit streams                       |
| utf8mb4_0900_as_cs | NO PAD    | Primary, secondary and tertiary bit streams             |

For PAD SPACE, supply a nonnegative integral declared character width and compare frames within the same width. Values exceeding the bound and non-ASCII bytes raise `RangeError`. NO PAD ignores the bound. An unsupported collation raises `RangeError`.

## UCA frame layout

For these three collations, `weightString` and `weightFramed` return the same bytes. Decode the UTF-8 input into Unicode scalars. For each active level, concatenate the nonzero 16-bit MySQL weight units for all scalars in input order. An expansion contributes every unit at that level. An ignorable contributes none. The lookup handles implicit Han weights as well as stored table entries. [Weight lookup](src/uca.ts)

| Collation            | Fields in bit order                                  | Final comparison level |
| -------------------- | ---------------------------------------------------- | ---------------------- |
| `utf8mb4_0900_ai_ci` | `1 · primary · P_END`                                | Primary                |
| `utf8mb4_0900_as_ci` | `1 · primary · P_END · secondary · S_END`            | Secondary              |
| `utf8mb4_0900_as_cs` | `1 · primary · P_END · secondary · S_END · tertiary` | Tertiary               |

The dots denote concatenation. Write each code most significant bit first, preserving leading zeros. Fields can cross byte boundaries. Write each indicated end code even for an empty level. After the last field, fill the low bits of a partial byte with zeros. The leading one bit places every frame above the NULL component `00`. [Bit writer and frame assembly](src/weight_string.ts)

### Primary codes

The primary table lists inclusive numeric ranges in weight order. Each row supplies a range prefix length. For a unit `u` in `[first, last]`, emit the range prefix followed by `u − first` in exactly `ceil(log2(last − first + 1))` bits. A singleton range emits only its prefix.

The first prefix has value zero. If the preceding row used prefix value `p` of length `a`, the next row of length `b` uses value `(p + 1) × 2^(b − a)` in exactly `b` bits. These ordered, prefix-free ranges also reserve the lowest symbol, unit zero, for `P_END`. Its current code is `0000000`. [Primary ranges](src/primary_bits.ts)

### Secondary codes

The secondary table lists inclusive runs of units with a common code width. Each unit receives its own code. Begin with value zero at the first width, increment after each unit, and rescale the next value by `2^(new width − old width)` when the width changes. Emit the resulting integer in exactly the assigned number of bits. Unit zero is `S_END`, with code `00`. The common secondary weight `0x0020` has code `01`. [Secondary runs](src/lower_bits.ts)

### Tertiary codes

Every scalar contributes the same number of secondary and tertiary units. Pair them by position. The secondary sequence already in the frame determines which tertiary weights are possible at each position.

- For secondary weight `0x0020`, select one of five ordered prefix trees using the preceding tertiary weight. In table order the contexts are **start or other**, `0x001A`, `0x001C`, `0x0004`, and `0x0002`.
- For each other secondary weight that permits multiple tertiary weights, use its designated tree. For a secondary weight with only one possible tertiary weight, emit zero bits.
- After processing a position, set the context from its actual tertiary weight, even when it emitted zero bits. Carry the context across scalar boundaries. [Tertiary trees and selection](src/lower_bits.ts)

A secondary tie fixes the tertiary unit count, so the final level needs no end code. At the first tertiary difference, both inputs have the same secondary weight and preceding context. Their selected tree gives the two weights distinct, ordered codes that differ before either ends. At the primary and secondary levels, the end code sorts below every continuation. Together these properties ensure that a strict difference is decided inside the frame and remains valid with independently appended suffixes. Equal weight streams at the selected strength produce identical frames.

### Worked examples

For `a` and `A`, the primary weight is `0x1C47` and its code is `0001111101`. Both have secondary weight `0x0020`. In the initial tertiary tree, lowercase `a` has weight `0x0002` with code `000000`, and uppercase `A` has weight `0x0008` with code `001000`. For example, the meaningful bits of the `as_cs` frame for `A` are `1 · 0001111101 · 0000000 · 01 · 00 · 001000`. Four low zero bits complete the final byte.

| Input                         | `ai_ci` frame (hex) | `as_ci` frame (hex) | `as_cs` frame (hex) |
| ----------------------------- | ------------------- | ------------------- | ------------------- |
| Empty string                  | `80`                | `80 00`             | `80 00`             |
| `a`                           | `8F A0 00`          | `8F A0 10`          | `8F A0 10 00`       |
| `A`                           | `8F A0 00`          | `8F A0 10`          | `8F A0 10 80`       |
| `á` or `a` followed by U+0301 | `8F A0 00`          | `8F A0 18 20`       | `8F A0 18 20 00`    |

Both spellings of `á` contribute one primary unit and two secondary units. They tie at every strength. The accent first distinguishes them from plain `a` at secondary strength. Exact worst-case size curves and cutoff witnesses are in the [size investigation](TODO.md).
