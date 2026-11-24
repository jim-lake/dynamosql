import { test } from 'node:test';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

test('NATIONAL CHAR is CHAR', () => {
  const ast = parser.astify('CREATE TABLE t (a NATIONAL CHAR(3))', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  if (ast.create_definitions[0].definition.dataType !== 'CHAR') {
    throw new Error('expected CHAR');
  }
});

test('NATIONAL VARCHAR is VARCHAR', () => {
  const ast = parser.astify('CREATE TABLE t (a NATIONAL VARCHAR(5))', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  if (ast.create_definitions[0].definition.dataType !== 'VARCHAR') {
    throw new Error('expected VARCHAR');
  }
});
