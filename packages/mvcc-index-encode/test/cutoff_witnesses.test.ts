import { describe, it } from 'mocha';
import { expect } from 'chai';
import { weightFramed } from '../src/weight_string';

const A = '㌖';
const B = '㌕';
const enc = (s: string, c: 'utf8mb4_0900_as_cs' | 'utf8mb4_0900_as_ci') =>
  weightFramed(new TextEncoder().encode(s), c).length;

describe('mixed cutoff witnesses', () => {
  it('fits 56 copies of A in 1012 bytes under as_cs', () => {
    expect(enc(A.repeat(56), 'utf8mb4_0900_as_cs')).to.equal(1012);
  });

  it('pushes A x20 B A x35 to 1013 bytes under as_cs', () => {
    expect(enc(A.repeat(20) + B + A.repeat(35), 'utf8mb4_0900_as_cs')).to.equal(
      1013
    );
  });

  it('keeps 55 copies of A under the cutoff under as_cs', () => {
    expect(enc(A.repeat(55), 'utf8mb4_0900_as_cs')).to.equal(994);
  });

  it('pins the as_ci mixed witness at 1014 bytes', () => {
    expect(
      enc((A.repeat(20) + B).repeat(3) + A.repeat(21), 'utf8mb4_0900_as_ci')
    ).to.equal(1014);
  });

  it('keeps 83 copies of A at 1000 bytes under as_ci', () => {
    expect(enc(A.repeat(83), 'utf8mb4_0900_as_ci')).to.equal(1000);
  });
});
