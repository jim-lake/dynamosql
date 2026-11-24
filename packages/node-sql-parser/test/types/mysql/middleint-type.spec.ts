import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

test('MIDDLEINT maps to MEDIUMINT in column definition', () => {
  const ast = parser.astify('CREATE TABLE t (a MIDDLEINT)', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  assert.equal(ast.create_definitions[0].definition.dataType, 'MEDIUMINT');
});

test('MIDDLEINT(n) maps to MEDIUMINT with display width', () => {
  const ast = parser.astify('CREATE TABLE t (a MIDDLEINT(5))', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  assert.equal(ast.create_definitions[0].definition.dataType, 'MEDIUMINT');
});

test('MIDDLEINT UNSIGNED maps to MEDIUMINT', () => {
  const ast = parser.astify('CREATE TABLE t (a MIDDLEINT UNSIGNED)', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  assert.equal(ast.create_definitions[0].definition.dataType, 'MEDIUMINT');
});
