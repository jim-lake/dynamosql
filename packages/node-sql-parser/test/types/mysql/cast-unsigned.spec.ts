import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isSelect, isCast, isColumnRef, isValueExpr } from './types.guard.ts';

const parser = new Parser();

test('CAST(expr AS UNSIGNED) with a column reference and a literal', () => {
  const ast = parser.astify("SELECT CAST(col AS UNSIGNED), CAST(1 AS UNSIGNED) FROM t");
  assertType(isSelect, ast);
  const [colCast, litCast] = ast.columns.map((c: { expr: unknown }) => c.expr);
  assertType(isCast, colCast);
  assertType(isColumnRef, colCast.expr);
  assert.strictEqual(colCast.target[0].dataType, 'UNSIGNED');
  assertType(isCast, litCast);
  assertType(isValueExpr, litCast.expr);
  assert.strictEqual(litCast.target[0].dataType, 'UNSIGNED');
});
