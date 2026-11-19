import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isFunction, isSelect } from './types.guard.ts';
import type { Function } from '../../../types/mysql';

const parser = new Parser();

function positionFunc(sql: string): Function {
  const ast = parser.astify(sql);
  assertType(isSelect, ast, `isSelect: ${sql}`);
  const expr = (ast as any).columns[0].expr;
  assertType(isFunction, expr, `isFunction: ${sql}`);
  return expr as Function;
}

test('POSITION(substr IN str) has two args and separator IN', () => {
  const fn = positionFunc("SELECT POSITION('a' IN 'abc')");
  assert.strictEqual(fn.name.name[0].value, 'position');
  assert.ok(fn.args);
  assert.strictEqual(fn.args.value.length, 2);
  assert.strictEqual(fn.separator, ' IN ');
});

test('POSITION with a column for str still has two args', () => {
  const fn = positionFunc('SELECT POSITION(a IN b) FROM t');
  assert.ok(fn.args);
  assert.strictEqual(fn.args.value.length, 2);
  assert.strictEqual(fn.separator, ' IN ');
});

test('ordinary function calls have no separator', () => {
  const fn = positionFunc('SELECT CONCAT(a, b) FROM t');
  assert.strictEqual(fn.separator, undefined);
});
