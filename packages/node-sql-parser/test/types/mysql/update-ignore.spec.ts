import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isUpdate, isBinary } from './types.guard.ts';

const parser = new Parser();

function assertRejected(sql: string) {
  assert.throws(() => parser.astify(sql), undefined, sql);
}

test('UPDATE IGNORE sets ignore to "ignore"', () => {
  const ast = parser.astify('UPDATE IGNORE t SET a = 1');
  assertType(isUpdate, ast);
  assert.strictEqual(ast.ignore, 'ignore');
  assert.strictEqual(ast.table[0].table, 't');
  assert.strictEqual(ast.set[0].column, 'a');
  assert.strictEqual(ast.set[0].value.value, 1);
});

test('lowercase update ignore is case-insensitive', () => {
  const ast = parser.astify('update ignore t set a = 1');
  assertType(isUpdate, ast);
  assert.strictEqual(ast.ignore, 'ignore');
});

test('plain UPDATE has ignore set to null', () => {
  const ast = parser.astify('UPDATE t SET a = 1');
  assertType(isUpdate, ast);
  assert.strictEqual(ast.ignore, null);
});

test('a table named ignore_tbl is not mistaken for the IGNORE keyword', () => {
  const ast = parser.astify('UPDATE IGNORE ignore_tbl SET a = 1');
  assertType(isUpdate, ast);
  assert.strictEqual(ast.ignore, 'ignore');
  assert.strictEqual(ast.table[0].table, 'ignore_tbl');
  const plain = parser.astify('UPDATE ignore_tbl SET a = 1');
  assertType(isUpdate, plain);
  assert.strictEqual(plain.ignore, null);
  assert.strictEqual(plain.table[0].table, 'ignore_tbl');
});

test('UPDATE IGNORE keeps WHERE, ORDER BY, and LIMIT', () => {
  const ast = parser.astify('UPDATE IGNORE t SET a = 1 WHERE id = 2 ORDER BY id LIMIT 5');
  assertType(isUpdate, ast);
  assert.strictEqual(ast.ignore, 'ignore');
  assertType(isBinary, ast.where);
  assert.strictEqual(ast.where.operator, '=');
  assert.strictEqual(ast.orderby.length, 1);
  assert.strictEqual(ast.limit.value[0].value, 5);
});

test('UPDATE IGNORE with a database-qualified table keeps the database', () => {
  const ast = parser.astify('UPDATE IGNORE db.t SET a = 1');
  assertType(isUpdate, ast);
  assert.strictEqual(ast.ignore, 'ignore');
  assert.strictEqual(ast.table[0].db, 'db');
  assert.strictEqual(ast.table[0].table, 't');
});

test('UPDATE IGNORE sqlify puts IGNORE after UPDATE', () => {
  const out = parser.sqlify(parser.astify('UPDATE IGNORE t SET a = 1'));
  assert.strictEqual(out, 'UPDATE IGNORE `t` SET `a` = 1');
});

test('UPDATE IGNORE sqlify output reparses with ignore set', () => {
  const out = parser.sqlify(parser.astify('update ignore t set a = .5 where id = 2'));
  const ast = parser.astify(out);
  assertType(isUpdate, ast);
  assert.strictEqual(ast.ignore, 'ignore');
  assert.strictEqual(ast.set[0].value.value, 0.5);
});

test('plain UPDATE sqlify has no IGNORE', () => {
  const out = parser.sqlify(parser.astify('UPDATE t SET a = 1'));
  assert.strictEqual(out, 'UPDATE `t` SET `a` = 1');
});

test('IGNORE must sit directly after UPDATE and must have a table and SET', () => {
  assertRejected('UPDATE IGNORE SET a = 1');
  assertRejected('UPDATE t IGNORE SET a = 1');
  assertRejected('UPDATE IGNORE IGNORE t SET a = 1');
  assertRejected('UPDATE IGNORE t');
  assertRejected('UPDATE IGNORE');
});
