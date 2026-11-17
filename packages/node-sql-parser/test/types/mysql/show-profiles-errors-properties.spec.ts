import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isShow } from './types.guard.ts';
import type { ShowSimple, ShowWarningsErrors } from '../../../types/mysql';

const parser = new Parser();

function parseShow(sql: string) {
  const ast = parser.astify(sql);
  assertType(isShow, ast, `isShow: ${sql}`);
  return ast;
}

test('SHOW PROFILES gives keyword profiles', () => {
  const ast = parseShow('SHOW PROFILES') as ShowSimple;
  assert.strictEqual(ast.type, 'show');
  assert.strictEqual(ast.keyword, 'profiles');
});

test('SHOW ERRORS gives keyword errors and no limit', () => {
  const ast = parseShow('SHOW ERRORS') as ShowWarningsErrors;
  assert.strictEqual(ast.keyword, 'errors');
  assert.strictEqual(ast.limit, null);
});

test('SHOW ERRORS LIMIT 10 gives a limit with value 10', () => {
  const ast = parseShow('SHOW ERRORS LIMIT 10') as ShowWarningsErrors;
  assert.strictEqual(ast.keyword, 'errors');
  assert.ok(ast.limit !== null);
  assert.strictEqual(ast.limit.value.length, 1);
  assert.strictEqual(ast.limit.value[0].value, 10);
});

test('SHOW WARNINGS gives keyword warnings', () => {
  const ast = parseShow('SHOW WARNINGS') as ShowWarningsErrors;
  assert.strictEqual(ast.keyword, 'warnings');
  assert.strictEqual(ast.limit, null);
});

test('SHOW WARNINGS LIMIT 2, 5 keeps both offset and row count', () => {
  const ast = parseShow('SHOW WARNINGS LIMIT 2, 5') as ShowWarningsErrors;
  assert.strictEqual(ast.keyword, 'warnings');
  assert.ok(ast.limit !== null);
  assert.strictEqual(ast.limit.seperator, ',');
  assert.deepStrictEqual(ast.limit.value.map(v => v.value), [2, 5]);
});
