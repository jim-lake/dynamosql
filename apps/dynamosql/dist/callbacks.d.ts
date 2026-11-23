import * as sql_escaper from 'sql-escaper';
import { EventEmitter } from 'node:events';
import { SessionConfig, createSession } from './dynamosql';
export { SQLError, SessionConfig, Types, createSession, escape, escapeId, format, raw } from './dynamosql';
import { ReadableOptions, Readable } from 'node:stream';

interface IndexError extends Error {
    index?: number;
}
interface ErrorInput {
    err?: string;
    code?: string;
    errno?: number;
    sqlMessage?: string;
    message?: string;
    args?: unknown[];
    cause?: unknown;
    index?: number;
}
declare class SQLError extends Error {
    readonly code: string;
    readonly errno: number;
    sqlState?: string;
    fieldCount?: number;
    fatal: boolean;
    sqlMessage?: string;
    sql?: string;
    index: number;
    constructor(arg: string | ErrorInput | IndexError, sql?: string);
}

type QueryError = SQLError;
/** @deprecated Use QueryError. */
type MysqlError = QueryError;
declare enum Types {
    DECIMAL = 0,// aka DECIMAL (http://dev.mysql.com/doc/refman/5.0/en/precision-math-decimal-changes.html)
    TINY = 1,
    SHORT = 2,
    LONG = 3,
    FLOAT = 4,
    DOUBLE = 5,
    NULL = 6,// NULL (used for prepared statements, I think)
    TIMESTAMP = 7,
    LONGLONG = 8,// aka BIGINT, 8 bytes
    INT24 = 9,// aka MEDIUMINT, 3 bytes
    DATE = 10,
    TIME = 11,
    DATETIME = 12,
    YEAR = 13,// aka YEAR, 1 byte (don't ask)
    NEWDATE = 14,// aka ?
    VARCHAR = 15,// aka VARCHAR (?)
    BIT = 16,// aka BIT, 1-8 byte
    TIMESTAMP2 = 17,// aka TIMESTAMP with fractional seconds
    DATETIME2 = 18,// aka DATETIME with fractional seconds
    TIME2 = 19,// aka TIME with fractional seconds
    JSON = 245,
    NEWDECIMAL = 246,// aka DECIMAL
    ENUM = 247,
    SET = 248,
    TINY_BLOB = 249,
    MEDIUM_BLOB = 250,
    LONG_BLOB = 251,
    BLOB = 252,
    VAR_STRING = 253,// aka VARCHAR, VARBINARY
    STRING = 254,// aka CHAR, BINARY
    GEOMETRY = 255
}
interface UntypedFieldInfo {
    catalog: string;
    db: string;
    table: string;
    orgTable: string;
    name: string;
    orgName: string;
    charsetNr: number;
    length: number;
    flags: number;
    decimals: number;
    default?: string | undefined;
    zerofill: boolean;
    protocol41: boolean;
}
interface FieldInfo extends UntypedFieldInfo {
    type: Types;
}
type TypeCast = boolean | ((field: UntypedFieldInfo & {
    type: string;
    length: number;
    string(): null | string;
    buffer(): null | Buffer;
}, next: () => any) => any);
interface QueryOptions {
    sql: string;
    values?: any;
    timeout?: number;
    nestTables?: boolean | string;
    typeCast?: TypeCast | undefined;
}
type QueryCallback = (err: QueryError | null, results?: any, fields?: FieldInfo[] | FieldInfo[][]) => void;
interface Query {
    sql: string;
    values?: string[] | undefined;
    typeCast?: TypeCast | undefined;
    nestedTables: boolean | string;
    start(): void;
    stream(options?: ReadableOptions): Readable;
    on(ev: string, callback: (...args: any[]) => void): Query;
    on(ev: 'result', callback: (row: any, index: number) => void): Query;
    on(ev: 'error', callback: (err: QueryError) => void): Query;
    on(ev: 'fields', callback: (fields: FieldInfo[], index: number) => void): Query;
    on(ev: 'packet', callback: (packet: any) => void): Query;
    on(ev: 'end', callback: () => void): Query;
}
interface QueryFunction {
    (options: string | QueryOptions, callback?: QueryCallback): Query;
    (options: string | QueryOptions, values: any, callback?: QueryCallback): Query;
}
interface EscapeFunctions {
    escape(value: any, stringifyObjects?: boolean, timeZone?: string): string;
    escapeId(value: string, forbidQualified?: boolean): string;
    format(sql: string, values?: any[], stringifyObjects?: boolean, timeZone?: string): string;
}
interface PoolConnection extends Connection {
    release(): void;
}
interface Connection extends EscapeFunctions, EventEmitter {
    state: 'connected' | 'authenticated' | 'disconnected' | 'protocol_error' | string;
    threadId: number | null;
    createQuery: QueryFunction;
    query: QueryFunction;
    end(callback?: (err?: QueryError) => void): void;
    end(options: any, callback: (err?: QueryError) => void): void;
    destroy(): void;
}
interface ResultSetHeader {
    affectedRows: number;
    fieldCount: number;
    info: string;
    insertId: number;
    serverStatus: number;
    warningStatus: number;
    changedRows: number;
}
/** @deprecated Use ResultSetHeader. */
type OkPacket = ResultSetHeader;

type PoolConfig = SessionConfig;
declare class Pool extends EventEmitter {
    readonly config: SessionConfig;
    readonly escape: (value: sql_escaper.SqlValue, stringifyObjects?: boolean, timezone?: sql_escaper.Timezone, sqlMode?: sql_escaper.SqlMode) => string;
    readonly escapeId: (value: sql_escaper.SqlValue, forbidQualified?: boolean) => string;
    readonly format: (sql: string, values?: sql_escaper.SqlValue | sql_escaper.SqlValue[], stringifyObjects?: boolean, timezone?: sql_escaper.Timezone, sqlMode?: sql_escaper.SqlMode) => string;
    constructor(args: PoolConfig);
    end(done?: (err?: QueryError) => void): void;
    getConnection(done: (err: QueryError | null, connection?: PoolConnection) => void): void;
    query(params: string | QueryOptions, values?: unknown, done?: QueryCallback): Query;
}
declare const createConnection: typeof createSession;
declare function createPool(args?: PoolConfig): Pool;
declare const createPoolCluster: typeof createPool;

export { Pool, createConnection, createPool, createPoolCluster };
export type { Connection, FieldInfo, MysqlError, OkPacket, PoolConfig, PoolConnection, QueryCallback, QueryError, QueryOptions, ResultSetHeader, QueryCallback as queryCallback };
