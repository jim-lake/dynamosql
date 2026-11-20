# String encoding

`weightString(value, collation, maxChars?)` returns an ordered key. `weightFramed` returns a component suitable for concatenation. Equal values have identical bytes within each function. A NULL component is `00`. A non-NULL frame has a nonzero first byte and ends before the next component. Both functions take a byte array. All four utf8mb4 collations decode UTF-8 and raise `RangeError` for malformed input.

| Collation          | Padding   | Frame                                                   |
| ------------------ | --------- | ------------------------------------------------------- |
| ascii_bin          | PAD SPACE | Pack padded MySQL weight ranks as a fixed-width integer |
| ascii_general_ci   | PAD SPACE | Pack padded case-folded ranks as a fixed-width integer  |
| utf8mb4_0900_bin   | NO PAD    | Ordered scalar codes followed by an end byte            |
| utf8mb4_0900_ai_ci | NO PAD    | Primary bit stream                                      |
| utf8mb4_0900_as_ci | NO PAD    | Primary and secondary bit streams                       |
| utf8mb4_0900_as_cs | NO PAD    | Primary, secondary and tertiary bit streams             |

For PAD SPACE, supply a nonnegative integral declared character width and compare frames within the same width. Values exceeding the bound and non-ASCII bytes raise `RangeError`. NO PAD ignores the bound. An unsupported collation raises `RangeError`.

## Worst-case frame size

`M(n)` is the largest non-NULL `weightFramed` result in bytes for a value of at most `n` characters. For ASCII, `n` is the declared PAD SPACE width and every valid input at that width has the same frame length. For `utf8mb4`, count Unicode scalars. The formulas include all framing bits and final byte padding, and apply at `n = 0`.

| Collation | Exact M(n) in bytes | Largest n in 1,012 bytes | M(n) at cutoff | M(n + 1) |
| --- | --- | ---: | ---: | ---: |
| `ascii_bin` | W(128, n) | 1,156 | 1,012 | 1,013 |
| `ascii_general_ci` | W(102, n) | 1,213 | 1,012 | 1,013 |
| `utf8mb4_0900_bin` | 3n + 1 | 337 | 1,012 | 1,015 |
| `utf8mb4_0900_ai_ci` | ceil((44n + 8) / 8) | 183 | 1,008 | 1,013 |
| `utf8mb4_0900_as_ci` | ceil((59n + 10) / 8) | 137 | 1,012 | 1,019 |
| `utf8mb4_0900_as_cs` | ceil((76n + 11) / 8) | 106 | 1,009 | 1,018 |

`W(K, n)` is the smallest positive integer `w` satisfying `Kⁿ ≤ 255 × 256^(w−1)`. The padded rank sequence has `Kⁿ` possible values. A frame of `w` bytes allows 255 choices for its nonzero first byte and 256 for each subsequent byte.

### Composite indexes

The 1,012-byte budget applies to all column frames together. Add the independent column maxima, then reserve 12 more bytes for the transaction ID and ordinal. A NULL component occupies one byte. For example, an `ai_ci` column of width 183 can use 1,008 bytes. Adding an `ascii_bin` column of width 4 brings the maximum to exactly 1,012 bytes. Width 5 brings it to 1,013.

| Bytes available for one UCA column | Largest ai_ci width | Largest as_ci width | Largest as_cs width |
| ---: | ---: | ---: | ---: |
| 64 | 11 | 8 | 6 |
| 128 | 23 | 17 | 13 |
| 256 | 46 | 34 | 26 |
| 512 | 92 | 69 | 53 |

### Why the UCA bounds are exact

For `ai_ci`, summing the primary code lengths for each of the 1,112,064 valid scalars gives a maximum of 44 bits at U+2057. For `as_ci`, summing primary and secondary lengths gives 59 bits at U+332E. The costs add across scalar boundaries, so repeating the respective scalar attains the maximum at every width. Add eight fixed bits for `ai_ci` or ten for `as_ci`, then round up to whole bytes. [Primary codes](src/primary_bits.ts) · [Lower-level codes](src/lower_bits.ts)

For `as_cs`, the previous tertiary context changes the cost of the next scalar. For each scalar and each of the five incoming contexts, sum its primary, secondary and tertiary code lengths and record its outgoing context. A scalar with no tertiary units preserves the context. For each pair of contexts `i, j`, let `E(i,j)` be the greatest bit cost of a scalar taking `i` to `j`, or negative infinity if that transition is unreachable. [Context selection](src/lower_bits.ts)

Start with zero bits in the initial context and negative infinity in the other four. After one more scalar, the maximum payload ending in context `j` is `D(n+1,j) = maxᵢ(D(n,i) + E(i,j))`. Each maximizing transition has a scalar that attains it. U+0000 contributes no units, so the same calculation covers inputs of at most `n` scalars.

The largest payloads at widths 0 through 3 are 0, 77, 153 and 229 bits. At width 4 every context maximum equals its width-3 maximum plus 76 bits. Adding a constant to all five costs adds the same constant after the next transition, so the maximum is `76n + 1` payload bits for every positive width. The ten fixed bits give the table's byte formula. At width zero the ten fixed bits alone occupy two bytes. A concrete 106-scalar witness is U+FDFA, U+1F1A9, then 52 repetitions of the pair (U+327C, U+FDFA). Its frame occupies 1,009 bytes.

## ASCII encodings

`weightString` emits the MySQL table weight for each input byte, then the weight of U+0020 for every remaining character position up to the declared width. `weightFramed` assigns consecutive ranks starting at zero to the distinct weights in bytewise order. Equal weights share a rank. Pad with the rank of U+0020 and treat the resulting digits as an `n`-digit base-`K` integer `x`, most significant digit first. [ASCII weight tables](src/generated/collation_weights.ts)

With `w = W(K, n)`, write `256^(w−1) + x` in exactly `w` big-endian bytes. The offset makes the first byte nonzero. At a common declared width, comparing frames compares the padded rank sequences, including ties from trailing spaces and case folding. At width zero the empty value has an empty raw key and frame `01`. [ASCII writers](src/weight_string.ts)

## Binary Unicode encoding

For `utf8mb4_0900_bin`, both public functions write one code per scalar, followed by the end byte `01`. In the table, `u` is the scalar's numeric value and byte constants are hexadecimal. [Scalar writer](src/weight_string.ts)

| Scalar range | Code bytes in order |
| --- | --- |
| U+0000–U+007F | One byte equal to `0x02 + u` |
| U+0080–U+07FF | With `x = u − 0x80`, write `0x82 + floor(x / 256)`, then the low byte of `x` |
| U+0800–U+10FFFF, excluding surrogates | Set `x = u − 0x800` and subtract another `0x800` when `u > 0xDFFF`. Write `0x8A + floor(x / 65536)`, then the low 16 bits of `x` in big-endian order |

The lead byte determines the code length. Codes increase with the scalar value, and the end byte sorts below every lead. Repeating U+0800 attains the maximum of three bytes per scalar plus the end byte.

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

Both spellings of `á` contribute one primary unit and two secondary units. They tie at every strength. The accent first distinguishes them from plain `a` at secondary strength.
