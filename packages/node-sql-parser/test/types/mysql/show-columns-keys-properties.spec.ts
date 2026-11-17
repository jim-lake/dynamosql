import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isShow } from './types.guard.ts';
import type { ShowColumnsIndexes } from '../../../types/mysql';

const parser = new Parser();

function parseFrom(sql: string) {
  const ast = parser.astify(sql);
  assertType(isShow, ast, `isShow: ${sql}`);
  return ast as ShowColumnsIndexes;
}

test('SHOW COLUMNS FROM tbl FROM db sets the db from the second FROM', () => {
  const ast = parseFrom('SHOW COLUMNS FROM users FROM mydb');
  assert.strictEqual(ast.keyword, 'columns');
  assert.strictEqual(ast.from.length, 1);
  assert.strictEqual(ast.from[0].table, 'users');
  assert.strictEqual(ast.from[0].db, 'mydb');
});

test('SHOW COLUMNS FROM tbl IN db sets the db from IN', () => {
  const ast = parseFrom('SHOW COLUMNS FROM users IN mydb');
  assert.strictEqual(ast.keyword, 'columns');
  assert.strictEqual(ast.from[0].table, 'users');
  assert.strictEqual(ast.from[0].db, 'mydb');
});

test('SHOW FULL COLUMNS FROM tbl FROM db keeps FULL and LIKE', () => {
  const ast = parseFrom("SHOW FULL COLUMNS FROM users FROM mydb LIKE 'id%'");
  assert.strictEqual(ast.keyword, 'columns');
  assert.strictEqual(ast.full, 'full');
  assert.strictEqual(ast.from[0].db, 'mydb');
});

test('second FROM replaces a db given on the table name', () => {
  const ast = parseFrom('SHOW COLUMNS FROM other.users FROM mydb');
  assert.strictEqual(ast.from[0].db, 'mydb');
  assert.strictEqual(ast.from[0].table, 'users');
});

test('SHOW COLUMNS FROM tbl without a second FROM keeps db null', () => {
  const ast = parseFrom('SHOW COLUMNS FROM users');
  assert.strictEqual(ast.from[0].db, null);
  assert.strictEqual(ast.from[0].table, 'users');
});

test('SHOW COLUMNS FROM db.tbl keeps the db from the table name', () => {
  const ast = parseFrom('SHOW COLUMNS FROM mydb.users');
  assert.strictEqual(ast.from[0].db, 'mydb');
  assert.strictEqual(ast.from[0].table, 'users');
});

test('SHOW KEYS FROM tbl maps to keyword indexes', () => {
  const ast = parseFrom('SHOW KEYS FROM users');
  assert.strictEqual(ast.keyword, 'indexes');
  assert.strictEqual(ast.from[0].table, 'users');
  assert.strictEqual(ast.from[0].db, null);
});

test('SHOW KEYS FROM tbl FROM db and IN db set the db', () => {
  assert.strictEqual(parseFrom('SHOW KEYS FROM users FROM mydb').from[0].db, 'mydb');
  assert.strictEqual(parseFrom('SHOW KEYS FROM users IN mydb').from[0].db, 'mydb');
});

test('SHOW INDEX and SHOW INDEXES keep their keywords with a second FROM', () => {
  assert.strictEqual(parseFrom('SHOW INDEX FROM users FROM mydb').keyword, 'index');
  assert.strictEqual(parseFrom('SHOW INDEXES FROM users FROM mydb').keyword, 'indexes');
});

test('SHOW KEYS and SHOW INDEXES give the same AST keyword', () => {
  assert.strictEqual(parseFrom('SHOW KEYS FROM users').keyword, parseFrom('SHOW INDEXES FROM users').keyword);
});
