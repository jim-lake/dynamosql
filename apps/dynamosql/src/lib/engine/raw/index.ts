import type { CommitParams } from '../index';

export * from './ddl';
export * from './delete';
export * from './insert';
export * from './select';
export * from './update';

export async function commit(params: CommitParams): Promise<void> {}

export async function rollback(params: CommitParams): Promise<void> {}
