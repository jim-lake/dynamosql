import * as mysql from 'mysql';

import { createSession } from '../../src/session';

import { elapsedMs } from './metrics';

import type { OkPacket } from '../../src/types';

export interface Target {
  readonly name: string;
  readonly tableOptions: string;
  readonly measuresServerMemory: boolean;
  exec(sql: string): Promise<{ affectedRows: number }>;
  stream(
    sql: string,
    onRow: () => void
  ): Promise<{ rows: number; firstRowMs: number | null }>;
  close(): Promise<void>;
}

const MYSQL_MAX_HEAP_BYTES = 2 * 1024 * 1024 * 1024;

async function makeDynamosqlMemory(): Promise<Target> {
  const session = createSession({ resultObjects: false, dateStrings: true });
  return {
    name: 'dynamosql-memory',
    tableOptions: 'ENGINE=MEMORY',
    measuresServerMemory: true,
    exec: (sql) =>
      new Promise((resolve, reject) => {
        session.query({ sql }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve({ affectedRows: (result as OkPacket).affectedRows });
          }
        });
      }),
    stream: (sql, onRow) =>
      new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();
        let rows = 0;
        let firstRowMs: number | null = null;
        const query = session.query({ sql });
        query.on('result', () => {
          if (rows === 0) {
            firstRowMs = elapsedMs(start);
          }
          rows++;
          onRow();
        });
        query.on('error', reject);
        query.on('end', () => resolve({ rows, firstRowMs }));
      }),
    close: async () => {
      session.destroy();
    },
  };
}

async function makeMysqlMemory(): Promise<Target> {
  const conn = mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    charset: 'utf8mb4',
    dateStrings: true,
  });
  await new Promise<void>((resolve, reject) => {
    conn.connect((err) => (err ? reject(err) : resolve()));
  });
  await new Promise<void>((resolve, reject) => {
    const sql = `SET SESSION max_heap_table_size = ${MYSQL_MAX_HEAP_BYTES}`;
    conn.query(sql, (err) => (err ? reject(err) : resolve()));
  });
  return {
    name: 'mysql-memory',
    tableOptions: 'ENGINE=MEMORY',
    measuresServerMemory: false,
    exec: (sql) =>
      new Promise((resolve, reject) => {
        conn.query(sql, (err, result: OkPacket) => {
          if (err) {
            reject(err);
          } else {
            resolve({ affectedRows: result.affectedRows });
          }
        });
      }),
    stream: (sql, onRow) =>
      new Promise((resolve, reject) => {
        const start = process.hrtime.bigint();
        let rows = 0;
        let firstRowMs: number | null = null;
        conn
          .query(sql)
          .on('result', () => {
            if (rows === 0) {
              firstRowMs = elapsedMs(start);
            }
            rows++;
            onRow();
          })
          .on('error', reject)
          .on('end', () => resolve({ rows, firstRowMs }));
      }),
    close: async () => {
      conn.destroy();
    },
  };
}

export const TARGETS: Record<string, () => Promise<Target>> = {
  'dynamosql-memory': makeDynamosqlMemory,
  'mysql-memory': makeMysqlMemory,
};

export async function openTarget(name: string): Promise<Target> {
  const make = TARGETS[name];
  if (!make) {
    throw new Error(
      `unknown target "${name}"; registered: ${Object.keys(TARGETS).join(', ')}`
    );
  }
  return make();
}
