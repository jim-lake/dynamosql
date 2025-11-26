import { SQLError } from '../../../error';
import type { ChangedResult, AffectedResult } from '../index';

export * from './ddl';
export * from './select';

export async function commit(_params: unknown): Promise<void> {}
export async function rollback(_params: unknown): Promise<void> {}
export async function createTable() {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function dropTable() {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function createIndex() {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function deleteIndex() {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function addColumn() {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function singleDelete(): Promise<AffectedResult> {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function multipleDelete(): Promise<AffectedResult> {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function singleUpdate(): Promise<ChangedResult> {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function multipleUpdate(): Promise<ChangedResult> {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
export async function insertRowList(): Promise<ChangedResult> {
  throw new SQLError({
    code: 'ER_DBACCESS_DENIED_ERROR',
    args: ['user', 'information_schema'],
  });
}
