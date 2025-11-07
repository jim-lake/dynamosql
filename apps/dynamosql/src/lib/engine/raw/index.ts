import type { CommitParams } from '../index';

export * from './ddl';
export * from './delete';
export * from './insert';
export * from './select';
export * from './update';

export async function commit(_params: CommitParams): Promise<void> {}

export async function rollback(_params: CommitParams): Promise<void> {}
