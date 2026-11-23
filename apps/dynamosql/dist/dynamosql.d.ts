import * as SqlString from 'sql-escaper';
import { AttributeValue, DynamoDBClient, ReturnValuesOnConditionCheckFailure, DescribeTableCommandOutput, BillingMode, ProjectionType } from '@aws-sdk/client-dynamodb';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { EventEmitter } from 'node:events';
import { ReadableOptions, Readable } from 'node:stream';

declare enum COLLATIONS {
    BIG5_CHINESE_CI = 1,
    LATIN2_CZECH_CS = 2,
    DEC8_SWEDISH_CI = 3,
    CP850_GENERAL_CI = 4,
    LATIN1_GERMAN1_CI = 5,
    HP8_ENGLISH_CI = 6,
    KOI8R_GENERAL_CI = 7,
    LATIN1_SWEDISH_CI = 8,
    LATIN2_GENERAL_CI = 9,
    SWE7_SWEDISH_CI = 10,
    ASCII_GENERAL_CI = 11,
    UJIS_JAPANESE_CI = 12,
    SJIS_JAPANESE_CI = 13,
    CP1251_BULGARIAN_CI = 14,
    LATIN1_DANISH_CI = 15,
    HEBREW_GENERAL_CI = 16,
    TIS620_THAI_CI = 18,
    EUCKR_KOREAN_CI = 19,
    LATIN7_ESTONIAN_CS = 20,
    LATIN2_HUNGARIAN_CI = 21,
    KOI8U_GENERAL_CI = 22,
    CP1251_UKRAINIAN_CI = 23,
    GB2312_CHINESE_CI = 24,
    GREEK_GENERAL_CI = 25,
    CP1250_GENERAL_CI = 26,
    LATIN2_CROATIAN_CI = 27,
    GBK_CHINESE_CI = 28,
    CP1257_LITHUANIAN_CI = 29,
    LATIN5_TURKISH_CI = 30,
    LATIN1_GERMAN2_CI = 31,
    ARMSCII8_GENERAL_CI = 32,
    UTF8_GENERAL_CI = 33,
    CP1250_CZECH_CS = 34,
    UCS2_GENERAL_CI = 35,
    CP866_GENERAL_CI = 36,
    KEYBCS2_GENERAL_CI = 37,
    MACCE_GENERAL_CI = 38,
    MACROMAN_GENERAL_CI = 39,
    CP852_GENERAL_CI = 40,
    LATIN7_GENERAL_CI = 41,
    LATIN7_GENERAL_CS = 42,
    MACCE_BIN = 43,
    CP1250_CROATIAN_CI = 44,
    UTF8MB4_GENERAL_CI = 45,
    UTF8MB4_BIN = 46,
    LATIN1_BIN = 47,
    LATIN1_GENERAL_CI = 48,
    LATIN1_GENERAL_CS = 49,
    CP1251_BIN = 50,
    CP1251_GENERAL_CI = 51,
    CP1251_GENERAL_CS = 52,
    MACROMAN_BIN = 53,
    UTF16_GENERAL_CI = 54,
    UTF16_BIN = 55,
    UTF16LE_GENERAL_CI = 56,
    CP1256_GENERAL_CI = 57,
    CP1257_BIN = 58,
    CP1257_GENERAL_CI = 59,
    UTF32_GENERAL_CI = 60,
    UTF32_BIN = 61,
    UTF16LE_BIN = 62,
    BINARY = 63,
    ARMSCII8_BIN = 64,
    ASCII_BIN = 65,
    CP1250_BIN = 66,
    CP1256_BIN = 67,
    CP866_BIN = 68,
    DEC8_BIN = 69,
    GREEK_BIN = 70,
    HEBREW_BIN = 71,
    HP8_BIN = 72,
    KEYBCS2_BIN = 73,
    KOI8R_BIN = 74,
    KOI8U_BIN = 75,
    UTF8_TOLOWER_CI = 76,
    LATIN2_BIN = 77,
    LATIN5_BIN = 78,
    LATIN7_BIN = 79,
    CP850_BIN = 80,
    CP852_BIN = 81,
    SWE7_BIN = 82,
    UTF8_BIN = 83,
    BIG5_BIN = 84,
    EUCKR_BIN = 85,
    GB2312_BIN = 86,
    GBK_BIN = 87,
    SJIS_BIN = 88,
    TIS620_BIN = 89,
    UCS2_BIN = 90,
    UJIS_BIN = 91,
    GEOSTD8_GENERAL_CI = 92,
    GEOSTD8_BIN = 93,
    LATIN1_SPANISH_CI = 94,
    CP932_JAPANESE_CI = 95,
    CP932_BIN = 96,
    EUCJPMS_JAPANESE_CI = 97,
    EUCJPMS_BIN = 98,
    CP1250_POLISH_CI = 99,
    UTF16_UNICODE_CI = 101,
    UTF16_ICELANDIC_CI = 102,
    UTF16_LATVIAN_CI = 103,
    UTF16_ROMANIAN_CI = 104,
    UTF16_SLOVENIAN_CI = 105,
    UTF16_POLISH_CI = 106,
    UTF16_ESTONIAN_CI = 107,
    UTF16_SPANISH_CI = 108,
    UTF16_SWEDISH_CI = 109,
    UTF16_TURKISH_CI = 110,
    UTF16_CZECH_CI = 111,
    UTF16_DANISH_CI = 112,
    UTF16_LITHUANIAN_CI = 113,
    UTF16_SLOVAK_CI = 114,
    UTF16_SPANISH2_CI = 115,
    UTF16_ROMAN_CI = 116,
    UTF16_PERSIAN_CI = 117,
    UTF16_ESPERANTO_CI = 118,
    UTF16_HUNGARIAN_CI = 119,
    UTF16_SINHALA_CI = 120,
    UTF16_GERMAN2_CI = 121,
    UTF16_CROATIAN_CI = 122,
    UTF16_UNICODE_520_CI = 123,
    UTF16_VIETNAMESE_CI = 124,
    UCS2_UNICODE_CI = 128,
    UCS2_ICELANDIC_CI = 129,
    UCS2_LATVIAN_CI = 130,
    UCS2_ROMANIAN_CI = 131,
    UCS2_SLOVENIAN_CI = 132,
    UCS2_POLISH_CI = 133,
    UCS2_ESTONIAN_CI = 134,
    UCS2_SPANISH_CI = 135,
    UCS2_SWEDISH_CI = 136,
    UCS2_TURKISH_CI = 137,
    UCS2_CZECH_CI = 138,
    UCS2_DANISH_CI = 139,
    UCS2_LITHUANIAN_CI = 140,
    UCS2_SLOVAK_CI = 141,
    UCS2_SPANISH2_CI = 142,
    UCS2_ROMAN_CI = 143,
    UCS2_PERSIAN_CI = 144,
    UCS2_ESPERANTO_CI = 145,
    UCS2_HUNGARIAN_CI = 146,
    UCS2_SINHALA_CI = 147,
    UCS2_GERMAN2_CI = 148,
    UCS2_CROATIAN_CI = 149,
    UCS2_UNICODE_520_CI = 150,
    UCS2_VIETNAMESE_CI = 151,
    UCS2_GENERAL_MYSQL500_CI = 159,
    UTF32_UNICODE_CI = 160,
    UTF32_ICELANDIC_CI = 161,
    UTF32_LATVIAN_CI = 162,
    UTF32_ROMANIAN_CI = 163,
    UTF32_SLOVENIAN_CI = 164,
    UTF32_POLISH_CI = 165,
    UTF32_ESTONIAN_CI = 166,
    UTF32_SPANISH_CI = 167,
    UTF32_SWEDISH_CI = 168,
    UTF32_TURKISH_CI = 169,
    UTF32_CZECH_CI = 170,
    UTF32_DANISH_CI = 171,
    UTF32_LITHUANIAN_CI = 172,
    UTF32_SLOVAK_CI = 173,
    UTF32_SPANISH2_CI = 174,
    UTF32_ROMAN_CI = 175,
    UTF32_PERSIAN_CI = 176,
    UTF32_ESPERANTO_CI = 177,
    UTF32_HUNGARIAN_CI = 178,
    UTF32_SINHALA_CI = 179,
    UTF32_GERMAN2_CI = 180,
    UTF32_CROATIAN_CI = 181,
    UTF32_UNICODE_520_CI = 182,
    UTF32_VIETNAMESE_CI = 183,
    UTF8_UNICODE_CI = 192,
    UTF8_ICELANDIC_CI = 193,
    UTF8_LATVIAN_CI = 194,
    UTF8_ROMANIAN_CI = 195,
    UTF8_SLOVENIAN_CI = 196,
    UTF8_POLISH_CI = 197,
    UTF8_ESTONIAN_CI = 198,
    UTF8_SPANISH_CI = 199,
    UTF8_SWEDISH_CI = 200,
    UTF8_TURKISH_CI = 201,
    UTF8_CZECH_CI = 202,
    UTF8_DANISH_CI = 203,
    UTF8_LITHUANIAN_CI = 204,
    UTF8_SLOVAK_CI = 205,
    UTF8_SPANISH2_CI = 206,
    UTF8_ROMAN_CI = 207,
    UTF8_PERSIAN_CI = 208,
    UTF8_ESPERANTO_CI = 209,
    UTF8_HUNGARIAN_CI = 210,
    UTF8_SINHALA_CI = 211,
    UTF8_GERMAN2_CI = 212,
    UTF8_CROATIAN_CI = 213,
    UTF8_UNICODE_520_CI = 214,
    UTF8_VIETNAMESE_CI = 215,
    UTF8_GENERAL_MYSQL500_CI = 223,
    UTF8MB4_UNICODE_CI = 224,
    UTF8MB4_ICELANDIC_CI = 225,
    UTF8MB4_LATVIAN_CI = 226,
    UTF8MB4_ROMANIAN_CI = 227,
    UTF8MB4_SLOVENIAN_CI = 228,
    UTF8MB4_POLISH_CI = 229,
    UTF8MB4_ESTONIAN_CI = 230,
    UTF8MB4_SPANISH_CI = 231,
    UTF8MB4_SWEDISH_CI = 232,
    UTF8MB4_TURKISH_CI = 233,
    UTF8MB4_CZECH_CI = 234,
    UTF8MB4_DANISH_CI = 235,
    UTF8MB4_LITHUANIAN_CI = 236,
    UTF8MB4_SLOVAK_CI = 237,
    UTF8MB4_SPANISH2_CI = 238,
    UTF8MB4_ROMAN_CI = 239,
    UTF8MB4_PERSIAN_CI = 240,
    UTF8MB4_ESPERANTO_CI = 241,
    UTF8MB4_HUNGARIAN_CI = 242,
    UTF8MB4_SINHALA_CI = 243,
    UTF8MB4_GERMAN2_CI = 244,
    UTF8MB4_CROATIAN_CI = 245,
    UTF8MB4_UNICODE_520_CI = 246,
    UTF8MB4_VIETNAMESE_CI = 247,
    GB18030_CHINESE_CI = 248,
    GB18030_BIN = 249,
    GB18030_UNICODE_520_CI = 250,
    UTF8_GENERAL50_CI = 253,
    UTF8MB4_0900_AI_CI = 255,
    UTF8MB4_DE_PB_0900_AI_CI = 256,
    UTF8MB4_IS_0900_AI_CI = 257,
    UTF8MB4_LV_0900_AI_CI = 258,
    UTF8MB4_RO_0900_AI_CI = 259,
    UTF8MB4_SL_0900_AI_CI = 260,
    UTF8MB4_PL_0900_AI_CI = 261,
    UTF8MB4_ET_0900_AI_CI = 262,
    UTF8MB4_ES_0900_AI_CI = 263,
    UTF8MB4_SV_0900_AI_CI = 264,
    UTF8MB4_TR_0900_AI_CI = 265,
    UTF8MB4_CS_0900_AI_CI = 266,
    UTF8MB4_DA_0900_AI_CI = 267,
    UTF8MB4_LT_0900_AI_CI = 268,
    UTF8MB4_SK_0900_AI_CI = 269,
    UTF8MB4_ES_TRAD_0900_AI_CI = 270,
    UTF8MB4_LA_0900_AI_CI = 271,
    UTF8MB4_EO_0900_AI_CI = 273,
    UTF8MB4_HU_0900_AI_CI = 274,
    UTF8MB4_HR_0900_AI_CI = 275,
    UTF8MB4_VI_0900_AI_CI = 277,
    UTF8MB4_0900_AS_CS = 278,
    UTF8MB4_DE_PB_0900_AS_CS = 279,
    UTF8MB4_IS_0900_AS_CS = 280,
    UTF8MB4_LV_0900_AS_CS = 281,
    UTF8MB4_RO_0900_AS_CS = 282,
    UTF8MB4_SL_0900_AS_CS = 283,
    UTF8MB4_PL_0900_AS_CS = 284,
    UTF8MB4_ET_0900_AS_CS = 285,
    UTF8MB4_ES_0900_AS_CS = 286,
    UTF8MB4_SV_0900_AS_CS = 287,
    UTF8MB4_TR_0900_AS_CS = 288,
    UTF8MB4_CS_0900_AS_CS = 289,
    UTF8MB4_DA_0900_AS_CS = 290,
    UTF8MB4_LT_0900_AS_CS = 291,
    UTF8MB4_SK_0900_AS_CS = 292,
    UTF8MB4_ES_TRAD_0900_AS_CS = 293,
    UTF8MB4_LA_0900_AS_CS = 294,
    UTF8MB4_EO_0900_AS_CS = 296,
    UTF8MB4_HU_0900_AS_CS = 297,
    UTF8MB4_HR_0900_AS_CS = 298,
    UTF8MB4_VI_0900_AS_CS = 300,
    UTF8MB4_JA_0900_AS_CS = 303,
    UTF8MB4_JA_0900_AS_CS_KS = 304,
    UTF8MB4_0900_AS_CI = 305,
    UTF8MB4_RU_0900_AI_CI = 306,
    UTF8MB4_RU_0900_AS_CS = 307,
    UTF8MB4_ZH_0900_AS_CS = 308,
    UTF8MB4_0900_BIN = 309
}

type ItemRecord = Record<string, AttributeValue>;
type KeyValue = AttributeValue | null | string;
interface NativeObject {
    [key: string]: NativeType | undefined;
}
type NativeType = string | number | boolean | null | NativeObject | Uint8Array | NativeType[];

interface KeyDefinition {
    name: string;
    type: 'B' | 'N' | 'S';
}
interface DynamoDBConstructorParams {
    namespace?: string;
    region?: string;
    credentials?: AwsCredentialIdentity;
}
interface QueryQLParams {
    sql: string;
    return?: ReturnValuesOnConditionCheckFailure;
    signal?: AbortSignal;
}
interface BatchQLParams {
    list: string[];
    return?: ReturnValuesOnConditionCheckFailure;
}
interface TransactionQLParams {
    list: string[];
    return?: ReturnValuesOnConditionCheckFailure;
}
interface DeleteItemsParams {
    table: string;
    key_list: string[];
    list: KeyValue[][];
}
interface SetColumnValue {
    column: string;
    value: KeyValue;
}
interface SetRowByKeys {
    key: string[];
    set_list: SetColumnValue[];
}
interface UpdateItemsParams {
    table: string;
    key_list: string[];
    list: SetRowByKeys[];
}
interface PutItemsParams {
    table: string;
    list: NativeType[];
}
interface CreateTableParams {
    table: string;
    billing_mode?: BillingMode;
    primary_key: KeyDefinition[];
}
interface CreateIndexParams {
    table: string;
    index_name: string;
    key_list: KeyDefinition[];
    projection_type?: ProjectionType;
}
interface DeleteIndexParams {
    table: string;
    index_name: string;
}
interface UpdateItemParams {
    table: string;
    key: ItemRecord;
    expression: string;
    names?: Record<string, string>;
    values: ItemRecord;
    condition?: string;
}
declare class DynamoDB {
    protected readonly client: DynamoDBClient;
    protected readonly namespace: string;
    constructor(params?: DynamoDBConstructorParams);
    queryQLIter(params: QueryQLParams): AsyncIterableIterator<ItemRecord[]>;
    queryQL(list: string | QueryQLParams): Promise<ItemRecord[]>;
    queryQL(list: (string | QueryQLParams)[]): Promise<ItemRecord[][]>;
    private _queryQL;
    batchQL(params: string[] | BatchQLParams): Promise<ItemRecord[]>;
    transactionQL(params: string[] | TransactionQLParams): Promise<ItemRecord[]>;
    deleteItems(params: DeleteItemsParams): Promise<ItemRecord[]>;
    updateItems(params: UpdateItemsParams): Promise<ItemRecord[]>;
    putItems(params: PutItemsParams): Promise<void>;
    updateItem(params: UpdateItemParams): Promise<ItemRecord | undefined>;
    getTableList(): Promise<string[]>;
    getTable(raw_table: string): Promise<DescribeTableCommandOutput>;
    createTable(params: CreateTableParams): Promise<void>;
    deleteTable(raw_table: string): Promise<void>;
    enableTimeToLive(raw_table: string, attribute_name: string): Promise<void>;
    createIndex(params: CreateIndexParams): Promise<void>;
    deleteIndex(params: DeleteIndexParams): Promise<void>;
    private _pagedSend;
    private _iterSend;
}

type DynamoDBWithCacheConstructorParams = DynamoDBConstructorParams;
declare class DynamoDBWithCache extends DynamoDB {
    private readonly _tableCache;
    getTable(table: string): Promise<DescribeTableCommandOutput>;
    getTableCached(table: string): Promise<DescribeTableCommandOutput>;
    createTable(params: CreateTableParams): Promise<void>;
    deleteTable(table: string): Promise<void>;
}
declare function createDynamoDB(params?: DynamoDBConstructorParams): DynamoDBWithCache;

declare class SQLMode extends EventEmitter {
    private _sqlMode;
    private _modeAnsiQuotes;
    private _modeStrict;
    constructor(sql_mode: string);
    get sqlMode(): string;
    set sqlMode(sql_mode: string);
    get modeAnsiQuotes(): boolean;
    get strictMode(): boolean;
    private _parseSQLMode;
}

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
type QueryListResult = [any, FieldInfo[] | FieldInfo[][]];
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
interface PoolConnection$1 extends Connection$1 {
    release(): void;
}
interface Connection$1 extends EscapeFunctions, EventEmitter {
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

type ValueType = 'null' | 'bool' | 'interval' | 'datetime' | 'date' | 'time' | 'string' | 'char' | 'long' | 'longlong' | 'year' | 'number' | 'double' | 'text' | 'json' | 'buffer';

declare class Transaction {
    _dataMap: Map<string, unknown>;
    _isAutoCommit: boolean;
    constructor(auto_commit: boolean);
    isAutoCommit(): boolean;
    getEngineNameList(): MapIterator<string>;
    getData<T>(name: string): T | undefined;
    setData(name: string, data: unknown): void;
}

interface EvaluationValue {
    type: ValueType;
    value: unknown;
}

interface HeldLease {
    count: number;
    timer: NodeJS.Timeout;
}

interface TypeCastOptions {
    dateStrings?: boolean;
    decimalNumbers?: boolean;
    jsonStrings?: boolean;
    bigNumType: 'bigint' | 'string' | 'number|string' | 'number';
}
interface SessionConfig extends DynamoDBWithCacheConstructorParams {
    database?: string | undefined;
    multipleStatements?: boolean | undefined;
    resultObjects?: boolean | undefined;
    typeCast?: TypeCast | undefined;
    dateStrings?: boolean | ('TIMESTAMP' | 'DATETIME' | 'DATE')[] | undefined;
    decimalNumbers?: boolean | undefined;
    jsonStrings?: boolean | undefined;
    supportBigNumbers?: boolean | undefined;
    bigNumberStrings?: boolean | undefined;
    bigintNative?: boolean | undefined;
    transactionDomain?: string | undefined;
}
interface QueryParams extends QueryOptions {
    collectResults?: boolean;
}
declare class Session extends SQLMode implements PoolConnection$1 {
    readonly config: SessionConfig;
    readonly state: string;
    readonly threadId: number;
    readonly lockOwner: string;
    readonly heldLocks: Map<string, HeldLease>;
    readonly dynamodb: ReturnType<typeof createDynamoDB>;
    readonly typeCastOptions: TypeCastOptions;
    readonly typeCast: TypeCast;
    readonly resultObjects: boolean;
    readonly multipleStatements: boolean;
    readonly transactionDomain: string;
    private _currentDatabase;
    private readonly _localVariables;
    private _transaction;
    private _isReleased;
    private readonly _tempTableMap;
    private _isTimestampFixed;
    private _collationConnection;
    private _divPrecisionIncrement;
    private _timeZone;
    private _lcMessages;
    private _timestamp;
    private readonly _defaultStorageEngine;
    private _insertId;
    private _lastInsertId;
    get collationConnection(): COLLATIONS;
    get divPrecisionIncrement(): number;
    get timeZone(): string;
    get lastInsertId(): bigint;
    get insertId(): bigint;
    get timestamp(): number;
    constructor(params?: SessionConfig);
    release(done?: () => void): void;
    end(done?: () => void): void;
    destroy(): void;
    setCurrentDatabase(database: string, done?: () => void): void;
    getCurrentDatabase(): string | null;
    getVariable(name: string): EvaluationValue | undefined;
    setVariable(name: string, value: EvaluationValue): void;
    getSessionVariable(name: string): EvaluationValue | undefined;
    setSessionVariable(name: string, value: unknown): void;
    getTransaction(): Transaction | null;
    setTransaction(tx: Transaction | null): void;
    getTempTableList(): MapIterator<string>;
    getTempTable<T>(database: string, table: string): T | undefined;
    saveTempTable(database: string, table: string, contents: unknown): void;
    deleteTempTable(database: string, table: string): void;
    deleteTempTablesForDatabase(database: string): void;
    query(params: string | QueryParams, values?: unknown, done?: QueryCallback): Query;
    runQuery(params: string | QueryParams, values?: unknown): Promise<QueryListResult>;
    private _createQuery;
    readonly createQuery: (params: string | QueryParams, values?: unknown, done?: QueryCallback) => Query;
    readonly escape: (value: SqlString.SqlValue, stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
    readonly escapeId: (value: SqlString.SqlValue, forbidQualified?: boolean) => string;
    readonly format: (sql: string, values?: SqlString.SqlValue | SqlString.SqlValue[], stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
    private _run;
    startStatement(): void;
}
declare function createSession(args?: SessionConfig): PoolConnection$1;

declare const escape: (value: SqlString.SqlValue, stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
declare const escapeId: (value: SqlString.SqlValue, forbidQualified?: boolean) => string;
declare const format: (sql: string, values?: SqlString.SqlValue | SqlString.SqlValue[], stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
declare const raw: (sql: string) => SqlString.Raw;
declare class Connection {
    readonly threadId: number;
    readonly escape: (value: SqlString.SqlValue, stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
    readonly escapeId: (value: SqlString.SqlValue, forbidQualified?: boolean) => string;
    readonly format: (sql: string, values?: SqlString.SqlValue | SqlString.SqlValue[], stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
    protected readonly session: Session;
    constructor(session: Session);
    query(sql: string | QueryOptions, values?: unknown): Promise<QueryListResult>;
    end(): Promise<void>;
    destroy(): void;
}
declare class PoolConnection extends Connection {
    release(): void;
}
declare class Pool {
    readonly config: SessionConfig;
    readonly escape: (value: SqlString.SqlValue, stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
    readonly escapeId: (value: SqlString.SqlValue, forbidQualified?: boolean) => string;
    readonly format: (sql: string, values?: SqlString.SqlValue | SqlString.SqlValue[], stringifyObjects?: boolean, timezone?: SqlString.Timezone, sqlMode?: SqlString.SqlMode) => string;
    constructor(config: SessionConfig);
    getConnection(): Promise<PoolConnection>;
    query(sql: string | QueryOptions, values?: unknown): Promise<QueryListResult>;
    end(): Promise<void>;
}
declare function createConnection(config?: SessionConfig): Promise<Connection>;
declare function createPool(config?: SessionConfig): Pool;

export { Connection, Pool, PoolConnection, SQLError, Types, createConnection, createPool, createSession, escape, escapeId, format, raw };
export type { FieldInfo, MysqlError, OkPacket, QueryCallback, QueryError, QueryOptions, ResultSetHeader, SessionConfig };
