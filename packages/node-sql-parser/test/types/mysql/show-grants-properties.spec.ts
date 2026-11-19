import { test } from 'node:test';
import assert from 'node:assert';
import { assertType } from './assert-type';
import { Parser } from './parser-loader.mjs';
import { isShow } from './types.guard.ts';
import type { ShowGrants } from '../../../types/mysql';

const parser = new Parser();

function parseGrants(sql: string) {
  const ast = parser.astify(sql);
  assertType(isShow, ast, `isShow: ${sql}`);
  return ast as ShowGrants;
}

test('SHOW GRANTS with no FOR clause has for === null', () => {
  const ast = parseGrants('SHOW GRANTS');
  assert.strictEqual(ast.keyword, 'grants');
  assert.strictEqual(ast.for, null);
});

test('SHOW GRANTS FOR user has user and host set and no current_user flag', () => {
  const ast = parseGrants("SHOW GRANTS FOR 'u1'@'localhost'");
  assert.ok(ast.for);
  assert.strictEqual(ast.for.user, 'u1');
  assert.strictEqual(ast.for.host, 'localhost');
  assert.strictEqual(ast.for.role_list, null);
  assert.strictEqual(ast.for.current_user, undefined);
});

test('SHOW GRANTS FOR CURRENT_USER() has user null and current_user with parentheses', () => {
  const ast = parseGrants('SHOW GRANTS FOR CURRENT_USER()');
  assert.ok(ast.for);
  assert.strictEqual(ast.for.user, null);
  assert.strictEqual(ast.for.host, null);
  assert.strictEqual(ast.for.current_user, true);
  assert.strictEqual(ast.for.current_user_parentheses, true);
});

test('SHOW GRANTS FOR CURRENT_USER without parentheses sets current_user_parentheses to false', () => {
  const ast = parseGrants('SHOW GRANTS FOR CURRENT_USER');
  assert.ok(ast.for);
  assert.strictEqual(ast.for.user, null);
  assert.strictEqual(ast.for.current_user, true);
  assert.strictEqual(ast.for.current_user_parentheses, false);
});

test('SHOW GRANTS FOR CURRENT_USER() USING role keeps role_list', () => {
  const ast = parseGrants("SHOW GRANTS FOR CURRENT_USER() USING 'r1', 'r2'");
  assert.ok(ast.for);
  assert.strictEqual(ast.for.current_user, true);
  assert.deepStrictEqual(ast.for.role_list, ['r1', 'r2']);
});
