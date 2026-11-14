import { test } from 'node:test';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isDelete, isTransaction, isSelect, isInsert_Replace, isBinary, isColumnRef, isAlter } from './types.guard.ts';

const parser = new Parser();

test('Transaction.expr.savepoint for SAVEPOINT', () => {
  const ast = parser.astify('SAVEPOINT s1');
  assertType(isTransaction, ast);
});

test('Delete.priority as string[] for DELETE QUICK', () => {
  const ast = parser.astify('DELETE QUICK FROM users WHERE id = 1');
  assertType(isDelete, ast);
  assertType((x: any) => Array.isArray(x.priority) && x.priority[0] === 'quick', ast);
});

test('Delete.using as Array<From> for multi-table DELETE', () => {
  const ast = parser.astify('DELETE FROM t USING t JOIN u ON t.id = u.id');
  assertType(isDelete, ast);
  assertType((x: any) => Array.isArray(x.using) && x.using.length === 2, ast);
});

test('Select.from[0].index_hints for USE INDEX', () => {
  const ast = parser.astify('SELECT * FROM t USE INDEX (i)');
  assertType(isSelect, ast);
  assertType((x: any) => x.from[0].index_hints[0].action === 'USE', ast);
});

test('Select.columns[0].expr as bit_string for 0b101', () => {
  const ast = parser.astify('SELECT 0b101');
  assertType(isSelect, ast);
  assertType((x: any) => x.columns[0].expr.type === 'bit_string' && x.columns[0].expr.value === '101', ast);
});

test('Select.columns[0].expr as date for ODBC {d}', () => {
  const ast = parser.astify("SELECT {d '2020-01-02'}");
  assertType(isSelect, ast);
  assertType((x: any) => x.columns[0].expr.type === 'date', ast);
});

test('Insert.on_duplicate_update.row_alias for AS alias', () => {
  const ast = parser.astify('INSERT INTO t (a) VALUES (1) AS r ON DUPLICATE KEY UPDATE a = r.a');
  assertType(isInsert_Replace, ast);
  assertType((x: any) => x.on_duplicate_update.row_alias.name === 'r', ast);
});

test('Insert.on_duplicate_update.set value as ColumnRef with table alias', () => {
  const ast = parser.astify('INSERT INTO t (a) VALUES (1) AS r ON DUPLICATE KEY UPDATE a = r.a');
  assertType(isInsert_Replace, ast);
  assertType(isColumnRef, ast.on_duplicate_update.set[0].value);
});

test('Alter.expr[0] as ALTER INDEX visibility', () => {
  const ast = parser.astify('ALTER TABLE t ALTER INDEX i INVISIBLE');
  assertType(isAlter, ast);
  assertType((x: any) => x.expr[0].visibility === 'INVISIBLE', ast);
});

test('Select.where as Binary for SOUNDS LIKE', () => {
  const ast = parser.astify('SELECT * FROM t WHERE x SOUNDS LIKE y');
  assertType(isSelect, ast);
  assertType(isBinary, ast.where);
});
