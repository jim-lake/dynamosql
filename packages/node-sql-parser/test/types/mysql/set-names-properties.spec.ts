import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isSetNames } from './types.guard.ts';
import type { SetNames } from '../../types.d.ts';

const parser = new Parser();

function parseSetNames(sql: string): SetNames {
  const ast = parser.astify(sql);
  assertType(isSetNames, ast, sql);
  return ast as SetNames;
}

function assertRejected(sql: string) {
  assert.throws(() => parser.astify(sql), undefined, sql);
}

test('SET NAMES with bare charset has no collation', () => {
  const ast = parseSetNames('SET NAMES utf8mb4');
  assert.strictEqual(ast.type, 'set');
  assert.strictEqual(ast.keyword, 'names');
  assert.strictEqual(ast.charset, 'utf8mb4');
  assert.strictEqual(ast.collate, null);
});

test('SET NAMES with single-quoted charset strips the quotes', () => {
  const ast = parseSetNames("SET NAMES 'utf8mb4'");
  assert.strictEqual(ast.charset, 'utf8mb4');
  assert.strictEqual(ast.collate, null);
});

test('SET NAMES with quoted charset and collation strips both quotes', () => {
  const ast = parseSetNames("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_bin'");
  assert.strictEqual(ast.keyword, 'names');
  assert.strictEqual(ast.charset, 'utf8mb4');
  assert.strictEqual(ast.collate, 'utf8mb4_bin');
});

test('SET NAMES with double-quoted charset and collation strips both quotes', () => {
  const ast = parseSetNames('SET NAMES "utf8mb4" COLLATE "utf8mb4_bin"');
  assert.strictEqual(ast.charset, 'utf8mb4');
  assert.strictEqual(ast.collate, 'utf8mb4_bin');
});

test('SET NAMES with unquoted charset and collation', () => {
  const ast = parseSetNames('SET NAMES utf8mb4 COLLATE utf8mb4_bin');
  assert.strictEqual(ast.charset, 'utf8mb4');
  assert.strictEqual(ast.collate, 'utf8mb4_bin');
});

test('SET NAMES without a charset is rejected (MySQL 8.4 also rejects it)', () => {
  assertRejected('SET NAMES');
});
