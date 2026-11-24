import { test } from 'node:test';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

test('FIXED(p,s) is DECIMAL', () => {
  const ast = parser.astify('CREATE TABLE t (a FIXED(5,2))', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  if (ast.create_definitions[0].definition.dataType !== 'DECIMAL') {
    throw new Error(`expected DECIMAL, got ${ast.create_definitions[0].definition.dataType}`);
  }
});
