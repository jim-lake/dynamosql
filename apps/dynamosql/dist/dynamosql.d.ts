import { EventEmitter } from 'node:events';
import { ReadableOptions, Readable } from 'node:stream';

interface ErrorInput {
    err?: string;
    code?: string;
    errno?: number;
    sqlMessage?: string;
    message?: string;
    args?: any[];
    cause?: Error;
    index?: number;
}
declare class SQLError extends Error {
    code: string;
    errno: number;
    sqlStateMarker?: string;
    sqlState?: string;
    fieldCount?: number;
    fatal: boolean;
    sqlMessage?: string;
    sql?: string;
    index: number;
    constructor(err: string | ErrorInput, sql?: string);
}

type MysqlError = SQLError;
declare const enum Types {
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
    zeroFill: boolean;
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
type QueryCallback = (err: MysqlError | null, results?: any, fields?: FieldInfo[]) => void;
interface Query {
    sql: string;
    values?: string[] | undefined;
    typeCast?: TypeCast | undefined;
    nestedTables: boolean | string;
    start(): void;
    stream(options?: ReadableOptions): Readable;
    on(ev: string, callback: (...args: any[]) => void): Query;
    on(ev: 'result', callback: (row: any, index: number) => void): Query;
    on(ev: 'error', callback: (err: MysqlError) => void): Query;
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
interface SessionConfig {
    region?: string | undefined;
    database?: string | undefined;
    multipleStatements?: boolean | undefined;
    resultObjects?: boolean | undefined;
    typeCast?: TypeCast | undefined;
    dateStrings?: boolean | Array<'TIMESTAMP' | 'DATETIME' | 'DATE'> | undefined;
}
interface PoolConnection extends Connection {
    release(): void;
}
interface Connection extends EscapeFunctions, EventEmitter {
    state: 'connected' | 'authenticated' | 'disconnected' | 'protocol_error' | string;
    threadId: number | null;
    createQuery: QueryFunction;
    query: QueryFunction;
    end(callback?: (err?: MysqlError) => void): void;
    end(options: any, callback: (err?: MysqlError) => void): void;
    destroy(): void;
}
interface OkPacket {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    serverStatus?: number;
    warningCount?: number;
    message: string;
    changedRows: number;
    protocol41: boolean;
}

type PoolConfig = SessionConfig;
declare function createPool$1(args?: PoolConfig): Pool;
declare class Pool extends EventEmitter {
    config: SessionConfig;
    escape: any;
    escapeId: any;
    format: any;
    constructor(args: PoolConfig);
    end(done?: (err?: MysqlError) => void): void;
    getConnection(done: (err: MysqlError | null, connection?: PoolConnection) => void): void;
    query(opts: string | QueryOptions, values?: any, done?: QueryCallback): Query;
}

declare function createSession$1(args?: SessionConfig): PoolConnection;

declare const createConnection: typeof createSession$1;
declare const createPool: typeof createPool$1;
declare const createPoolCluster: typeof createPool$1;
declare const createSession: typeof createSession$1;
declare const escape: EscapeFunctions["escape"];
declare const escapeId: EscapeFunctions["escapeId"];
declare const format: EscapeFunctions["format"];
declare const raw: any;

export { SQLError, Types, createConnection, createPool, createPoolCluster, createSession, escape, escapeId, format, raw };
export type { Connection, FieldInfo, MysqlError, OkPacket, PoolConfig, QueryCallback, QueryOptions, SessionConfig, QueryCallback as queryCallback };
