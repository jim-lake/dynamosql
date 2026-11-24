import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

test('FLOAT8 column is DOUBLE', () => {
  const ast = parser.astify('CREATE TABLE t (a FLOAT8)', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  assert.strictEqual(ast.create_definitions[0].definition.dataType, 'DOUBLE');
});
