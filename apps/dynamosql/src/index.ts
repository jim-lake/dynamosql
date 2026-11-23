import * as SqlString from 'sql-escaper';

import { Session, createSession } from './session';

import type { SessionConfig } from './session';
import type { QueryListResult, QueryOptions } from './types';

export type {
  QueryError,
  FieldInfo,
  ResultSetHeader,
  QueryOptions,
  QueryCallback,
} from './types';
// eslint-disable-next-line @typescript-eslint/no-deprecated -- deprecated alias kept for consumers
export type { MysqlError, OkPacket } from './types';
export type { SessionConfig } from './session';
export { SQLError } from './error';
export { Types } from './types';
export { createSession };

export const escape = SqlString.escape;
export const escapeId = SqlString.escapeId;
export const format = SqlString.format;
export const raw = SqlString.raw;

export class Connection {
  public readonly threadId: number;
  public readonly escape = SqlString.escape;
  public readonly escapeId = SqlString.escapeId;
  public readonly format = SqlString.format;

  protected readonly session: Session;

  constructor(session: Session) {
    this.session = session;
    this.threadId = session.threadId;
  }

  query(
    sql: string | QueryOptions,
    values?: unknown
  ): Promise<QueryListResult> {
    return this.session.runQuery(sql, values);
  }

  end(): Promise<void> {
    this.session.end();
    return Promise.resolve();
  }

  destroy(): void {
    this.session.destroy();
  }
}

export class PoolConnection extends Connection {
  release(): void {
    this.session.release();
  }
}

export class Pool {
  public readonly config: SessionConfig;
  public readonly escape = SqlString.escape;
  public readonly escapeId = SqlString.escapeId;
  public readonly format = SqlString.format;

  constructor(config: SessionConfig) {
    this.config = config;
  }

  getConnection(): Promise<PoolConnection> {
    return Promise.resolve(new PoolConnection(new Session(this.config)));
  }

  async query(
    sql: string | QueryOptions,
    values?: unknown
  ): Promise<QueryListResult> {
    const connection = await this.getConnection();
    try {
      return await connection.query(sql, values);
    } finally {
      connection.release();
    }
  }

  end(): Promise<void> {
    return Promise.resolve();
  }
}

export function createConnection(config?: SessionConfig): Promise<Connection> {
  return Promise.resolve(new Connection(new Session(config)));
}

export function createPool(config?: SessionConfig): Pool {
  return new Pool(config ?? {});
}
