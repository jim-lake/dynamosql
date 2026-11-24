import assert from 'node:assert';
import { test } from 'node:test';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isCreate, isCreateColumnDefinition } from './types.guard.js';

const parser = new Parser();

const cases: [string, string][] = [
  ['REAL', 'CREATE TABLE t (a REAL)'],
  ['DOUBLE PRECISION', 'CREATE TABLE t (a DOUBLE PRECISION)'],
  ['DEC', 'CREATE TABLE t (a DEC(5,2))'],
  ['BOOL', 'CREATE TABLE t (a BOOL)'],
  ['SERIAL', 'CREATE TABLE t (a SERIAL)'],
  ['NCHAR', 'CREATE TABLE t (a NCHAR(3))'],
  ['NVARCHAR', 'CREATE TABLE t (a NVARCHAR(5))'],
  ['CHARACTER VARYING', 'CREATE TABLE t (a CHARACTER VARYING(10))'],
];

for (const [dataType, sql] of cases) {
  test(`dataType ${dataType} is a MysqlType member`, () => {
    const ast = parser.astify(sql);
    assertType(isCreate, ast);
    assertType(isCreateColumnDefinition, ast.create_definitions[0]);
    assert.strictEqual(ast.create_definitions[0].definition.dataType, dataType);
  });
}
