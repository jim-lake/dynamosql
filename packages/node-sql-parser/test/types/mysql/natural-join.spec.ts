import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isSelect, isJoin } from './types.guard.ts';

const parser = new Parser();

function assertRejected(sql: string) {
  assert.throws(() => parser.astify(sql), undefined, sql);
}

test('NATURAL JOIN has no ON clause', () => {
  const ast = parser.astify('SELECT * FROM a NATURAL JOIN b');
  assertType(isSelect, ast);
  const joined = ast.from[1];
  assertType(isJoin, joined);
  assert.strictEqual(joined.join, 'NATURAL JOIN');
  assert.strictEqual(joined.table, 'b');
  assert.strictEqual(joined.on, undefined);
  assert.strictEqual(joined.using, undefined);
});

test('NATURAL LEFT and NATURAL RIGHT joins drop the OUTER keyword', () => {
  const left = parser.astify('SELECT * FROM a NATURAL LEFT OUTER JOIN b');
  assertType(isSelect, left);
  assert.strictEqual(left.from[1].join, 'NATURAL LEFT JOIN');
  const right = parser.astify('SELECT * FROM a NATURAL RIGHT JOIN b');
  assertType(isSelect, right);
  assert.strictEqual(right.from[1].join, 'NATURAL RIGHT JOIN');
});

test('NATURAL INNER JOIN is the same as NATURAL JOIN', () => {
  const ast = parser.astify('SELECT * FROM a NATURAL INNER JOIN b');
  assertType(isSelect, ast);
  assert.strictEqual(ast.from[1].join, 'NATURAL JOIN');
});

test('NATURAL JOIN keeps table aliases', () => {
  const ast = parser.astify('SELECT * FROM a AS t1 NATURAL JOIN db2.b AS t2');
  assertType(isSelect, ast);
  assert.strictEqual(ast.from[0].as, 't1');
  assert.strictEqual(ast.from[1].table, 'b');
  assert.strictEqual(ast.from[1].db, 'db2');
  assert.strictEqual(ast.from[1].as, 't2');
  assert.strictEqual(ast.from[1].join, 'NATURAL JOIN');
});

test('NATURAL JOIN followed by an ON join keeps both joins in order', () => {
  const ast = parser.astify('SELECT * FROM a NATURAL JOIN b JOIN c ON b.id = c.b_id');
  assertType(isSelect, ast);
  assert.strictEqual(ast.from[1].join, 'NATURAL JOIN');
  assert.strictEqual(ast.from[1].on, undefined);
  assert.strictEqual(ast.from[2].join, 'INNER JOIN');
  assert.strictEqual(ast.from[2].on.operator, '=');
});

test('NATURAL JOIN sqlify', () => {
  const out = parser.sqlify(parser.astify('SELECT * FROM a NATURAL LEFT JOIN b'));
  assert.ok(out.includes('FROM `a` NATURAL LEFT JOIN `b`'), out);
  assertType(isSelect, parser.astify(out));
});

test('NATURAL JOIN rejects ON, USING, CROSS, and a bare OUTER', () => {
  assertRejected('SELECT * FROM a NATURAL JOIN b ON a.x = b.x');
  assertRejected('SELECT * FROM a NATURAL JOIN b USING (x)');
  assertRejected('SELECT * FROM a NATURAL CROSS JOIN b');
  assertRejected('SELECT * FROM a NATURAL OUTER JOIN b');
});
