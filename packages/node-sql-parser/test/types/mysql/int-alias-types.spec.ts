import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

const cases: Array<[string, string]> = [
  ['INT1', 'TINYINT'],
  ['INT2', 'SMALLINT'],
  ['INT3', 'MEDIUMINT'],
  ['INT8', 'BIGINT'],
];

for (const [alias, expected] of cases) {
  test(`${alias} maps to ${expected} in column definition`, () => {
    const ast = parser.astify(`CREATE TABLE t (a ${alias})`, { database: 'mysql' });
    assertType(isCreate, ast);
    assertType(isCreateColumnDefinition, ast.create_definitions[0]);
    assert.equal(ast.create_definitions[0].definition.dataType, expected);
  });
}

test('INT1(4) maps to TINYINT with display width', () => {
  const ast = parser.astify('CREATE TABLE t (a INT1(4))', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  assert.equal(ast.create_definitions[0].definition.dataType, 'TINYINT');
});

test('INT8 UNSIGNED maps to BIGINT', () => {
  const ast = parser.astify('CREATE TABLE t (a INT8 UNSIGNED)', { database: 'mysql' });
  assertType(isCreate, ast);
  assertType(isCreateColumnDefinition, ast.create_definitions[0]);
  assert.equal(ast.create_definitions[0].definition.dataType, 'BIGINT');
});
