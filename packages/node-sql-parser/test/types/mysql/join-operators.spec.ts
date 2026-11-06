import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isSelect, isJoin } from './types.guard.ts';

const parser = new Parser();

test('CROSS JOIN has no ON clause and keeps its join value', () => {
  const ast = parser.astify('SELECT * FROM a CROSS JOIN b');
  assertType(isSelect, ast);
  assertType(isJoin, ast.from[1]);
  assert.strictEqual(ast.from[1].join, 'CROSS JOIN');
  assert.strictEqual(ast.from[1].table, 'b');
  assert.strictEqual(ast.from[1].on, null);
});

test('CROSS JOIN accepts an ON clause', () => {
  const ast = parser.astify('SELECT * FROM a CROSS JOIN b ON a.x = b.x');
  assertType(isSelect, ast);
  assert.strictEqual(ast.from[1].join, 'CROSS JOIN');
  assert.strictEqual(ast.from[1].on.operator, '=');
});

test('STRAIGHT_JOIN keeps its underscore spelling', () => {
  const ast = parser.astify('SELECT * FROM a STRAIGHT_JOIN b ON a.x = b.x');
  assertType(isSelect, ast);
  assertType(isJoin, ast.from[1]);
  assert.strictEqual(ast.from[1].join, 'STRAIGHT_JOIN');
  assert.strictEqual(ast.from[1].on.left.column, 'x');
});

test('FULL OUTER JOIN is a syntax error, since MySQL reads FULL as an alias', () => {
  assert.throws(() => parser.astify('SELECT * FROM a FULL OUTER JOIN b ON a.x = b.x'));
});

test('FULL without OUTER is a table alias, not a join operator', () => {
  const ast = parser.astify('SELECT FULL.status FROM a FULL JOIN b ON FULL.id = b.id');
  assertType(isSelect, ast);
  assert.strictEqual(ast.from[0].table, 'a');
  assert.strictEqual(ast.from[0].as, 'FULL');
  assert.strictEqual(ast.from[1].join, 'INNER JOIN');
});

test('CROSS and STRAIGHT_JOIN sqlify keep their join keyword', () => {
  const cross = parser.sqlify(parser.astify('SELECT * FROM a CROSS JOIN b'));
  assert.ok(cross.includes('FROM `a` CROSS JOIN `b`'), cross);
  const straight = parser.sqlify(parser.astify('SELECT * FROM a STRAIGHT_JOIN b ON a.x = b.x'));
  assert.ok(straight.includes('FROM `a` STRAIGHT_JOIN `b` ON'), straight);
});
