import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isSelect, isFunction, isBinary, isAggrFunc, isJsonTable, isJsonOnClause } from './types.guard.ts';

const parser = new Parser();

function parseColumnExpr(sql: string) {
  const ast = parser.astify(sql);
  assertType(isSelect, ast);
  return ast.columns[0].expr;
}

function assertRejected(sql: string) {
  assert.throws(() => parser.astify(sql), undefined, sql);
}

test('JSON_VALUE RETURNING type', () => {
  const expr = parseColumnExpr(`SELECT JSON_VALUE('{"a":1}', '$.a' RETURNING CHAR(10)) AS v`);
  assertType(isFunction, expr);
  assert.deepStrictEqual(expr.returning, { type: 'datatype', dataType: 'CHAR', length: 10, parentheses: true, suffix: null });
  assert.strictEqual(expr.on_empty, null);
  assert.strictEqual(expr.on_error, null);
});

test('JSON_VALUE RETURNING SIGNED INTEGER and UNSIGNED INTEGER', () => {
  const signed = parseColumnExpr(`SELECT JSON_VALUE('1', '$' RETURNING SIGNED INTEGER) AS v`);
  assertType(isFunction, signed);
  assert.strictEqual(signed.returning.dataType, 'SIGNED INTEGER');
  const unsigned = parseColumnExpr(`SELECT JSON_VALUE('1', '$' RETURNING UNSIGNED) AS v`);
  assertType(isFunction, unsigned);
  assert.strictEqual(unsigned.returning.dataType, 'UNSIGNED');
});

test('JSON_VALUE keeps its two arguments', () => {
  const expr = parseColumnExpr(`SELECT JSON_VALUE(doc, '$.a') AS v`);
  assertType(isFunction, expr);
  assert.strictEqual(expr.args.value.length, 2);
});

test('JSON_VALUE ON EMPTY and ON ERROR with DEFAULT and NULL', () => {
  const expr = parseColumnExpr(`SELECT JSON_VALUE('{}', '$.a' DEFAULT 'x' ON EMPTY NULL ON ERROR) AS v`);
  assertType(isFunction, expr);
  assertType(isJsonOnClause, expr.on_empty);
  assert.strictEqual(expr.on_empty.type, 'on empty');
  assert.strictEqual(expr.on_empty.behavior, 'DEFAULT');
  assert.strictEqual(expr.on_empty.value.value, 'x');
  assertType(isJsonOnClause, expr.on_error);
  assert.deepStrictEqual(expr.on_error, { type: 'on error', behavior: 'NULL', value: null });
});

test('JSON_VALUE ON ERROR alone and ON EMPTY ERROR', () => {
  const onError = parseColumnExpr(`SELECT JSON_VALUE('{}', '$.a' ERROR ON ERROR) AS v`);
  assertType(isFunction, onError);
  assert.strictEqual(onError.on_empty, null);
  assert.strictEqual(onError.on_error.behavior, 'ERROR');
  const onEmpty = parseColumnExpr(`SELECT JSON_VALUE('{}', '$.a' DEFAULT -5 ON EMPTY) AS v`);
  assertType(isFunction, onEmpty);
  assert.strictEqual(onEmpty.on_empty.type, 'on empty');
  assert.strictEqual(onEmpty.on_empty.value.type, 'number');
  assert.strictEqual(onEmpty.on_empty.value.value, -5);
});

test('JSON_VALUE DEFAULT accepts strings, booleans, numbers, and hex literals', () => {
  for (const literal of [`'x'`, 'TRUE', 'FALSE', '1.5', '-1.5e3', `X'41'`]) {
    const expr = parseColumnExpr(`SELECT JSON_VALUE('{}', '$.a' DEFAULT ${literal} ON EMPTY) AS v`);
    assertType(isFunction, expr, literal);
    assert.strictEqual(expr.on_empty.behavior, 'DEFAULT');
  }
});

test('JSON_VALUE rejects ON ERROR before ON EMPTY and repeated clauses', () => {
  assertRejected(`SELECT JSON_VALUE('{}', '$.a' NULL ON ERROR ERROR ON EMPTY) AS v`);
  assertRejected(`SELECT JSON_VALUE('{}', '$.a' NULL ON EMPTY NULL ON EMPTY) AS v`);
  assertRejected(`SELECT JSON_VALUE('{}', '$.a' NULL ON ERROR NULL ON ERROR) AS v`);
});

test('JSON_VALUE rejects DEFAULT NULL and DEFAULT with COLLATE', () => {
  assertRejected(`SELECT JSON_VALUE('{}', '$.a' DEFAULT NULL ON EMPTY) AS v`);
  assertRejected(`SELECT JSON_VALUE('{}', '$.a' DEFAULT 'x' COLLATE utf8mb4_bin ON EMPTY) AS v`);
});

test('JSON_VALUE sqlify keeps RETURNING and ON clauses', () => {
  const sql = `SELECT JSON_VALUE('{"a":1}', '$.a' RETURNING CHAR(10) DEFAULT 'x' ON EMPTY NULL ON ERROR) AS v FROM t`;
  const out = parser.sqlify(parser.astify(sql));
  assert.ok(out.includes(`RETURNING CHAR(10) DEFAULT 'x' ON EMPTY NULL ON ERROR`), out);
  assertType(isSelect, parser.astify(out));
});

test('MEMBER OF is a binary comparison', () => {
  const ast = parser.astify('SELECT * FROM t WHERE 1 MEMBER OF(t.j)');
  assertType(isSelect, ast);
  assertType(isBinary, ast.where);
  assert.strictEqual(ast.where.operator, 'MEMBER OF');
  assert.strictEqual(ast.where.right.type, 'expr_list');
  assert.strictEqual(ast.where.right.parentheses, true);
});

test('MEMBER OF accepts a parenthesized JSON expression', () => {
  const expr = parseColumnExpr(`SELECT 'a' MEMBER OF(CAST('["a"]' AS JSON)) AS v`);
  assertType(isBinary, expr);
  assert.strictEqual(expr.operator, 'MEMBER OF');
});

test('MEMBER OF sqlify', () => {
  const out = parser.sqlify(parser.astify('SELECT * FROM t WHERE 1 MEMBER OF(t.j)'));
  assert.ok(out.includes('1 MEMBER OF (`t`.`j`)'), out);
});

test('MEMBER OF requires parentheses', () => {
  assertRejected('SELECT 1 MEMBER j FROM t');
  assertRejected('SELECT 1 MEMBER OF j FROM t');
});

test('MEMBER OF and comparison operators fold left to right', () => {
  const expr = parseColumnExpr(`SELECT 1 MEMBER OF('[1]') = 1 IS TRUE AS v`);
  assertType(isBinary, expr);
  assert.strictEqual(expr.operator, 'IS');
  assertType(isBinary, expr.left);
  assert.strictEqual(expr.left.operator, '=');
  assert.strictEqual(expr.left.left.operator, 'MEMBER OF');
  assert.strictEqual(expr.left.left.right.type, 'expr_list');
});

test('MEMBER OF chains sqlify back to the same shape', () => {
  const sql = `SELECT 1 MEMBER OF('[1]') = 1 IS TRUE FROM t`;
  const out = parser.sqlify(parser.astify(sql));
  assert.ok(out.includes(`MEMBER OF ('[1]') = 1 IS TRUE`), out);
  assertType(isSelect, parser.astify(out));
});

test('SUM, AVG, MIN, and MAX accept DISTINCT', () => {
  for (const fn of ['SUM', 'AVG', 'MIN', 'MAX']) {
    const expr = parseColumnExpr(`SELECT ${fn}(DISTINCT a) AS v FROM t`);
    assertType(isAggrFunc, expr, fn);
    assert.strictEqual(expr.args.distinct, 'DISTINCT');
    assert.strictEqual(expr.args.expr.column, 'a');
  }
});

test('SUM without DISTINCT has no distinct key', () => {
  const expr = parseColumnExpr('SELECT SUM(a) AS v FROM t');
  assertType(isAggrFunc, expr);
  assert.strictEqual('distinct' in expr.args, false);
});

test('SUM DISTINCT sqlify', () => {
  const out = parser.sqlify(parser.astify('SELECT SUM(DISTINCT a) FROM t'));
  assert.ok(out.includes('SUM(DISTINCT `a`)'), out);
});

test('JSON_ARRAYAGG is an aggregate', () => {
  const expr = parseColumnExpr('SELECT JSON_ARRAYAGG(a) AS v FROM t');
  assertType(isAggrFunc, expr);
  assert.strictEqual(expr.name, 'JSON_ARRAYAGG');
  assert.strictEqual(expr.args.expr.column, 'a');
});

test('JSON_ARRAYAGG with OVER', () => {
  const expr = parseColumnExpr('SELECT JSON_ARRAYAGG(a) OVER () AS v FROM t');
  assertType(isAggrFunc, expr);
  assert.strictEqual(expr.over.type, 'window');
});

test('JSON_OBJECTAGG takes a key and a value', () => {
  const expr = parseColumnExpr('SELECT JSON_OBJECTAGG(k, v) AS v FROM t');
  assertType(isAggrFunc, expr);
  assert.strictEqual(expr.name, 'JSON_OBJECTAGG');
  assert.strictEqual(expr.args.expr.type, 'expr_list');
  assert.deepStrictEqual(expr.args.expr.value.map((e: { column: string }) => e.column), ['k', 'v']);
});

test('JSON aggregates sqlify', () => {
  const out = parser.sqlify(parser.astify('SELECT JSON_ARRAYAGG(a), JSON_OBJECTAGG(k, v) FROM t'));
  assert.ok(out.includes('JSON_ARRAYAGG(`a`)'), out);
  assert.ok(out.includes('JSON_OBJECTAGG(`k`, `v`)'), out);
});

test('JSON aggregates reject forms MySQL 8.4 rejects', () => {
  assertRejected('SELECT JSON_ARRAYAGG(*) FROM t');
  assertRejected('SELECT JSON_ARRAYAGG(t.*) FROM t');
  assertRejected('SELECT JSON_ARRAYAGG(DISTINCT a) FROM t');
  assertRejected('SELECT JSON_ARRAYAGG(a ORDER BY a) FROM t');
  assertRejected('SELECT JSON_OBJECTAGG(k) FROM t');
  assertRejected('SELECT JSON_OBJECTAGG(*, v) FROM t');
});

test('JSON_TABLE in FROM with ordinality, EXISTS PATH, and NESTED PATH columns', () => {
  const ast = parser.astify(`SELECT * FROM JSON_TABLE('[1]', '$[*]' COLUMNS (
    rn FOR ORDINALITY,
    a INT PATH '$.a' DEFAULT '9' ON EMPTY NULL ON ERROR,
    e INT EXISTS PATH '$.e',
    NESTED PATH '$.n[*]' COLUMNS (x VARCHAR(5) PATH '$.x')
  )) AS jt`);
  assertType(isSelect, ast);
  const table = ast.from[0];
  assert.strictEqual(table.as, 'jt');
  assertType(isJsonTable, table.expr);
  assert.strictEqual(table.expr.path.value, '$[*]');
  const [ordinality, column, existsColumn, nested] = table.expr.columns;
  assert.deepStrictEqual(ordinality, { type: 'ordinality', name: 'rn' });
  assert.strictEqual(column.type, 'column');
  assert.strictEqual(column.name, 'a');
  assert.strictEqual(column.datatype.dataType, 'INT');
  assert.strictEqual(column.exists, false);
  assert.strictEqual(column.path.value, '$.a');
  assert.strictEqual(column.on_empty.behavior, 'DEFAULT');
  assert.strictEqual(column.on_error.behavior, 'NULL');
  assert.strictEqual(existsColumn.exists, true);
  assert.strictEqual(existsColumn.on_empty, null);
  assert.strictEqual(nested.type, 'nested');
  assert.strictEqual(nested.path.value, '$.n[*]');
  assert.strictEqual(nested.columns[0].name, 'x');
  assert.strictEqual(nested.columns[0].datatype.length, 5);
});

test('JSON_TABLE column ON clauses may appear in either order', () => {
  const ast = parser.astify(`SELECT * FROM JSON_TABLE('[1]', '$[*]' COLUMNS (a INT PATH '$.a' NULL ON ERROR ERROR ON EMPTY)) jt`);
  const column = ast.from[0].expr.columns[0];
  assert.strictEqual(column.on_empty.behavior, 'ERROR');
  assert.strictEqual(column.on_error.behavior, 'NULL');
});

test('JSON_TABLE rejects repeated ON clauses and a missing alias', () => {
  assertRejected(`SELECT * FROM JSON_TABLE('[1]', '$[*]' COLUMNS (a INT PATH '$.a' NULL ON ERROR NULL ON ERROR)) jt`);
  assertRejected(`SELECT * FROM JSON_TABLE('[1]', '$[*]' COLUMNS (a INT PATH '$.a'))`);
  assertRejected(`SELECT * FROM JSON_TABLE('[1]', '$[*]' COLUMNS (n INT NESTED '$.x' COLUMNS (y INT PATH '$.y'))) jt`);
});

test('JSON_TABLE with a join and column references', () => {
  const ast = parser.astify('SELECT jt.a FROM t JOIN JSON_TABLE(t.j, \'$[*]\' COLUMNS (a INT PATH \'$.a\')) jt ON jt.a = t.id');
  assertType(isSelect, ast);
  assert.strictEqual(ast.from[1].join, 'INNER JOIN');
  assertType(isJsonTable, ast.from[1].expr);
});

test('JSON_TABLE sqlify round trip', () => {
  const sql = `SELECT * FROM JSON_TABLE('[1]', '$[*]' COLUMNS (rn FOR ORDINALITY, a INT EXISTS PATH '$.a' NULL ON ERROR, NESTED PATH '$.n[*]' COLUMNS (x INT PATH '$.x'))) AS jt`;
  const out = parser.sqlify(parser.astify(sql));
  assert.ok(out.includes('FOR ORDINALITY'), out);
  assert.ok(out.includes('EXISTS PATH'), out);
  assert.ok(out.includes('NESTED PATH'), out);
  assertType(isSelect, parser.astify(out));
});
