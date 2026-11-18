import { expect } from 'chai';
import { createHashUniqueMakeKey } from '../../src/lib/helpers/hash_unique_index';
import { createHashNullableMakeKey } from '../../src/lib/helpers/hash_nullable_index';

describe('Hash index makeKey', () => {
  describe('unique keys (non-null)', () => {
    it('single string key returns the string', () => {
      const makeKey = createHashUniqueMakeKey(['string']);
      expect(makeKey(['abc'])).to.equal('abc');
    });

    it('single number key returns the number', () => {
      const makeKey = createHashUniqueMakeKey(['number']);
      expect(makeKey([2.5])).to.equal(2.5);
    });

    it('single bigint key returns the bigint', () => {
      const makeKey = createHashUniqueMakeKey(['bigint']);
      expect(makeKey([BigInt('9223372036854775807')])).to.equal(
        BigInt('9223372036854775807')
      );
    });

    it('single buffer key returns latin1 text', () => {
      const makeKey = createHashUniqueMakeKey(['buffer']);
      expect(makeKey([Buffer.from([0x61, 0xff])])).to.equal('aÿ');
    });

    it('two-column key with string and bigint serializes both parts', () => {
      const makeKey = createHashUniqueMakeKey(['string', 'bigint']);
      expect(makeKey(['a', BigInt(5)])).to.equal(JSON.stringify(['a', '5']));
    });

    it('two-column key distinguishes tuples that share a joined string', () => {
      const makeKey = createHashUniqueMakeKey(['string', 'string']);
      expect(makeKey(['a,b', 'c'])).to.not.equal(makeKey(['a', 'b,c']));
    });

    it('three-column key with buffer and number is stable', () => {
      const makeKey = createHashUniqueMakeKey(['buffer', 'number', 'string']);
      expect(makeKey([Buffer.from('ab'), 1, 'Q'])).to.equal(
        makeKey([Buffer.from('ab'), 1, 'Q'])
      );
    });

    it('generic path for more than three columns keeps tuples distinct', () => {
      const makeKey = createHashUniqueMakeKey([
        'string',
        'number',
        'bigint',
        'string',
      ]);
      const first = makeKey(['a', 1, BigInt(2), 'X']);
      expect(first).to.equal(makeKey(['a', 1, BigInt(2), 'X']));
      expect(first).to.not.equal(makeKey(['a', 1, BigInt(3), 'X']));
    });
  });

  describe('nullable keys (may contain NULL)', () => {
    it('non-null single string key is prefixed with nn:', () => {
      const nullable = createHashNullableMakeKey(['string'], 'number');
      expect(nullable(['abc'], 1)).to.equal('nn:abc');
    });

    it('NULL single string key differs between primary keys', () => {
      const makeKey = createHashNullableMakeKey(['string'], 'number');
      expect(makeKey([null], 1)).to.not.equal(makeKey([null], 2));
    });

    it('NULL single string key differs from every non-null string', () => {
      const makeKey = createHashNullableMakeKey(['string'], 'number');
      expect(makeKey([null], 1)).to.not.equal(makeKey(['n:1'], 1));
      expect(makeKey([null], 1)).to.not.equal(makeKey(['[null,"1"]'], 1));
    });

    it('NULL single number key differs between primary keys', () => {
      const makeKey = createHashNullableMakeKey(['number'], 'string');
      expect(makeKey([null], 'a')).to.not.equal(makeKey([null], 'b'));
      expect(makeKey([null], 'a')).to.not.equal(makeKey([0], 'a'));
    });

    it('non-null single number key matches the unique key', () => {
      const unique = createHashUniqueMakeKey(['number']);
      const nullable = createHashNullableMakeKey(['number'], 'bigint');
      expect(nullable([7], BigInt(1))).to.equal(String(unique([7])));
    });

    it('NULL single bigint key differs between primary keys', () => {
      const makeKey = createHashNullableMakeKey(['bigint'], 'string');
      expect(makeKey([null], 'a')).to.not.equal(makeKey([null], 'b'));
    });

    it('NULL single buffer key differs between primary keys', () => {
      const makeKey = createHashNullableMakeKey(['buffer'], 'string');
      expect(makeKey([null], 'a')).to.not.equal(makeKey([null], 'b'));
      expect(makeKey([null], 'a')).to.not.equal(
        makeKey([Buffer.from('')], 'a')
      );
    });

    it('NULL single string key differs between primary keys', () => {
      const makeKey = createHashNullableMakeKey(['string'], 'string');
      expect(makeKey([null], 'a')).to.not.equal(makeKey([null], 'b'));
    });

    it('two-column key with no NULL matches the unique key', () => {
      const unique = createHashUniqueMakeKey(['string', 'number']);
      const nullable = createHashNullableMakeKey(
        ['string', 'number'],
        'string'
      );
      expect(nullable(['a', 1], 'pk')).to.equal(unique(['a', 1]));
    });

    it('two-column key with NULL differs between primary keys', () => {
      const makeKey = createHashNullableMakeKey(['string', 'number'], 'string');
      expect(makeKey(['a', null], 'p1')).to.not.equal(
        makeKey(['a', null], 'p2')
      );
      expect(makeKey([null, 1], 'p1')).to.not.equal(makeKey([null, 1], 'p2'));
    });

    it('two-column key with NULL differs from a non-null tuple', () => {
      const unique = createHashUniqueMakeKey(['string', 'number']);
      const makeKey = createHashNullableMakeKey(['string', 'number'], 'string');
      expect(makeKey(['a', null], 'p1')).to.not.equal(unique(['a', 1]));
    });

    it('two-column key with NULL in a bigint column differs by primary key', () => {
      const makeKey = createHashNullableMakeKey(['bigint', 'string'], 'number');
      expect(makeKey([null, 'x'], 1)).to.not.equal(makeKey([null, 'x'], 2));
      expect(makeKey([BigInt(4), 'x'], 1)).to.equal(
        makeKey([BigInt(4), 'x'], 2)
      );
    });

    it('three-column key with NULL differs between primary keys', () => {
      const makeKey = createHashNullableMakeKey(
        ['string', 'bigint', 'string'],
        'bigint'
      );
      expect(makeKey(['a', BigInt(1), null], BigInt(1))).to.not.equal(
        makeKey(['a', BigInt(1), null], BigInt(2))
      );
    });

    it('three-column key without NULL matches the unique key', () => {
      const unique = createHashUniqueMakeKey(['string', 'bigint', 'string']);
      const makeKey = createHashNullableMakeKey(
        ['string', 'bigint', 'string'],
        'bigint'
      );
      expect(makeKey(['a', BigInt(1), 'X'], BigInt(9))).to.equal(
        unique(['a', BigInt(1), 'X'])
      );
    });

    it('generic path with more than three columns handles NULL and non-NULL keys', () => {
      const unique = createHashUniqueMakeKey([
        'string',
        'number',
        'bigint',
        'string',
      ]);
      const makeKey = createHashNullableMakeKey(
        ['string', 'number', 'bigint', 'string'],
        'string'
      );
      expect(makeKey(['a', 1, BigInt(2), 'X'], 'p1')).to.equal(
        unique(['a', 1, BigInt(2), 'X'])
      );
      expect(makeKey(['a', null, BigInt(2), 'X'], 'p1')).to.not.equal(
        makeKey(['a', null, BigInt(2), 'X'], 'p2')
      );
    });
  });
});
