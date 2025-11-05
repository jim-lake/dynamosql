import type { CommitParams } from '../index';

export * from './ddl';
export * from './delete';
export * from './insert';
export * from './select';
export * from './update';

export function commit(
  params: CommitParams,
  done: (err?: Error) => void
): void {
  done();
}

export function rollback(
  params: CommitParams,
  done: (err?: Error) => void
): void {
  done();
}
