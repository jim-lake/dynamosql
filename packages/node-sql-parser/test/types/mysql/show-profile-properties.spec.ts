import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isShow } from './types.guard.ts';
import type { ShowProfile, ShowSimple } from '../../../types/mysql';

const parser = new Parser();

function parseShow(sql: string) {
  const ast = parser.astify(sql);
  assertType(isShow, ast, `isShow: ${sql}`);
  return ast;
}

test('SHOW PROFILE with no options has null types, query, and limit', () => {
  const ast = parseShow('SHOW PROFILE') as ShowProfile;
  assert.strictEqual(ast.keyword, 'profile');
  assert.strictEqual(ast.types, null);
  assert.strictEqual(ast.query, null);
  assert.strictEqual(ast.limit, null);
});

test('SHOW PROFILE CPU, BLOCK IO gives the type list in order', () => {
  const ast = parseShow('SHOW PROFILE CPU, BLOCK IO') as ShowProfile;
  assert.deepStrictEqual(ast.types, ['cpu', 'block io']);
});

test('SHOW PROFILE multi-word types are normalized to single spaces', () => {
  const ast = parseShow('SHOW PROFILE CONTEXT SWITCHES, PAGE FAULTS') as ShowProfile;
  assert.deepStrictEqual(ast.types, ['context switches', 'page faults']);
});

test('SHOW PROFILE FOR QUERY n gives the query number', () => {
  const ast = parseShow('SHOW PROFILE FOR QUERY 1') as ShowProfile;
  assert.deepStrictEqual(ast.query, { keyword: 'query', value: 1 });
});

test('SHOW PROFILE ... LIMIT 10 gives a single-value limit', () => {
  const ast = parseShow('SHOW PROFILE LIMIT 10') as ShowProfile;
  assert.strictEqual(ast.limit?.seperator, '');
  assert.strictEqual(ast.limit?.value.length, 1);
  assert.strictEqual(ast.limit?.value[0].value, 10);
});

test('SHOW PROFILE FOR QUERY 1 LIMIT 2, 5 gives the offset-form limit', () => {
  const ast = parseShow('SHOW PROFILE FOR QUERY 1 LIMIT 2, 5') as ShowProfile;
  assert.strictEqual(ast.limit?.seperator, ',');
  assert.deepStrictEqual(ast.limit?.value.map(v => v.value), [2, 5]);
});

test('SHOW PROFILES is still the simple profiles form', () => {
  const ast = parseShow('SHOW PROFILES') as ShowSimple;
  assert.strictEqual(ast.keyword, 'profiles');
});

test('SHOW PROFILE rejects an incomplete FOR QUERY and an unknown type', () => {
  assert.throws(() => parser.astify('SHOW PROFILE FOR QUERY'));
  assert.throws(() => parser.astify('SHOW PROFILE FOO'));
});
