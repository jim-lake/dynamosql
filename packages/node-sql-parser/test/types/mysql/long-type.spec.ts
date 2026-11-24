import { test } from 'node:test';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

test('LONG is MEDIUMTEXT in column definition', () => {
  const ast = parser.astify('CREATE TABLE t (a LONG)', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  if (ast.create_definitions[0].definition.dataType !== 'MEDIUMTEXT') {
    throw new Error(`expected MEDIUMTEXT, got ${ast.create_definitions[0].definition.dataType}`);
  }
});

test('LONG VARCHAR is MEDIUMTEXT in column definition', () => {
  const ast = parser.astify('CREATE TABLE t (a LONG VARCHAR)', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  if (ast.create_definitions[0].definition.dataType !== 'MEDIUMTEXT') {
    throw new Error(`expected MEDIUMTEXT, got ${ast.create_definitions[0].definition.dataType}`);
  }
});
