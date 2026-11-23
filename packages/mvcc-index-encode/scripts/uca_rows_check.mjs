import assert from 'node:assert/strict';
import { validateUcaRows } from './uca_rows.mjs';

const C = 'utf8mb4_0900_ai_ci';
const requested = [0x41, 0x42, 0x43];

function throwsWith(fn, pattern) {
  assert.throws(fn, (err) => {
    assert.match(err.message, pattern);
    return true;
  });
}

assert.deepEqual(
  validateUcaRows(C, requested, [
    [String(0x43), '1C47'],
    [String(0x41), '1C3D'],
    [String(0x42), ''],
  ]),
  [
    [0x41, '1C3D'],
    [0x42, ''],
    [0x43, '1C47'],
  ],
  'legitimate empty weight is accepted and rows follow requested order'
);

throwsWith(
  () =>
    validateUcaRows(C, requested, [
      ['65', '1C3D'],
      ['67', '1C47'],
    ]),
  /utf8mb4_0900_ai_ci: missing row for scalar 66/
);

throwsWith(
  () =>
    validateUcaRows(C, requested, [
      ['65', '1C3D'],
      ['65', '1C3D'],
      ['66', '1C3E'],
      ['67', '1C47'],
    ]),
  /duplicate row for scalar 65/
);

throwsWith(
  () =>
    validateUcaRows(C, requested, [
      ['65', '1C3D'],
      ['66', '1C3E'],
      ['67', '1C47'],
      ['68', '1C48'],
    ]),
  /unexpected scalar "68"/
);

throwsWith(() => validateUcaRows(C, [0], [['', '']]), /unexpected scalar ""/);

throwsWith(
  () => validateUcaRows(C, requested, [['65', '1C3D'], ['66'], ['67', '1C47']]),
  /utf8mb4_0900_ai_ci: row for scalar 66 has 1 fields, expected 2/
);

console.log('validateUcaRows: all checks passed');
