import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isSelect, isBinary, isUnary } from './types.guard.ts';

const parser = new Parser();

function assertRejected(sql: string) {
  assert.throws(() => parser.astify(sql), undefined, sql);
}

function firstExpr(sql: string) {
  const ast = parser.astify(sql);
  assertType(isSelect, ast);
  return ast.columns[0].expr;
}

test('.5 is the number 0.5', () => {
  const expr = firstExpr('SELECT .5');
  assert.strictEqual(expr.type, 'number');
  assert.strictEqual(expr.value, 0.5);
});

test('.5 parses to the same AST as 0.5', () => {
  assert.deepStrictEqual(firstExpr('SELECT .5'), firstExpr('SELECT 0.5'));
  assert.deepStrictEqual(firstExpr('SELECT .25'), firstExpr('SELECT 0.25'));
});

test('.50 keeps its trailing zero, like 0.50', () => {
  const expr = firstExpr('SELECT .50');
  assert.strictEqual(expr.type, 'number');
  assert.strictEqual(expr.value, '0.50');
  assert.deepStrictEqual(expr, firstExpr('SELECT 0.50'));
});

test('.5E0 keeps the exponent text, like 0.5E0', () => {
  const expr = firstExpr('SELECT .5E0');
  assert.strictEqual(expr.type, 'number');
  assert.strictEqual(expr.value, '0.5E0');
  assert.deepStrictEqual(expr, firstExpr('SELECT 0.5E0'));
});

test('.5e-3 keeps the signed exponent', () => {
  const expr = firstExpr('SELECT .5e-3');
  assert.strictEqual(expr.value, '0.5e-3');
});

test('.0 keeps its text, like 0.0', () => {
  const expr = firstExpr('SELECT .0');
  assert.strictEqual(expr.value, '0.0');
});

test('-.5 is a unary minus over the number 0.5', () => {
  const expr = firstExpr('SELECT -.5');
  assertType(isUnary, expr);
  assert.strictEqual(expr.operator, '-');
  assert.strictEqual(expr.expr.type, 'number');
  assert.strictEqual(expr.expr.value, 0.5);
});

test('+.5 is a unary plus over the number 0.5', () => {
  const expr = firstExpr('SELECT +.5');
  assertType(isUnary, expr);
  assert.strictEqual(expr.operator, '+');
  assert.strictEqual(expr.expr.value, 0.5);
});

test('1 + .5 has .5 as the right operand', () => {
  const expr = firstExpr('SELECT 1 + .5');
  assertType(isBinary, expr);
  assert.strictEqual(expr.operator, '+');
  assert.strictEqual(expr.left.value, 1);
  assert.strictEqual(expr.right.value, 0.5);
});

test('leading-dot literal in a WHERE comparison', () => {
  const ast = parser.astify('SELECT * FROM t WHERE x = .25');
  assertType(isSelect, ast);
  assertType(isBinary, ast.where);
  assert.strictEqual(ast.where.operator, '=');
  assert.strictEqual(ast.where.right.value, 0.25);
});

test('leading-dot literal in a BETWEEN range is sqlified as decimals', () => {
  const out = parser.sqlify(parser.astify('SELECT * FROM t WHERE x BETWEEN .1 AND .9'));
  assert.ok(out.includes('BETWEEN 0.1 AND 0.9'), out);
});

test('leading-dot literals sqlify with a leading zero', () => {
  assert.strictEqual(parser.sqlify(parser.astify('SELECT .5')), 'SELECT 0.5');
  assert.strictEqual(parser.sqlify(parser.astify('SELECT .5E0')), 'SELECT 0.5E0');
  assert.strictEqual(parser.sqlify(parser.astify('SELECT -.5 + .25')), 'SELECT -0.5 + 0.25');
});

test('leading-dot literal in INSERT, UPDATE, and DELETE sqlify', () => {
  const insert = parser.sqlify(parser.astify('INSERT INTO t (x) VALUES (.5)'));
  assert.ok(insert.includes('VALUES (0.5)'), insert);
  const update = parser.sqlify(parser.astify('UPDATE t SET x = .5 WHERE id = 1'));
  assert.ok(update.includes('`x` = 0.5'), update);
  const del = parser.sqlify(parser.astify('DELETE FROM t WHERE x = .5'));
  assert.ok(del.includes('`x` = 0.5'), del);
});

test('a bare dot or a dot followed by a non-digit is rejected', () => {
  assertRejected('SELECT .');
  assertRejected('SELECT .x');
  assertRejected('SELECT .E0');
  assertRejected('SELECT ..5');
  assertRejected('SELECT . 5');
});
