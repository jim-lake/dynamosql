# String encoding

**The encoding is not finalized.** This is a high-level summary. Its statements should not be taken as correct. The code in `src/` is the current best implementation and the reference. Open work and size targets are in [TODO.md](TODO.md).

## Goal

Comparing two encodings bytewise must give the same result as comparing the values under the collation. Values that compare equal must encode to identical bytes. Encodings are not decoded.

## API

- `weightString(value, collation, maxChars?)`: key before framing.
- `weightFramed(value, collation, maxChars?)`: stored form.

`maxChars` is the declared `CHAR(n)` length. Only PAD SPACE collations read it.

## Framing

A NULL component is `00`. A non-NULL string component never starts with `00`. Framed keys must stay correct when another component or a transaction ID follows.

## Collations

| Collation            | Pad       | Approach                                               |
| -------------------- | --------- | ------------------------------------------------------ |
| `ascii_bin`          | PAD SPACE | Padded ranks packed into a fixed-width integer         |
| `ascii_general_ci`   | PAD SPACE | Same, over case-folded ranks                           |
| `utf8mb4_0900_bin`   | NO PAD    | One ordered code per scalar, then an end byte          |
| `utf8mb4_0900_ai_ci` | NO PAD    | Compact level 1 codes, then an end byte                |
| `utf8mb4_0900_as_ci` | NO PAD    | Compact level 1 codes, then level 2 tokens             |
| `utf8mb4_0900_as_cs` | NO PAD    | Compact level 1 codes, then level 2 and level 3 tokens |

Other collations throw `RangeError`.

## Size

Worst-case lengths are not stated here. They are measured by `scripts/length_model.ts` and recorded in TODO.md.

## Errors

`RangeError` for an unknown collation, a missing or invalid `maxChars` on PAD SPACE, a value longer than `maxChars`, non-ASCII input to `ascii_*`, and invalid UTF-8 for the UCA collations.
