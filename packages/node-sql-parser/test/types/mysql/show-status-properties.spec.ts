import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isShow } from './types.guard.ts';

const parser = new Parser();

test('SHOW BINARY LOG STATUS', () => {
  const ast = parser.astify('SHOW BINARY LOG STATUS');
  assertType(isShow, ast);
  assert.strictEqual(ast.type, 'show');
  assert.strictEqual(ast.keyword, 'binary');
  assert.strictEqual(ast.suffix, 'status');
});

test('SHOW REPLICA STATUS', () => {
  const ast = parser.astify('SHOW REPLICA STATUS');
  assertType(isShow, ast);
  assert.strictEqual(ast.type, 'show');
  assert.strictEqual(ast.keyword, 'replica');
  assert.strictEqual(ast.suffix, 'status');
});

test('SHOW BINARY LOGS still parses as logs, not status', () => {
  const ast = parser.astify('SHOW BINARY LOGS');
  assertType(isShow, ast);
  assert.strictEqual(ast.keyword, 'binary');
  assert.strictEqual(ast.suffix, 'logs');
});
