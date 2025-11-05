interface PoolOptions {
    database?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    resultObjects?: boolean;
    typeCast?: boolean;
    dateStrings?: boolean;
    multipleStatements?: boolean;
}
type QueryCallback = (error: Error | null, results?: any, fields?: any) => void;
type QueryOptions = string | {
    sql: string;
    timeout?: number;
    values?: any[];
};
declare function createPool$1(args?: PoolOptions): Pool;
declare class Pool {
    private _args;
    escape: any;
    escapeId: any;
    constructor(args: PoolOptions);
    end(done?: () => void): void;
    getSession(done: (err: Error | null, session?: any) => void): void;
    query(opts: QueryOptions, values?: any[] | QueryCallback, done?: QueryCallback): void;
}

declare class Session {
    _typeCastOptions: any;
    _currentDatabase: string | null;
    _localVariables: any;
    _transaction: any;
    _isReleased: boolean;
    _multipleStatements: boolean;
    _tempTableMap: any;
    _typeCast: boolean;
    _dateStrings: boolean;
    _resultObjects: boolean;
    escape: any;
    escapeId: any;
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
    dropTempTable(database: string, table?: string): void;
    query(params: any, values?: any, done?: any): void;
    _query(opts: any, done: any): void;
    _singleQuery(ast: any, done: any): void;
    _transformResult(list: any, columns: any, opts: any): void;
    _convertCell(value: any, column: any): any;
}
declare function createSession$1(args?: any): Session;

declare const LEVEL_NONE = 0;
declare const LEVEL_ERROR = 1;
declare const LEVEL_INFO = 2;
declare const LEVEL_TRACE = 3;
declare function setRemoteLog(func: any): void;
declare function setLogLevel(level: number): void;
declare function error(...args: any[]): any;
declare function info(...args: any[]): any;
declare function trace(...args: any[]): any;
declare function always(...args: any[]): any;
declare function inspect(...args: any[]): void;

declare const logger_LEVEL_ERROR: typeof LEVEL_ERROR;
declare const logger_LEVEL_INFO: typeof LEVEL_INFO;
declare const logger_LEVEL_NONE: typeof LEVEL_NONE;
declare const logger_LEVEL_TRACE: typeof LEVEL_TRACE;
declare const logger_always: typeof always;
declare const logger_error: typeof error;
declare const logger_info: typeof info;
declare const logger_inspect: typeof inspect;
declare const logger_setLogLevel: typeof setLogLevel;
declare const logger_setRemoteLog: typeof setRemoteLog;
declare const logger_trace: typeof trace;
declare namespace logger {
  export {
    logger_LEVEL_ERROR as LEVEL_ERROR,
    logger_LEVEL_INFO as LEVEL_INFO,
    logger_LEVEL_NONE as LEVEL_NONE,
    logger_LEVEL_TRACE as LEVEL_TRACE,
    logger_always as always,
    logger_error as error,
    logger_info as info,
    logger_inspect as inspect,
    logger_setLogLevel as setLogLevel,
    logger_setRemoteLog as setRemoteLog,
    logger_trace as trace,
  };
}

declare const createPool: typeof createPool$1;
declare const createSession: typeof createSession$1;

declare const escape: any;
declare const escapeId: any;

export { createPool, createSession, escape, escapeId, logger };
