import { EventEmitter } from 'events';

interface ErrorInput {
    err?: string;
    code?: string;
    errno?: number;
    sqlMessage?: string;
    message?: string;
    args?: any[];
    cause?: Error;
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
    constructor(err: string | ErrorInput, sql?: string);
}

type MysqlError = SQLError;
interface FieldInfo {
    catalog: string;
    db: string;
    table: string;
    orgTable: string;
    name: string;
    orgName: string;
    charsetNr: number;
    length: number;
    type: number;
    flags: number;
    decimals: number;
    default?: string;
    zeroFill: boolean;
    protocol41: boolean;
}
interface QueryOptions {
    sql: string;
    values?: any;
    timeout?: number;
    nestTables?: boolean | string;
    typeCast?: boolean | ((field: any, next: () => any) => any);
}
type queryCallback = (err: MysqlError | null, results?: any, fields?: FieldInfo[]) => void;
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

interface PoolOptions {
    database?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    resultObjects?: boolean;
    typeCast?: boolean | ((field: any, next: () => any) => any);
    dateStrings?: boolean | string[];
    multipleStatements?: boolean;
}
declare function createPool$1(args?: PoolOptions): Pool;
declare class Pool extends EventEmitter {
    config: PoolOptions;
    escape: any;
    escapeId: any;
    format: any;
    constructor(args: PoolOptions);
    end(done?: (err?: MysqlError) => void): void;
    getConnection(done: (err: MysqlError | null, connection?: any) => void): void;
    query(opts: string | QueryOptions, values?: any, done?: queryCallback): void;
}

interface Session$1 {
    getCurrentDatabase(): string | null;
    setCurrentDatabase(database: string, done?: () => void): void;
    getVariable(name: string): any;
    setVariable(name: string, value: any): void;
    getTransaction(): any;
    setTransaction(tx: any): void;
    getTempTable(database: string, table: string): any;
    saveTempTable(database: string, table: string, contents: any): void;
    deleteTempTable(database: string, table: string): void;
    dropTempTable(database: string, table?: string): void;
    getTempTableList(): [string, any][];
}

declare class Session extends EventEmitter implements Session$1 {
    config: any;
    state: string;
    threadId: number | null;
    _typeCastOptions: any;
    _currentDatabase: string | null;
    _localVariables: any;
    _transaction: any;
    _isReleased: boolean;
    _multipleStatements: boolean;
    _tempTableMap: any;
    _typeCast: boolean | ((field: any, next: () => any) => any);
    _dateStrings: boolean | string[];
    _resultObjects: boolean;
    escape: any;
    escapeId: any;
    format: any;
    constructor(args?: any);
    release(done?: () => void): void;
    end(done?: () => void): void;
    destroy(): void;
    setCurrentDatabase(database: string, done?: () => void): void;
    getCurrentDatabase(): string;
    setVariable(name: string, value: any): void;
    getVariable(name: string): any;
    getTransaction(): any;
    setTransaction(tx: any): void;
    getTempTableList(): [string, unknown][];
    getTempTable(database: string, table: string): any;
    saveTempTable(database: string, table: string, contents: any): void;
    deleteTempTable(database: string, table: string): void;
    dropTempTable(database: string, table?: string): void;
    query(params: string | QueryOptions, values?: any, done?: queryCallback): void;
    _query(opts: any, done?: queryCallback): Promise<void>;
    _singleQuery(ast: any): Promise<{
        result: any;
        columns: any;
    }>;
    _transformResult(list: any, columns: any, opts: any): void;
    _convertCell(value: any, column: any): any;
}
declare function createSession$1(args?: any): Session;

declare const createPool: typeof createPool$1;
declare const createSession: typeof createSession$1;
declare const escape: any;
declare const escapeId: any;
declare const format: any;

export { SQLError, createPool, createSession, escape, escapeId, format };
export type { FieldInfo, MysqlError, OkPacket, PoolOptions, QueryOptions, queryCallback };
