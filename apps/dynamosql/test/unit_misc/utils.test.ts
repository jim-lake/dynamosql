import { expect } from 'chai';
import { toBigInt } from '../../src/tools/safe_convert';
import { jsonStringify, hex, trackFirstSeen } from '../../src/tools/util';

describe('Utility Functions', () => {
  describe('safe_convert', () => {
    it('toBigInt with invalid input', () => {
      expect(toBigInt(null)).to.equal(null);
      expect(toBigInt(undefined)).to.equal(null);
      expect(toBigInt({})).to.equal(null);
      expect(toBigInt([])).to.equal(null);
      expect(toBigInt('invalid')).to.equal(null);
    });

    it('toBigInt with valid inputs', () => {
      expect(toBigInt(123)).to.equal(BigInt(123));
      expect(toBigInt('456')).to.equal(BigInt(456));
      expect(toBigInt(true)).to.equal(BigInt(1));
      expect(toBigInt(false)).to.equal(BigInt(0));
      expect(toBigInt(BigInt(789))).to.equal(BigInt(789));
    });
  });

  describe('util', () => {
    it('jsonStringify with circular reference', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      expect(jsonStringify(obj)).to.equal('');
    });

    it('jsonStringify with valid object', () => {
      expect(jsonStringify({ a: 1, b: 2 })).to.equal('{"a":1,"b":2}');
    });

    it('hex converts string to hex', () => {
      const result = hex('ab');
      expect(result).to.include('0061');
      expect(result).to.include('0062');
    });

    it('trackFirstSeen with single key', () => {
      const map = new Map();
      expect(trackFirstSeen(map, ['key1'])).to.equal(true);
      expect(trackFirstSeen(map, ['key1'])).to.equal(false);
      expect(trackFirstSeen(map, ['key2'])).to.equal(true);
    });

    it('trackFirstSeen with two keys', () => {
      const map = new Map();
      expect(trackFirstSeen(map, ['key1', 'subkey1'])).to.equal(true);
      expect(trackFirstSeen(map, ['key1', 'subkey1'])).to.equal(false);
      expect(trackFirstSeen(map, ['key1', 'subkey2'])).to.equal(true);
      expect(trackFirstSeen(map, ['key2', 'subkey1'])).to.equal(true);
    });
  });
});
