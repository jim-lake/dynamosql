import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

test('CHARACTER(n) is CHAR', () => {
  const ast = parser.astify('CREATE TABLE t (a CHARACTER(3))', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  assert.strictEqual(ast.create_definitions[0].definition.dataType, 'CHAR');
});
