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

declare class Session implements Session$1 {
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
    deleteTempTable(database: string, table: string): void;
    dropTempTable(database: string, table?: string): void;
    query(params: any, values?: any, done?: any): void;
    _query(opts: any, done: any): Promise<void>;
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

export { createPool, createSession, escape, escapeId };
