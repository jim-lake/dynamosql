'use strict';

var SqlString = require('sqlstring');
var node_events = require('node:events');
var clientDynamodb = require('@aws-sdk/client-dynamodb');
var node_util = require('node:util');
var shared = require('@dynamosql/shared');
var require$$0 = require('big-integer');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var SqlString__namespace = /*#__PURE__*/_interopNamespaceDefault(SqlString);

function escapeIdentifier(string) {
    return '"' + string.replace('"', '""') + '"';
}
function escapeString(string) {
    let ret = '';
    for (let i = 0; i < string.length; i++) {
        const c = string.charCodeAt(i);
        if (c < 32) {
            ret += '\\x' + c.toString(16);
        }
        else if (c === 39) {
            ret += "''";
        }
        else {
            ret += string[i];
        }
    }
    return ret;
}
function escapeValue(value, type) {
    let s;
    if (value === null) {
        s = 'NULL';
    }
    else if (Array.isArray(value)) {
        s = '[ ';
        s += value.map((v) => escapeValue(v)).join(', ');
        s += ' ]';
    }
    else if (typeof value === 'object') {
        s = '{ ';
        s += Object.keys(value)
            .map((key) => `'${key}': ${escapeValue(value[key])}`)
            .join(', ');
        s += ' }';
    }
    else if (typeof value === 'number') {
        s = String(value);
    }
    else if (value !== undefined) {
        s = "'" + escapeString(String(value)) + "'";
    }
    else {
        s = 'undefined';
    }
    return s;
}
function convertError(err) {
    if (!err)
        return err;
    let ret;
    if (err && typeof err === 'object') {
        const error = err;
        if (error.name === 'ConditionalCheckFailedException' && error.Item) {
            ret = new Error('cond_fail');
        }
        else if (error.Code === 'ConditionalCheckFailed') {
            ret = new Error('cond_fail');
        }
        else if (error.name === 'ResourceNotFoundException' ||
            error.Code === 'ResourceNotFound' ||
            (error.message && String(error.message).includes('resource not found'))) {
            ret = new Error('resource_not_found');
        }
        else if (error.name === 'ResourceInUseException' ||
            (error.message && String(error.message).includes('resource in use'))) {
            ret = new Error('resource_in_use');
        }
        else if (error.Code === 'ValidationError' ||
            error.name === 'ValidationError') {
            if (error.Message?.match?.(/expected: [^\s]* actual: NULL/)) {
                ret = new Error('ER_BAD_NULL_ERROR');
            }
            else if (error.Message?.match?.(/expected: [^\s]* actual:/)) {
                ret = new Error('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD');
            }
            else {
                ret = new Error('validation');
            }
        }
        else {
            ret = err;
        }
    }
    else {
        ret = err;
    }
    return ret;
}
function mapToObject(obj) {
    const ret = {};
    ret.toString = toString;
    Object.keys(obj).forEach((key) => {
        ret[key] = valueToNative(obj[key]);
    });
    return ret;
}
function valueToNative(value) {
    let ret = value;
    if (value && typeof value === 'object') {
        const v = value;
        if (v.N) {
            ret = parseFloat(v.N);
        }
        else if (Array.isArray(v.L)) {
            ret = v.L.map(valueToNative);
        }
        else if (v.M) {
            ret = mapToObject(v.M);
        }
        else {
            ret = v.S ?? v.B ?? v.BOOL ?? value;
        }
    }
    return ret;
}
function nativeToValue(obj) {
    if (obj === null) {
        return { NULL: true };
    }
    else if (typeof obj === 'object') {
        const M = {};
        for (const key in obj) {
            M[key] = nativeToValue(obj[key]);
        }
        return { M };
    }
    else if (typeof obj === 'number') {
        return { N: String(obj) };
    }
    else if (typeof obj === 'boolean') {
        return { BOOL: obj };
    }
    else {
        return { S: String(obj) };
    }
}
function toString() {
    return JSON.stringify(this);
}
function convertValueToPQL(value) {
    let ret;
    if (!value) {
        ret = 'NULL';
    }
    else if (typeof value === 'object' && value !== null) {
        const v = value;
        if (v.S !== undefined) {
            ret = "'" + escapeString(v.S) + "'";
        }
        else if (v.N !== undefined) {
            ret = String(v.N);
        }
        else {
            ret = "'" + escapeString(String(value)) + "'";
        }
    }
    else {
        ret = "'" + escapeString(String(value)) + "'";
    }
    return ret;
}
function convertSuccess(result) {
    let err = null;
    let ret;
    if (result && typeof result === 'object') {
        const res = result;
        if (res.Responses && Array.isArray(res.Responses)) {
            ret = [];
            res.Responses.forEach((response, i) => {
                if (response.Error) {
                    if (!err) {
                        err = [];
                    }
                    err[i] = convertError(response.Error);
                }
                ret[i] = convertResult(response);
            });
        }
        else {
            ret = convertResult(result);
        }
    }
    else {
        ret = convertResult(result);
    }
    return [err, ret];
}
function convertResult(result) {
    let ret;
    if (result && typeof result === 'object') {
        const res = result;
        if (res.Items) {
            ret = res.Items;
        }
        else if (res.Item) {
            ret = [res.Item];
        }
    }
    return ret;
}
function dynamoType(type) {
    let ret = type;
    if (type === 'string') {
        ret = 'S';
    }
    else if (type === 'VARCHAR') {
        ret = 'S';
    }
    else if (type === 'INT') {
        ret = 'N';
    }
    else if (type === 'number') {
        ret = 'N';
    }
    else if (type === 'blob') {
        ret = 'B';
    }
    return ret;
}

async function timesLimit(length, limit, iter) {
    if (length <= 0) {
        return;
    }
    let i = 0;
    let running = 0;
    let stop = false;
    return new Promise((resolve, reject) => {
        function _done() {
            if (!stop) {
                running--;
                if (i >= length && running === 0) {
                    resolve();
                }
                else {
                    _loopLaunch();
                }
            }
        }
        function _catch(err) {
            stop = true;
            reject(err);
        }
        function _launch(index) {
            iter(index).then(_done, _catch);
        }
        function _loopLaunch() {
            while (!stop && i < length && running < limit) {
                running++;
                const index = i++;
                _launch(index);
            }
        }
        _loopLaunch();
    });
}
async function parallelLimit(list, limit, iter) {
    const results = [];
    await timesLimit(list.length, limit, async (i) => {
        results[i] = await iter(list[i], i);
    });
    return results;
}

async function parallelBatch(list, batchSize, limit, iter) {
    const batch_count = Math.ceil(list.length / batchSize);
    const results = [];
    await timesLimit(batch_count, limit, async (i) => {
        const start = i * batchSize;
        const batch = list.slice(start, start + batchSize);
        const batch_result = await iter(batch, i);
        for (let j = 0; j < batch_result.length; j++) {
            results[i + j] = batch_result[j];
        }
    });
    return results;
}

const QUERY_LIMIT = 5;
class DynamoDB {
    client;
    constructor(params) {
        const opts = {
            region: params.region ??
                process.env.AWS_REGION ??
                process.env.AWS_DEFAULT_REGION,
        };
        if (params.credentials) {
            opts.credentials = params.credentials;
        }
        this.client = new clientDynamodb.DynamoDBClient(opts);
    }
    async queryQL(list) {
        if (!Array.isArray(list)) {
            return this._queryQL(list);
        }
        else {
            return parallelLimit(list, QUERY_LIMIT, async (item) => {
                return this._queryQL(item);
            });
        }
    }
    async _queryQL(params) {
        const sql = typeof params === 'string' ? params : params.sql;
        const returnVal = typeof params === 'string' ? 'NONE' : (params.return ?? 'NONE');
        const input = {
            Statement: sql,
            ReturnValuesOnConditionCheckFailure: returnVal,
        };
        const command = new clientDynamodb.ExecuteStatementCommand(input);
        return this._pagedSend(command);
    }
    async batchQL(params) {
        const list = Array.isArray(params) ? params : params.list;
        const returnVal = Array.isArray(params)
            ? 'NONE'
            : (params.return ?? 'NONE');
        const input = {
            Statements: list.map((Statement) => ({
                Statement,
                ReturnValuesOnConditionCheckFailure: returnVal,
            })),
        };
        const command = new clientDynamodb.BatchExecuteStatementCommand(input);
        try {
            const result = await this.client.send(command);
            const [err, ret] = convertSuccess(result);
            if (err) {
                throw err;
            }
            return ret ?? [];
        }
        catch (err) {
            const converted = convertSuccess(err);
            if (converted[0]) {
                throw converted[0];
            }
            if (converted[1]) {
                return converted[1];
            }
            throw convertError(err);
        }
    }
    async transactionQL(params) {
        const list = Array.isArray(params) ? params : params.list;
        const returnVal = Array.isArray(params)
            ? 'NONE'
            : (params.return ?? 'NONE');
        const input = {
            TransactStatements: list.map((Statement) => ({
                Statement,
                ReturnValuesOnConditionCheckFailure: returnVal,
            })),
        };
        const command = new clientDynamodb.ExecuteTransactionCommand(input);
        try {
            const result = await this.client.send(command);
            const [err, ret] = convertSuccess(result);
            if (err) {
                throw err;
            }
            return ret ?? [];
        }
        catch (err) {
            const converted = convertSuccess(err);
            if (converted[0]) {
                throw converted[0];
            }
            if (converted[1]) {
                return converted[1];
            }
            throw convertError(err);
        }
    }
    async deleteItems(params) {
        const BATCH_LIMIT = 100;
        const { table, key_list, list } = params;
        const prefix = `DELETE FROM ${escapeIdentifier(table)} WHERE `;
        return parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch) => {
            const sql_list = [];
            for (const item of batch) {
                const cond = key_list
                    .map((key, j) => {
                    const value = item[j];
                    return `${escapeIdentifier(key)} = ${convertValueToPQL(value)}`;
                })
                    .join(' AND ');
                sql_list.push(prefix + cond);
            }
            return this.transactionQL(sql_list);
        });
    }
    async updateItems(params) {
        const BATCH_LIMIT = 100;
        const { table, key_list, list } = params;
        const prefix = `UPDATE ${escapeIdentifier(table)} SET `;
        return parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch) => {
            const sql_list = [];
            for (const item of batch) {
                const sets = item.set_list
                    .map((object) => {
                    const { column, value } = object;
                    return `${escapeIdentifier(column)} = ${escapeValue(value)}`;
                })
                    .join(', ');
                const cond = ' WHERE ' +
                    key_list
                        .map((key, j) => {
                        const value = item.key[j];
                        return `${escapeIdentifier(key)} = ${convertValueToPQL(value)}`;
                    })
                        .join(' AND ');
                sql_list.push(prefix + sets + cond);
            }
            return this.transactionQL(sql_list);
        });
    }
    async putItems(params) {
        const BATCH_LIMIT = 100;
        const { table, list } = params;
        const err_list = [];
        try {
            await parallelBatch(list, BATCH_LIMIT, QUERY_LIMIT, async (batch, i) => {
                const input = {
                    TransactItems: batch.map((item) => {
                        const value = nativeToValue(item);
                        return {
                            Put: {
                                TableName: table,
                                Item: 'M' in value
                                    ? value.M
                                    : {},
                            },
                        };
                    }),
                };
                const command = new clientDynamodb.TransactWriteItemsCommand(input);
                try {
                    await this.client.send(command);
                    return batch.map(() => undefined);
                }
                catch (err) {
                    const start = i * BATCH_LIMIT;
                    if (err?.name === 'TransactionCanceledException' &&
                        err.CancellationReasons?.length > 0) {
                        err.CancellationReasons.forEach((cancel_err, j) => {
                            err_list[start + j] = {
                                err: convertError(cancel_err),
                                parent: cancel_err,
                            };
                        });
                    }
                    else {
                        err_list[start] = { err: convertError(err), parent: err };
                    }
                    throw err;
                }
            });
        }
        catch {
            throw err_list;
        }
    }
    async getTableList() {
        const command = new clientDynamodb.ListTablesCommand({ Limit: 100 });
        const results = [];
        while (true) {
            const result = await this.client.send(command);
            result.TableNames?.forEach((table) => results.push(table));
            if (!result.LastEvaluatedTableName) {
                break;
            }
            command.input.ExclusiveStartTableName = result.LastEvaluatedTableName;
        }
        return results;
    }
    async getTable(TableName) {
        const command = new clientDynamodb.DescribeTableCommand({ TableName });
        try {
            return await this.client.send(command);
        }
        catch (err) {
            throw convertError(err);
        }
    }
    async createTable(params) {
        const { table, billing_mode, column_list, primary_key } = params;
        const AttributeDefinitions = column_list.map((column) => ({
            AttributeName: column.name,
            AttributeType: dynamoType(column.type),
        }));
        const KeySchema = [
            { AttributeName: primary_key?.[0]?.name, KeyType: clientDynamodb.KeyType.HASH },
        ];
        if (primary_key?.[1]) {
            KeySchema.push({
                AttributeName: primary_key[1].name,
                KeyType: clientDynamodb.KeyType.RANGE,
            });
        }
        const input = {
            TableName: table,
            BillingMode: (billing_mode ?? 'PAY_PER_REQUEST'),
            AttributeDefinitions,
            KeySchema,
        };
        const command = new clientDynamodb.CreateTableCommand(input);
        try {
            await this.client.send(command);
        }
        catch (err) {
            throw convertError(err);
        }
    }
    async deleteTable(TableName) {
        const command = new clientDynamodb.DeleteTableCommand({ TableName });
        try {
            await this.client.send(command);
        }
        catch (err) {
            throw convertError(err);
        }
    }
    async createIndex(params) {
        const { table, index_name, key_list, projection_type } = params;
        const AttributeDefinitions = key_list.map((item) => ({
            AttributeName: item.name,
            AttributeType: dynamoType(item.type),
        }));
        const KeySchema = [
            { AttributeName: key_list?.[0]?.name, KeyType: clientDynamodb.KeyType.HASH },
        ];
        if (key_list?.[1]) {
            KeySchema.push({
                AttributeName: key_list[1].name,
                KeyType: clientDynamodb.KeyType.RANGE,
            });
        }
        const input = {
            TableName: table,
            AttributeDefinitions,
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: index_name,
                        KeySchema,
                        Projection: {
                            ProjectionType: (projection_type ||
                                'KEYS_ONLY'),
                        },
                    },
                },
            ],
        };
        const command = new clientDynamodb.UpdateTableCommand(input);
        try {
            await this.client.send(command);
        }
        catch (err) {
            throw convertError(err);
        }
    }
    async deleteIndex(params) {
        const { table, index_name } = params;
        const input = {
            TableName: table,
            GlobalSecondaryIndexUpdates: [{ Delete: { IndexName: index_name } }],
        };
        const command = new clientDynamodb.UpdateTableCommand(input);
        try {
            await this.client.send(command);
        }
        catch (err) {
            throw convertError(err);
        }
    }
    async _pagedSend(command) {
        const results = [];
        while (true) {
            try {
                const result = await this.client.send(command);
                const list = convertSuccess(result)[1];
                list?.forEach((item) => {
                    results.push(item);
                });
                if (!result?.NextToken) {
                    break;
                }
                command.input.NextToken = result.NextToken;
            }
            catch (err) {
                if (err.Item) {
                    results.push(err.Item);
                }
                throw convertError(err);
            }
        }
        return results;
    }
}

class DynamoDBWithCache extends DynamoDB {
    _tableCache = new Map();
    async getTable(table_name) {
        try {
            const result = await super.getTable(table_name);
            if (result?.Table?.TableStatus === 'DELETING') {
                this._tableCache.delete(table_name);
            }
            else {
                this._tableCache.set(table_name, { last_updated: Date.now(), result });
            }
            return result;
        }
        catch (err) {
            if (err?.message === 'resource_not_found') {
                this._tableCache.delete(table_name);
            }
            throw err;
        }
    }
    async getTableCached(table_name) {
        const result = this._tableCache.get(table_name)?.result;
        if (result) {
            return result;
        }
        else {
            return this.getTable(table_name);
        }
    }
    async createTable(opts) {
        const table_name = opts.table;
        this._tableCache.delete(table_name);
        try {
            await super.createTable(opts);
        }
        finally {
            this._tableCache.delete(table_name);
        }
    }
    async deleteTable(table_name) {
        this._tableCache.delete(table_name);
        try {
            await super.deleteTable(table_name);
        }
        finally {
            this._tableCache.delete(table_name);
        }
    }
}
function createDynamoDB(params) {
    return new DynamoDBWithCache(params);
}

const FIELD_FLAGS = {
    NOT_NULL: 1,
    UNSIGNED: 32,
    BINARY: 128};
const TYPES = {
    OLDDECIMAL: 0x00,
    TINY: 0x01,
    TINYINT: 0x01,
    SHORT: 0x02,
    SMALLINT: 0x02,
    INT: 0x03,
    LONG: 0x03,
    FLOAT: 0x04,
    DOUBLE: 0x05,
    NULL: 0x06,
    TIMESTAMP: 0x07,
    LONGLONG: 0x08,
    BIGINT: 0x08,
    INT24: 0x09,
    MEDIUMINT: 0x09,
    DATE: 0x0a,
    TIME: 0x0b,
    DATETIME: 0x0c,
    YEAR: 0x0d,
    NEWDATE: 0x0e,
    VARCHAR: 0x0f,
    BIT: 0x10,
    JSON: 0xf5,
    DECIMAL: 0xf6,
    ENUM: 0xf7,
    SET: 0xf8,
    TINYBLOB: 0xf9,
    MEDIUMBLOB: 0xfa,
    LONGBLOB: 0xfb,
    BLOB: 0xfc,
    VAR_STRING: 0xfd,
    STRING: 0xfe,
    GEOMETRY: 0xff,
};
const CHARSETS = {
    UTF8_GENERAL_CI: 33,
    BINARY: 63};
const CODE_ERRNO = {
    EE_CANTCREATEFILE: 1,
    EE_READ: 2,
    EE_WRITE: 3,
    EE_BADCLOSE: 4,
    EE_OUTOFMEMORY: 5,
    EE_DELETE: 6,
    EE_LINK: 7,
    EE_EOFERR: 9,
    EE_CANTLOCK: 10,
    EE_CANTUNLOCK: 11,
    EE_DIR: 12,
    EE_STAT: 13,
    EE_CANT_CHSIZE: 14,
    EE_CANT_OPEN_STREAM: 15,
    EE_GETWD: 16,
    EE_SETWD: 17,
    EE_LINK_WARNING: 18,
    EE_OPEN_WARNING: 19,
    EE_DISK_FULL: 20,
    EE_CANT_MKDIR: 21,
    EE_UNKNOWN_CHARSET: 22,
    EE_OUT_OF_FILERESOURCES: 23,
    EE_CANT_READLINK: 24,
    EE_CANT_SYMLINK: 25,
    EE_REALPATH: 26,
    EE_SYNC: 27,
    EE_UNKNOWN_COLLATION: 28,
    EE_FILENOTFOUND: 29,
    EE_FILE_NOT_CLOSED: 30,
    EE_CHANGE_OWNERSHIP: 31,
    EE_CHANGE_PERMISSIONS: 32,
    EE_CANT_SEEK: 33,
    EE_CAPACITY_EXCEEDED: 34,
    HA_ERR_KEY_NOT_FOUND: 120,
    HA_ERR_FOUND_DUPP_KEY: 121,
    HA_ERR_INTERNAL_ERROR: 122,
    HA_ERR_RECORD_CHANGED: 123,
    HA_ERR_WRONG_INDEX: 124,
    HA_ERR_CRASHED: 126,
    HA_ERR_WRONG_IN_RECORD: 127,
    HA_ERR_OUT_OF_MEM: 128,
    HA_ERR_NOT_A_TABLE: 130,
    HA_ERR_WRONG_COMMAND: 131,
    HA_ERR_OLD_FILE: 132,
    HA_ERR_NO_ACTIVE_RECORD: 133,
    HA_ERR_RECORD_DELETED: 134,
    HA_ERR_RECORD_FILE_FULL: 135,
    HA_ERR_INDEX_FILE_FULL: 136,
    HA_ERR_END_OF_FILE: 137,
    HA_ERR_UNSUPPORTED: 138,
    HA_ERR_TOO_BIG_ROW: 139,
    HA_WRONG_CREATE_OPTION: 140,
    HA_ERR_FOUND_DUPP_UNIQUE: 141,
    HA_ERR_UNKNOWN_CHARSET: 142,
    HA_ERR_WRONG_MRG_TABLE_DEF: 143,
    HA_ERR_CRASHED_ON_REPAIR: 144,
    HA_ERR_CRASHED_ON_USAGE: 145,
    HA_ERR_LOCK_WAIT_TIMEOUT: 146,
    HA_ERR_LOCK_TABLE_FULL: 147,
    HA_ERR_READ_ONLY_TRANSACTION: 148,
    HA_ERR_LOCK_DEADLOCK: 149,
    HA_ERR_CANNOT_ADD_FOREIGN: 150,
    HA_ERR_NO_REFERENCED_ROW: 151,
    HA_ERR_ROW_IS_REFERENCED: 152,
    HA_ERR_NO_SAVEPOINT: 153,
    HA_ERR_NON_UNIQUE_BLOCK_SIZE: 154,
    HA_ERR_NO_SUCH_TABLE: 155,
    HA_ERR_TABLE_EXIST: 156,
    HA_ERR_NO_CONNECTION: 157,
    HA_ERR_NULL_IN_SPATIAL: 158,
    HA_ERR_TABLE_DEF_CHANGED: 159,
    HA_ERR_NO_PARTITION_FOUND: 160,
    HA_ERR_RBR_LOGGING_FAILED: 161,
    HA_ERR_DROP_INDEX_FK: 162,
    HA_ERR_FOREIGN_DUPLICATE_KEY: 163,
    HA_ERR_TABLE_NEEDS_UPGRADE: 164,
    HA_ERR_TABLE_READONLY: 165,
    HA_ERR_AUTOINC_READ_FAILED: 166,
    HA_ERR_AUTOINC_ERANGE: 167,
    HA_ERR_GENERIC: 168,
    HA_ERR_RECORD_IS_THE_SAME: 169,
    HA_ERR_LOGGING_IMPOSSIBLE: 170,
    HA_ERR_CORRUPT_EVENT: 171,
    HA_ERR_NEW_FILE: 172,
    HA_ERR_ROWS_EVENT_APPLY: 173,
    HA_ERR_INITIALIZATION: 174,
    HA_ERR_FILE_TOO_SHORT: 175,
    HA_ERR_WRONG_CRC: 176,
    HA_ERR_TOO_MANY_CONCURRENT_TRXS: 177,
    HA_ERR_NOT_IN_LOCK_PARTITIONS: 178,
    HA_ERR_INDEX_COL_TOO_LONG: 179,
    HA_ERR_INDEX_CORRUPT: 180,
    HA_ERR_UNDO_REC_TOO_BIG: 181,
    HA_FTS_INVALID_DOCID: 182,
    HA_ERR_TABLE_IN_FK_CHECK: 183,
    HA_ERR_TABLESPACE_EXISTS: 184,
    HA_ERR_TOO_MANY_FIELDS: 185,
    HA_ERR_ROW_IN_WRONG_PARTITION: 186,
    HA_ERR_INNODB_READ_ONLY: 187,
    HA_ERR_FTS_EXCEED_RESULT_CACHE_LIMIT: 188,
    HA_ERR_TEMP_FILE_WRITE_FAILURE: 189,
    HA_ERR_INNODB_FORCED_RECOVERY: 190,
    HA_ERR_FTS_TOO_MANY_WORDS_IN_PHRASE: 191,
    HA_ERR_FK_DEPTH_EXCEEDED: 192,
    HA_MISSING_CREATE_OPTION: 193,
    HA_ERR_SE_OUT_OF_MEMORY: 194,
    HA_ERR_TABLE_CORRUPT: 195,
    HA_ERR_QUERY_INTERRUPTED: 196,
    HA_ERR_TABLESPACE_MISSING: 197,
    HA_ERR_TABLESPACE_IS_NOT_EMPTY: 198,
    HA_ERR_WRONG_FILE_NAME: 199,
    HA_ERR_NOT_ALLOWED_COMMAND: 200,
    HA_ERR_COMPUTE_FAILED: 201,
    ER_HASHCHK: 1000,
    ER_NISAMCHK: 1001,
    ER_NO: 1002,
    ER_YES: 1003,
    ER_CANT_CREATE_FILE: 1004,
    ER_CANT_CREATE_TABLE: 1005,
    ER_CANT_CREATE_DB: 1006,
    ER_DB_CREATE_EXISTS: 1007,
    ER_DB_DROP_EXISTS: 1008,
    ER_DB_DROP_DELETE: 1009,
    ER_DB_DROP_RMDIR: 1010,
    ER_CANT_DELETE_FILE: 1011,
    ER_CANT_FIND_SYSTEM_REC: 1012,
    ER_CANT_GET_STAT: 1013,
    ER_CANT_GET_WD: 1014,
    ER_CANT_LOCK: 1015,
    ER_CANT_OPEN_FILE: 1016,
    ER_FILE_NOT_FOUND: 1017,
    ER_CANT_READ_DIR: 1018,
    ER_CANT_SET_WD: 1019,
    ER_CHECKREAD: 1020,
    ER_DISK_FULL: 1021,
    ER_DUP_KEY: 1022,
    ER_ERROR_ON_CLOSE: 1023,
    ER_ERROR_ON_READ: 1024,
    ER_ERROR_ON_RENAME: 1025,
    ER_ERROR_ON_WRITE: 1026,
    ER_FILE_USED: 1027,
    ER_FILSORT_ABORT: 1028,
    ER_FORM_NOT_FOUND: 1029,
    ER_GET_ERRNO: 1030,
    ER_ILLEGAL_HA: 1031,
    ER_KEY_NOT_FOUND: 1032,
    ER_NOT_FORM_FILE: 1033,
    ER_NOT_KEYFILE: 1034,
    ER_OLD_KEYFILE: 1035,
    ER_OPEN_AS_READONLY: 1036,
    ER_OUTOFMEMORY: 1037,
    ER_OUT_OF_SORTMEMORY: 1038,
    ER_UNEXPECTED_EOF: 1039,
    ER_CON_COUNT_ERROR: 1040,
    ER_OUT_OF_RESOURCES: 1041,
    ER_BAD_HOST_ERROR: 1042,
    ER_HANDSHAKE_ERROR: 1043,
    ER_DBACCESS_DENIED_ERROR: 1044,
    ER_ACCESS_DENIED_ERROR: 1045,
    ER_NO_DB_ERROR: 1046,
    ER_UNKNOWN_COM_ERROR: 1047,
    ER_BAD_NULL_ERROR: 1048,
    ER_BAD_DB_ERROR: 1049,
    ER_TABLE_EXISTS_ERROR: 1050,
    ER_BAD_TABLE_ERROR: 1051,
    ER_NON_UNIQ_ERROR: 1052,
    ER_SERVER_SHUTDOWN: 1053,
    ER_BAD_FIELD_ERROR: 1054,
    ER_WRONG_FIELD_WITH_GROUP: 1055,
    ER_WRONG_GROUP_FIELD: 1056,
    ER_WRONG_SUM_SELECT: 1057,
    ER_WRONG_VALUE_COUNT: 1058,
    ER_TOO_LONG_IDENT: 1059,
    ER_DUP_FIELDNAME: 1060,
    ER_DUP_KEYNAME: 1061,
    ER_DUP_ENTRY: 1062,
    ER_WRONG_FIELD_SPEC: 1063,
    ER_PARSE_ERROR: 1064,
    ER_EMPTY_QUERY: 1065,
    ER_NONUNIQ_TABLE: 1066,
    ER_INVALID_DEFAULT: 1067,
    ER_MULTIPLE_PRI_KEY: 1068,
    ER_TOO_MANY_KEYS: 1069,
    ER_TOO_MANY_KEY_PARTS: 1070,
    ER_TOO_LONG_KEY: 1071,
    ER_KEY_COLUMN_DOES_NOT_EXITS: 1072,
    ER_BLOB_USED_AS_KEY: 1073,
    ER_TOO_BIG_FIELDLENGTH: 1074,
    ER_WRONG_AUTO_KEY: 1075,
    ER_READY: 1076,
    ER_NORMAL_SHUTDOWN: 1077,
    ER_GOT_SIGNAL: 1078,
    ER_SHUTDOWN_COMPLETE: 1079,
    ER_FORCING_CLOSE: 1080,
    ER_IPSOCK_ERROR: 1081,
    ER_NO_SUCH_INDEX: 1082,
    ER_WRONG_FIELD_TERMINATORS: 1083,
    ER_BLOBS_AND_NO_TERMINATED: 1084,
    ER_TEXTFILE_NOT_READABLE: 1085,
    ER_FILE_EXISTS_ERROR: 1086,
    ER_LOAD_INFO: 1087,
    ER_ALTER_INFO: 1088,
    ER_WRONG_SUB_KEY: 1089,
    ER_CANT_REMOVE_ALL_FIELDS: 1090,
    ER_CANT_DROP_FIELD_OR_KEY: 1091,
    ER_INSERT_INFO: 1092,
    ER_UPDATE_TABLE_USED: 1093,
    ER_NO_SUCH_THREAD: 1094,
    ER_KILL_DENIED_ERROR: 1095,
    ER_NO_TABLES_USED: 1096,
    ER_TOO_BIG_SET: 1097,
    ER_NO_UNIQUE_LOGFILE: 1098,
    ER_TABLE_NOT_LOCKED_FOR_WRITE: 1099,
    ER_TABLE_NOT_LOCKED: 1100,
    ER_BLOB_CANT_HAVE_DEFAULT: 1101,
    ER_WRONG_DB_NAME: 1102,
    ER_WRONG_TABLE_NAME: 1103,
    ER_TOO_BIG_SELECT: 1104,
    ER_UNKNOWN_ERROR: 1105,
    ER_UNKNOWN_PROCEDURE: 1106,
    ER_WRONG_PARAMCOUNT_TO_PROCEDURE: 1107,
    ER_WRONG_PARAMETERS_TO_PROCEDURE: 1108,
    ER_UNKNOWN_TABLE: 1109,
    ER_FIELD_SPECIFIED_TWICE: 1110,
    ER_INVALID_GROUP_FUNC_USE: 1111,
    ER_UNSUPPORTED_EXTENSION: 1112,
    ER_TABLE_MUST_HAVE_COLUMNS: 1113,
    ER_RECORD_FILE_FULL: 1114,
    ER_UNKNOWN_CHARACTER_SET: 1115,
    ER_TOO_MANY_TABLES: 1116,
    ER_TOO_MANY_FIELDS: 1117,
    ER_TOO_BIG_ROWSIZE: 1118,
    ER_STACK_OVERRUN: 1119,
    ER_WRONG_OUTER_JOIN: 1120,
    ER_NULL_COLUMN_IN_INDEX: 1121,
    ER_CANT_FIND_UDF: 1122,
    ER_CANT_INITIALIZE_UDF: 1123,
    ER_UDF_NO_PATHS: 1124,
    ER_UDF_EXISTS: 1125,
    ER_CANT_OPEN_LIBRARY: 1126,
    ER_CANT_FIND_DL_ENTRY: 1127,
    ER_FUNCTION_NOT_DEFINED: 1128,
    ER_HOST_IS_BLOCKED: 1129,
    ER_HOST_NOT_PRIVILEGED: 1130,
    ER_PASSWORD_ANONYMOUS_USER: 1131,
    ER_PASSWORD_NOT_ALLOWED: 1132,
    ER_PASSWORD_NO_MATCH: 1133,
    ER_UPDATE_INFO: 1134,
    ER_CANT_CREATE_THREAD: 1135,
    ER_WRONG_VALUE_COUNT_ON_ROW: 1136,
    ER_CANT_REOPEN_TABLE: 1137,
    ER_INVALID_USE_OF_NULL: 1138,
    ER_REGEXP_ERROR: 1139,
    ER_MIX_OF_GROUP_FUNC_AND_FIELDS: 1140,
    ER_NONEXISTING_GRANT: 1141,
    ER_TABLEACCESS_DENIED_ERROR: 1142,
    ER_COLUMNACCESS_DENIED_ERROR: 1143,
    ER_ILLEGAL_GRANT_FOR_TABLE: 1144,
    ER_GRANT_WRONG_HOST_OR_USER: 1145,
    ER_NO_SUCH_TABLE: 1146,
    ER_NONEXISTING_TABLE_GRANT: 1147,
    ER_NOT_ALLOWED_COMMAND: 1148,
    ER_SYNTAX_ERROR: 1149,
    ER_DELAYED_CANT_CHANGE_LOCK: 1150,
    ER_TOO_MANY_DELAYED_THREADS: 1151,
    ER_ABORTING_CONNECTION: 1152,
    ER_NET_PACKET_TOO_LARGE: 1153,
    ER_NET_READ_ERROR_FROM_PIPE: 1154,
    ER_NET_FCNTL_ERROR: 1155,
    ER_NET_PACKETS_OUT_OF_ORDER: 1156,
    ER_NET_UNCOMPRESS_ERROR: 1157,
    ER_NET_READ_ERROR: 1158,
    ER_NET_READ_INTERRUPTED: 1159,
    ER_NET_ERROR_ON_WRITE: 1160,
    ER_NET_WRITE_INTERRUPTED: 1161,
    ER_TOO_LONG_STRING: 1162,
    ER_TABLE_CANT_HANDLE_BLOB: 1163,
    ER_TABLE_CANT_HANDLE_AUTO_INCREMENT: 1164,
    ER_DELAYED_INSERT_TABLE_LOCKED: 1165,
    ER_WRONG_COLUMN_NAME: 1166,
    ER_WRONG_KEY_COLUMN: 1167,
    ER_WRONG_MRG_TABLE: 1168,
    ER_DUP_UNIQUE: 1169,
    ER_BLOB_KEY_WITHOUT_LENGTH: 1170,
    ER_PRIMARY_CANT_HAVE_NULL: 1171,
    ER_TOO_MANY_ROWS: 1172,
    ER_REQUIRES_PRIMARY_KEY: 1173,
    ER_NO_RAID_COMPILED: 1174,
    ER_UPDATE_WITHOUT_KEY_IN_SAFE_MODE: 1175,
    ER_KEY_DOES_NOT_EXITS: 1176,
    ER_CHECK_NO_SUCH_TABLE: 1177,
    ER_CHECK_NOT_IMPLEMENTED: 1178,
    ER_CANT_DO_THIS_DURING_AN_TRANSACTION: 1179,
    ER_ERROR_DURING_COMMIT: 1180,
    ER_ERROR_DURING_ROLLBACK: 1181,
    ER_ERROR_DURING_FLUSH_LOGS: 1182,
    ER_ERROR_DURING_CHECKPOINT: 1183,
    ER_NEW_ABORTING_CONNECTION: 1184,
    ER_DUMP_NOT_IMPLEMENTED: 1185,
    ER_FLUSH_MASTER_BINLOG_CLOSED: 1186,
    ER_INDEX_REBUILD: 1187,
    ER_MASTER: 1188,
    ER_MASTER_NET_READ: 1189,
    ER_MASTER_NET_WRITE: 1190,
    ER_FT_MATCHING_KEY_NOT_FOUND: 1191,
    ER_LOCK_OR_ACTIVE_TRANSACTION: 1192,
    ER_UNKNOWN_SYSTEM_VARIABLE: 1193,
    ER_CRASHED_ON_USAGE: 1194,
    ER_CRASHED_ON_REPAIR: 1195,
    ER_WARNING_NOT_COMPLETE_ROLLBACK: 1196,
    ER_TRANS_CACHE_FULL: 1197,
    ER_SLAVE_MUST_STOP: 1198,
    ER_SLAVE_NOT_RUNNING: 1199,
    ER_BAD_SLAVE: 1200,
    ER_MASTER_INFO: 1201,
    ER_SLAVE_THREAD: 1202,
    ER_TOO_MANY_USER_CONNECTIONS: 1203,
    ER_SET_CONSTANTS_ONLY: 1204,
    ER_LOCK_WAIT_TIMEOUT: 1205,
    ER_LOCK_TABLE_FULL: 1206,
    ER_READ_ONLY_TRANSACTION: 1207,
    ER_DROP_DB_WITH_READ_LOCK: 1208,
    ER_CREATE_DB_WITH_READ_LOCK: 1209,
    ER_WRONG_ARGUMENTS: 1210,
    ER_NO_PERMISSION_TO_CREATE_USER: 1211,
    ER_UNION_TABLES_IN_DIFFERENT_DIR: 1212,
    ER_LOCK_DEADLOCK: 1213,
    ER_TABLE_CANT_HANDLE_FT: 1214,
    ER_CANNOT_ADD_FOREIGN: 1215,
    ER_NO_REFERENCED_ROW: 1216,
    ER_ROW_IS_REFERENCED: 1217,
    ER_CONNECT_TO_MASTER: 1218,
    ER_QUERY_ON_MASTER: 1219,
    ER_ERROR_WHEN_EXECUTING_COMMAND: 1220,
    ER_WRONG_USAGE: 1221,
    ER_WRONG_NUMBER_OF_COLUMNS_IN_SELECT: 1222,
    ER_CANT_UPDATE_WITH_READLOCK: 1223,
    ER_MIXING_NOT_ALLOWED: 1224,
    ER_DUP_ARGUMENT: 1225,
    ER_USER_LIMIT_REACHED: 1226,
    ER_SPECIFIC_ACCESS_DENIED_ERROR: 1227,
    ER_LOCAL_VARIABLE: 1228,
    ER_GLOBAL_VARIABLE: 1229,
    ER_NO_DEFAULT: 1230,
    ER_WRONG_VALUE_FOR_VAR: 1231,
    ER_WRONG_TYPE_FOR_VAR: 1232,
    ER_VAR_CANT_BE_READ: 1233,
    ER_CANT_USE_OPTION_HERE: 1234,
    ER_NOT_SUPPORTED_YET: 1235,
    ER_MASTER_FATAL_ERROR_READING_BINLOG: 1236,
    ER_SLAVE_IGNORED_TABLE: 1237,
    ER_INCORRECT_GLOBAL_LOCAL_VAR: 1238,
    ER_WRONG_FK_DEF: 1239,
    ER_KEY_REF_DO_NOT_MATCH_TABLE_REF: 1240,
    ER_OPERAND_COLUMNS: 1241,
    ER_SUBQUERY_NO_1_ROW: 1242,
    ER_UNKNOWN_STMT_HANDLER: 1243,
    ER_CORRUPT_HELP_DB: 1244,
    ER_CYCLIC_REFERENCE: 1245,
    ER_AUTO_CONVERT: 1246,
    ER_ILLEGAL_REFERENCE: 1247,
    ER_DERIVED_MUST_HAVE_ALIAS: 1248,
    ER_SELECT_REDUCED: 1249,
    ER_TABLENAME_NOT_ALLOWED_HERE: 1250,
    ER_NOT_SUPPORTED_AUTH_MODE: 1251,
    ER_SPATIAL_CANT_HAVE_NULL: 1252,
    ER_COLLATION_CHARSET_MISMATCH: 1253,
    ER_SLAVE_WAS_RUNNING: 1254,
    ER_SLAVE_WAS_NOT_RUNNING: 1255,
    ER_TOO_BIG_FOR_UNCOMPRESS: 1256,
    ER_ZLIB_Z_MEM_ERROR: 1257,
    ER_ZLIB_Z_BUF_ERROR: 1258,
    ER_ZLIB_Z_DATA_ERROR: 1259,
    ER_CUT_VALUE_GROUP_CONCAT: 1260,
    ER_WARN_TOO_FEW_RECORDS: 1261,
    ER_WARN_TOO_MANY_RECORDS: 1262,
    ER_WARN_NULL_TO_NOTNULL: 1263,
    ER_WARN_DATA_OUT_OF_RANGE: 1264,
    WARN_DATA_TRUNCATED: 1265,
    ER_WARN_USING_OTHER_HANDLER: 1266,
    ER_CANT_AGGREGATE_2COLLATIONS: 1267,
    ER_DROP_USER: 1268,
    ER_REVOKE_GRANTS: 1269,
    ER_CANT_AGGREGATE_3COLLATIONS: 1270,
    ER_CANT_AGGREGATE_NCOLLATIONS: 1271,
    ER_VARIABLE_IS_NOT_STRUCT: 1272,
    ER_UNKNOWN_COLLATION: 1273,
    ER_SLAVE_IGNORED_SSL_PARAMS: 1274,
    ER_SERVER_IS_IN_SECURE_AUTH_MODE: 1275,
    ER_WARN_FIELD_RESOLVED: 1276,
    ER_BAD_SLAVE_UNTIL_COND: 1277,
    ER_MISSING_SKIP_SLAVE: 1278,
    ER_UNTIL_COND_IGNORED: 1279,
    ER_WRONG_NAME_FOR_INDEX: 1280,
    ER_WRONG_NAME_FOR_CATALOG: 1281,
    ER_WARN_QC_RESIZE: 1282,
    ER_BAD_FT_COLUMN: 1283,
    ER_UNKNOWN_KEY_CACHE: 1284,
    ER_WARN_HOSTNAME_WONT_WORK: 1285,
    ER_UNKNOWN_STORAGE_ENGINE: 1286,
    ER_WARN_DEPRECATED_SYNTAX: 1287,
    ER_NON_UPDATABLE_TABLE: 1288,
    ER_FEATURE_DISABLED: 1289,
    ER_OPTION_PREVENTS_STATEMENT: 1290,
    ER_DUPLICATED_VALUE_IN_TYPE: 1291,
    ER_TRUNCATED_WRONG_VALUE: 1292,
    ER_TOO_MUCH_AUTO_TIMESTAMP_COLS: 1293,
    ER_INVALID_ON_UPDATE: 1294,
    ER_UNSUPPORTED_PS: 1295,
    ER_GET_ERRMSG: 1296,
    ER_GET_TEMPORARY_ERRMSG: 1297,
    ER_UNKNOWN_TIME_ZONE: 1298,
    ER_WARN_INVALID_TIMESTAMP: 1299,
    ER_INVALID_CHARACTER_STRING: 1300,
    ER_WARN_ALLOWED_PACKET_OVERFLOWED: 1301,
    ER_CONFLICTING_DECLARATIONS: 1302,
    ER_SP_NO_RECURSIVE_CREATE: 1303,
    ER_SP_ALREADY_EXISTS: 1304,
    ER_SP_DOES_NOT_EXIST: 1305,
    ER_SP_DROP_FAILED: 1306,
    ER_SP_STORE_FAILED: 1307,
    ER_SP_LILABEL_MISMATCH: 1308,
    ER_SP_LABEL_REDEFINE: 1309,
    ER_SP_LABEL_MISMATCH: 1310,
    ER_SP_UNINIT_VAR: 1311,
    ER_SP_BADSELECT: 1312,
    ER_SP_BADRETURN: 1313,
    ER_SP_BADSTATEMENT: 1314,
    ER_UPDATE_LOG_DEPRECATED_IGNORED: 1315,
    ER_UPDATE_LOG_DEPRECATED_TRANSLATED: 1316,
    ER_QUERY_INTERRUPTED: 1317,
    ER_SP_WRONG_NO_OF_ARGS: 1318,
    ER_SP_COND_MISMATCH: 1319,
    ER_SP_NORETURN: 1320,
    ER_SP_NORETURNEND: 1321,
    ER_SP_BAD_CURSOR_QUERY: 1322,
    ER_SP_BAD_CURSOR_SELECT: 1323,
    ER_SP_CURSOR_MISMATCH: 1324,
    ER_SP_CURSOR_ALREADY_OPEN: 1325,
    ER_SP_CURSOR_NOT_OPEN: 1326,
    ER_SP_UNDECLARED_VAR: 1327,
    ER_SP_WRONG_NO_OF_FETCH_ARGS: 1328,
    ER_SP_FETCH_NO_DATA: 1329,
    ER_SP_DUP_PARAM: 1330,
    ER_SP_DUP_VAR: 1331,
    ER_SP_DUP_COND: 1332,
    ER_SP_DUP_CURS: 1333,
    ER_SP_CANT_ALTER: 1334,
    ER_SP_SUBSELECT_NYI: 1335,
    ER_STMT_NOT_ALLOWED_IN_SF_OR_TRG: 1336,
    ER_SP_VARCOND_AFTER_CURSHNDLR: 1337,
    ER_SP_CURSOR_AFTER_HANDLER: 1338,
    ER_SP_CASE_NOT_FOUND: 1339,
    ER_FPARSER_TOO_BIG_FILE: 1340,
    ER_FPARSER_BAD_HEADER: 1341,
    ER_FPARSER_EOF_IN_COMMENT: 1342,
    ER_FPARSER_ERROR_IN_PARAMETER: 1343,
    ER_FPARSER_EOF_IN_UNKNOWN_PARAMETER: 1344,
    ER_VIEW_NO_EXPLAIN: 1345,
    ER_FRM_UNKNOWN_TYPE: 1346,
    ER_WRONG_OBJECT: 1347,
    ER_NONUPDATEABLE_COLUMN: 1348,
    ER_VIEW_SELECT_DERIVED: 1349,
    ER_VIEW_SELECT_CLAUSE: 1350,
    ER_VIEW_SELECT_VARIABLE: 1351,
    ER_VIEW_SELECT_TMPTABLE: 1352,
    ER_VIEW_WRONG_LIST: 1353,
    ER_WARN_VIEW_MERGE: 1354,
    ER_WARN_VIEW_WITHOUT_KEY: 1355,
    ER_VIEW_INVALID: 1356,
    ER_SP_NO_DROP_SP: 1357,
    ER_SP_GOTO_IN_HNDLR: 1358,
    ER_TRG_ALREADY_EXISTS: 1359,
    ER_TRG_DOES_NOT_EXIST: 1360,
    ER_TRG_ON_VIEW_OR_TEMP_TABLE: 1361,
    ER_TRG_CANT_CHANGE_ROW: 1362,
    ER_TRG_NO_SUCH_ROW_IN_TRG: 1363,
    ER_NO_DEFAULT_FOR_FIELD: 1364,
    ER_DIVISION_BY_ZERO: 1365,
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 1366,
    ER_ILLEGAL_VALUE_FOR_TYPE: 1367,
    ER_VIEW_NONUPD_CHECK: 1368,
    ER_VIEW_CHECK_FAILED: 1369,
    ER_PROCACCESS_DENIED_ERROR: 1370,
    ER_RELAY_LOG_FAIL: 1371,
    ER_PASSWD_LENGTH: 1372,
    ER_UNKNOWN_TARGET_BINLOG: 1373,
    ER_IO_ERR_LOG_INDEX_READ: 1374,
    ER_BINLOG_PURGE_PROHIBITED: 1375,
    ER_FSEEK_FAIL: 1376,
    ER_BINLOG_PURGE_FATAL_ERR: 1377,
    ER_LOG_IN_USE: 1378,
    ER_LOG_PURGE_UNKNOWN_ERR: 1379,
    ER_RELAY_LOG_INIT: 1380,
    ER_NO_BINARY_LOGGING: 1381,
    ER_RESERVED_SYNTAX: 1382,
    ER_WSAS_FAILED: 1383,
    ER_DIFF_GROUPS_PROC: 1384,
    ER_NO_GROUP_FOR_PROC: 1385,
    ER_ORDER_WITH_PROC: 1386,
    ER_LOGGING_PROHIBIT_CHANGING_OF: 1387,
    ER_NO_FILE_MAPPING: 1388,
    ER_WRONG_MAGIC: 1389,
    ER_PS_MANY_PARAM: 1390,
    ER_KEY_PART_0: 1391,
    ER_VIEW_CHECKSUM: 1392,
    ER_VIEW_MULTIUPDATE: 1393,
    ER_VIEW_NO_INSERT_FIELD_LIST: 1394,
    ER_VIEW_DELETE_MERGE_VIEW: 1395,
    ER_CANNOT_USER: 1396,
    ER_XAER_NOTA: 1397,
    ER_XAER_INVAL: 1398,
    ER_XAER_RMFAIL: 1399,
    ER_XAER_OUTSIDE: 1400,
    ER_XAER_RMERR: 1401,
    ER_XA_RBROLLBACK: 1402,
    ER_NONEXISTING_PROC_GRANT: 1403,
    ER_PROC_AUTO_GRANT_FAIL: 1404,
    ER_PROC_AUTO_REVOKE_FAIL: 1405,
    ER_DATA_TOO_LONG: 1406,
    ER_SP_BAD_SQLSTATE: 1407,
    ER_STARTUP: 1408,
    ER_LOAD_FROM_FIXED_SIZE_ROWS_TO_VAR: 1409,
    ER_CANT_CREATE_USER_WITH_GRANT: 1410,
    ER_WRONG_VALUE_FOR_TYPE: 1411,
    ER_TABLE_DEF_CHANGED: 1412,
    ER_SP_DUP_HANDLER: 1413,
    ER_SP_NOT_VAR_ARG: 1414,
    ER_SP_NO_RETSET: 1415,
    ER_CANT_CREATE_GEOMETRY_OBJECT: 1416,
    ER_FAILED_ROUTINE_BREAK_BINLOG: 1417,
    ER_BINLOG_UNSAFE_ROUTINE: 1418,
    ER_BINLOG_CREATE_ROUTINE_NEED_SUPER: 1419,
    ER_EXEC_STMT_WITH_OPEN_CURSOR: 1420,
    ER_STMT_HAS_NO_OPEN_CURSOR: 1421,
    ER_COMMIT_NOT_ALLOWED_IN_SF_OR_TRG: 1422,
    ER_NO_DEFAULT_FOR_VIEW_FIELD: 1423,
    ER_SP_NO_RECURSION: 1424,
    ER_TOO_BIG_SCALE: 1425,
    ER_TOO_BIG_PRECISION: 1426,
    ER_M_BIGGER_THAN_D: 1427,
    ER_WRONG_LOCK_OF_SYSTEM_TABLE: 1428,
    ER_CONNECT_TO_FOREIGN_DATA_SOURCE: 1429,
    ER_QUERY_ON_FOREIGN_DATA_SOURCE: 1430,
    ER_FOREIGN_DATA_SOURCE_DOESNT_EXIST: 1431,
    ER_FOREIGN_DATA_STRING_INVALID_CANT_CREATE: 1432,
    ER_FOREIGN_DATA_STRING_INVALID: 1433,
    ER_CANT_CREATE_FEDERATED_TABLE: 1434,
    ER_TRG_IN_WRONG_SCHEMA: 1435,
    ER_STACK_OVERRUN_NEED_MORE: 1436,
    ER_TOO_LONG_BODY: 1437,
    ER_WARN_CANT_DROP_DEFAULT_KEYCACHE: 1438,
    ER_TOO_BIG_DISPLAYWIDTH: 1439,
    ER_XAER_DUPID: 1440,
    ER_DATETIME_FUNCTION_OVERFLOW: 1441,
    ER_CANT_UPDATE_USED_TABLE_IN_SF_OR_TRG: 1442,
    ER_VIEW_PREVENT_UPDATE: 1443,
    ER_PS_NO_RECURSION: 1444,
    ER_SP_CANT_SET_AUTOCOMMIT: 1445,
    ER_MALFORMED_DEFINER: 1446,
    ER_VIEW_FRM_NO_USER: 1447,
    ER_VIEW_OTHER_USER: 1448,
    ER_NO_SUCH_USER: 1449,
    ER_FORBID_SCHEMA_CHANGE: 1450,
    ER_ROW_IS_REFERENCED_2: 1451,
    ER_NO_REFERENCED_ROW_2: 1452,
    ER_SP_BAD_VAR_SHADOW: 1453,
    ER_TRG_NO_DEFINER: 1454,
    ER_OLD_FILE_FORMAT: 1455,
    ER_SP_RECURSION_LIMIT: 1456,
    ER_SP_PROC_TABLE_CORRUPT: 1457,
    ER_SP_WRONG_NAME: 1458,
    ER_TABLE_NEEDS_UPGRADE: 1459,
    ER_SP_NO_AGGREGATE: 1460,
    ER_MAX_PREPARED_STMT_COUNT_REACHED: 1461,
    ER_VIEW_RECURSIVE: 1462,
    ER_NON_GROUPING_FIELD_USED: 1463,
    ER_TABLE_CANT_HANDLE_SPKEYS: 1464,
    ER_NO_TRIGGERS_ON_SYSTEM_SCHEMA: 1465,
    ER_REMOVED_SPACES: 1466,
    ER_AUTOINC_READ_FAILED: 1467,
    ER_USERNAME: 1468,
    ER_HOSTNAME: 1469,
    ER_WRONG_STRING_LENGTH: 1470,
    ER_NON_INSERTABLE_TABLE: 1471,
    ER_ADMIN_WRONG_MRG_TABLE: 1472,
    ER_TOO_HIGH_LEVEL_OF_NESTING_FOR_SELECT: 1473,
    ER_NAME_BECOMES_EMPTY: 1474,
    ER_AMBIGUOUS_FIELD_TERM: 1475,
    ER_FOREIGN_SERVER_EXISTS: 1476,
    ER_FOREIGN_SERVER_DOESNT_EXIST: 1477,
    ER_ILLEGAL_HA_CREATE_OPTION: 1478,
    ER_PARTITION_REQUIRES_VALUES_ERROR: 1479,
    ER_PARTITION_WRONG_VALUES_ERROR: 1480,
    ER_PARTITION_MAXVALUE_ERROR: 1481,
    ER_PARTITION_SUBPARTITION_ERROR: 1482,
    ER_PARTITION_SUBPART_MIX_ERROR: 1483,
    ER_PARTITION_WRONG_NO_PART_ERROR: 1484,
    ER_PARTITION_WRONG_NO_SUBPART_ERROR: 1485,
    ER_WRONG_EXPR_IN_PARTITION_FUNC_ERROR: 1486,
    ER_NO_CONST_EXPR_IN_RANGE_OR_LIST_ERROR: 1487,
    ER_FIELD_NOT_FOUND_PART_ERROR: 1488,
    ER_LIST_OF_FIELDS_ONLY_IN_HASH_ERROR: 1489,
    ER_INCONSISTENT_PARTITION_INFO_ERROR: 1490,
    ER_PARTITION_FUNC_NOT_ALLOWED_ERROR: 1491,
    ER_PARTITIONS_MUST_BE_DEFINED_ERROR: 1492,
    ER_RANGE_NOT_INCREASING_ERROR: 1493,
    ER_INCONSISTENT_TYPE_OF_FUNCTIONS_ERROR: 1494,
    ER_MULTIPLE_DEF_CONST_IN_LIST_PART_ERROR: 1495,
    ER_PARTITION_ENTRY_ERROR: 1496,
    ER_MIX_HANDLER_ERROR: 1497,
    ER_PARTITION_NOT_DEFINED_ERROR: 1498,
    ER_TOO_MANY_PARTITIONS_ERROR: 1499,
    ER_SUBPARTITION_ERROR: 1500,
    ER_CANT_CREATE_HANDLER_FILE: 1501,
    ER_BLOB_FIELD_IN_PART_FUNC_ERROR: 1502,
    ER_UNIQUE_KEY_NEED_ALL_FIELDS_IN_PF: 1503,
    ER_NO_PARTS_ERROR: 1504,
    ER_PARTITION_MGMT_ON_NONPARTITIONED: 1505,
    ER_FOREIGN_KEY_ON_PARTITIONED: 1506,
    ER_DROP_PARTITION_NON_EXISTENT: 1507,
    ER_DROP_LAST_PARTITION: 1508,
    ER_COALESCE_ONLY_ON_HASH_PARTITION: 1509,
    ER_REORG_HASH_ONLY_ON_SAME_NO: 1510,
    ER_REORG_NO_PARAM_ERROR: 1511,
    ER_ONLY_ON_RANGE_LIST_PARTITION: 1512,
    ER_ADD_PARTITION_SUBPART_ERROR: 1513,
    ER_ADD_PARTITION_NO_NEW_PARTITION: 1514,
    ER_COALESCE_PARTITION_NO_PARTITION: 1515,
    ER_REORG_PARTITION_NOT_EXIST: 1516,
    ER_SAME_NAME_PARTITION: 1517,
    ER_NO_BINLOG_ERROR: 1518,
    ER_CONSECUTIVE_REORG_PARTITIONS: 1519,
    ER_REORG_OUTSIDE_RANGE: 1520,
    ER_PARTITION_FUNCTION_FAILURE: 1521,
    ER_PART_STATE_ERROR: 1522,
    ER_LIMITED_PART_RANGE: 1523,
    ER_PLUGIN_IS_NOT_LOADED: 1524,
    ER_WRONG_VALUE: 1525,
    ER_NO_PARTITION_FOR_GIVEN_VALUE: 1526,
    ER_FILEGROUP_OPTION_ONLY_ONCE: 1527,
    ER_CREATE_FILEGROUP_FAILED: 1528,
    ER_DROP_FILEGROUP_FAILED: 1529,
    ER_TABLESPACE_AUTO_EXTEND_ERROR: 1530,
    ER_WRONG_SIZE_NUMBER: 1531,
    ER_SIZE_OVERFLOW_ERROR: 1532,
    ER_ALTER_FILEGROUP_FAILED: 1533,
    ER_BINLOG_ROW_LOGGING_FAILED: 1534,
    ER_BINLOG_ROW_WRONG_TABLE_DEF: 1535,
    ER_BINLOG_ROW_RBR_TO_SBR: 1536,
    ER_EVENT_ALREADY_EXISTS: 1537,
    ER_EVENT_STORE_FAILED: 1538,
    ER_EVENT_DOES_NOT_EXIST: 1539,
    ER_EVENT_CANT_ALTER: 1540,
    ER_EVENT_DROP_FAILED: 1541,
    ER_EVENT_INTERVAL_NOT_POSITIVE_OR_TOO_BIG: 1542,
    ER_EVENT_ENDS_BEFORE_STARTS: 1543,
    ER_EVENT_EXEC_TIME_IN_THE_PAST: 1544,
    ER_EVENT_OPEN_TABLE_FAILED: 1545,
    ER_EVENT_NEITHER_M_EXPR_NOR_M_AT: 1546,
    ER_COL_COUNT_DOESNT_MATCH_CORRUPTED: 1547,
    ER_CANNOT_LOAD_FROM_TABLE: 1548,
    ER_EVENT_CANNOT_DELETE: 1549,
    ER_EVENT_COMPILE_ERROR: 1550,
    ER_EVENT_SAME_NAME: 1551,
    ER_EVENT_DATA_TOO_LONG: 1552,
    ER_DROP_INDEX_FK: 1553,
    ER_WARN_DEPRECATED_SYNTAX_WITH_VER: 1554,
    ER_CANT_WRITE_LOCK_LOG_TABLE: 1555,
    ER_CANT_LOCK_LOG_TABLE: 1556,
    ER_FOREIGN_DUPLICATE_KEY: 1557,
    ER_COL_COUNT_DOESNT_MATCH_PLEASE_UPDATE: 1558,
    ER_TEMP_TABLE_PREVENTS_SWITCH_OUT_OF_RBR: 1559,
    ER_STORED_FUNCTION_PREVENTS_SWITCH_BINLOG_FORMAT: 1560,
    ER_NDB_CANT_SWITCH_BINLOG_FORMAT: 1561,
    ER_PARTITION_NO_TEMPORARY: 1562,
    ER_PARTITION_CONST_DOMAIN_ERROR: 1563,
    ER_PARTITION_FUNCTION_IS_NOT_ALLOWED: 1564,
    ER_DDL_LOG_ERROR: 1565,
    ER_NULL_IN_VALUES_LESS_THAN: 1566,
    ER_WRONG_PARTITION_NAME: 1567,
    ER_CANT_CHANGE_TX_CHARACTERISTICS: 1568,
    ER_DUP_ENTRY_AUTOINCREMENT_CASE: 1569,
    ER_EVENT_MODIFY_QUEUE_ERROR: 1570,
    ER_EVENT_SET_VAR_ERROR: 1571,
    ER_PARTITION_MERGE_ERROR: 1572,
    ER_CANT_ACTIVATE_LOG: 1573,
    ER_RBR_NOT_AVAILABLE: 1574,
    ER_BASE64_DECODE_ERROR: 1575,
    ER_EVENT_RECURSION_FORBIDDEN: 1576,
    ER_EVENTS_DB_ERROR: 1577,
    ER_ONLY_INTEGERS_ALLOWED: 1578,
    ER_UNSUPORTED_LOG_ENGINE: 1579,
    ER_BAD_LOG_STATEMENT: 1580,
    ER_CANT_RENAME_LOG_TABLE: 1581,
    ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT: 1582,
    ER_WRONG_PARAMETERS_TO_NATIVE_FCT: 1583,
    ER_WRONG_PARAMETERS_TO_STORED_FCT: 1584,
    ER_NATIVE_FCT_NAME_COLLISION: 1585,
    ER_DUP_ENTRY_WITH_KEY_NAME: 1586,
    ER_BINLOG_PURGE_EMFILE: 1587,
    ER_EVENT_CANNOT_CREATE_IN_THE_PAST: 1588,
    ER_EVENT_CANNOT_ALTER_IN_THE_PAST: 1589,
    ER_SLAVE_INCIDENT: 1590,
    ER_NO_PARTITION_FOR_GIVEN_VALUE_SILENT: 1591,
    ER_BINLOG_UNSAFE_STATEMENT: 1592,
    ER_SLAVE_FATAL_ERROR: 1593,
    ER_SLAVE_RELAY_LOG_READ_FAILURE: 1594,
    ER_SLAVE_RELAY_LOG_WRITE_FAILURE: 1595,
    ER_SLAVE_CREATE_EVENT_FAILURE: 1596,
    ER_SLAVE_MASTER_COM_FAILURE: 1597,
    ER_BINLOG_LOGGING_IMPOSSIBLE: 1598,
    ER_VIEW_NO_CREATION_CTX: 1599,
    ER_VIEW_INVALID_CREATION_CTX: 1600,
    ER_SR_INVALID_CREATION_CTX: 1601,
    ER_TRG_CORRUPTED_FILE: 1602,
    ER_TRG_NO_CREATION_CTX: 1603,
    ER_TRG_INVALID_CREATION_CTX: 1604,
    ER_EVENT_INVALID_CREATION_CTX: 1605,
    ER_TRG_CANT_OPEN_TABLE: 1606,
    ER_CANT_CREATE_SROUTINE: 1607,
    ER_NEVER_USED: 1608,
    ER_NO_FORMAT_DESCRIPTION_EVENT_BEFORE_BINLOG_STATEMENT: 1609,
    ER_SLAVE_CORRUPT_EVENT: 1610,
    ER_LOAD_DATA_INVALID_COLUMN: 1611,
    ER_LOG_PURGE_NO_FILE: 1612,
    ER_XA_RBTIMEOUT: 1613,
    ER_XA_RBDEADLOCK: 1614,
    ER_NEED_REPREPARE: 1615,
    ER_DELAYED_NOT_SUPPORTED: 1616,
    WARN_NO_MASTER_INFO: 1617,
    WARN_OPTION_IGNORED: 1618,
    ER_PLUGIN_DELETE_BUILTIN: 1619,
    WARN_PLUGIN_BUSY: 1620,
    ER_VARIABLE_IS_READONLY: 1621,
    ER_WARN_ENGINE_TRANSACTION_ROLLBACK: 1622,
    ER_SLAVE_HEARTBEAT_FAILURE: 1623,
    ER_SLAVE_HEARTBEAT_VALUE_OUT_OF_RANGE: 1624,
    ER_NDB_REPLICATION_SCHEMA_ERROR: 1625,
    ER_CONFLICT_FN_PARSE_ERROR: 1626,
    ER_EXCEPTIONS_WRITE_ERROR: 1627,
    ER_TOO_LONG_TABLE_COMMENT: 1628,
    ER_TOO_LONG_FIELD_COMMENT: 1629,
    ER_FUNC_INEXISTENT_NAME_COLLISION: 1630,
    ER_DATABASE_NAME: 1631,
    ER_TABLE_NAME: 1632,
    ER_PARTITION_NAME: 1633,
    ER_SUBPARTITION_NAME: 1634,
    ER_TEMPORARY_NAME: 1635,
    ER_RENAMED_NAME: 1636,
    ER_TOO_MANY_CONCURRENT_TRXS: 1637,
    WARN_NON_ASCII_SEPARATOR_NOT_IMPLEMENTED: 1638,
    ER_DEBUG_SYNC_TIMEOUT: 1639,
    ER_DEBUG_SYNC_HIT_LIMIT: 1640,
    ER_DUP_SIGNAL_SET: 1641,
    ER_SIGNAL_WARN: 1642,
    ER_SIGNAL_NOT_FOUND: 1643,
    ER_SIGNAL_EXCEPTION: 1644,
    ER_RESIGNAL_WITHOUT_ACTIVE_HANDLER: 1645,
    ER_SIGNAL_BAD_CONDITION_TYPE: 1646,
    WARN_COND_ITEM_TRUNCATED: 1647,
    ER_COND_ITEM_TOO_LONG: 1648,
    ER_UNKNOWN_LOCALE: 1649,
    ER_SLAVE_IGNORE_SERVER_IDS: 1650,
    ER_QUERY_CACHE_DISABLED: 1651,
    ER_SAME_NAME_PARTITION_FIELD: 1652,
    ER_PARTITION_COLUMN_LIST_ERROR: 1653,
    ER_WRONG_TYPE_COLUMN_VALUE_ERROR: 1654,
    ER_TOO_MANY_PARTITION_FUNC_FIELDS_ERROR: 1655,
    ER_MAXVALUE_IN_VALUES_IN: 1656,
    ER_TOO_MANY_VALUES_ERROR: 1657,
    ER_ROW_SINGLE_PARTITION_FIELD_ERROR: 1658,
    ER_FIELD_TYPE_NOT_ALLOWED_AS_PARTITION_FIELD: 1659,
    ER_PARTITION_FIELDS_TOO_LONG: 1660,
    ER_BINLOG_ROW_ENGINE_AND_STMT_ENGINE: 1661,
    ER_BINLOG_ROW_MODE_AND_STMT_ENGINE: 1662,
    ER_BINLOG_UNSAFE_AND_STMT_ENGINE: 1663,
    ER_BINLOG_ROW_INJECTION_AND_STMT_ENGINE: 1664,
    ER_BINLOG_STMT_MODE_AND_ROW_ENGINE: 1665,
    ER_BINLOG_ROW_INJECTION_AND_STMT_MODE: 1666,
    ER_BINLOG_MULTIPLE_ENGINES_AND_SELF_LOGGING_ENGINE: 1667,
    ER_BINLOG_UNSAFE_LIMIT: 1668,
    ER_BINLOG_UNSAFE_INSERT_DELAYED: 1669,
    ER_BINLOG_UNSAFE_SYSTEM_TABLE: 1670,
    ER_BINLOG_UNSAFE_AUTOINC_COLUMNS: 1671,
    ER_BINLOG_UNSAFE_UDF: 1672,
    ER_BINLOG_UNSAFE_SYSTEM_VARIABLE: 1673,
    ER_BINLOG_UNSAFE_SYSTEM_FUNCTION: 1674,
    ER_BINLOG_UNSAFE_NONTRANS_AFTER_TRANS: 1675,
    ER_MESSAGE_AND_STATEMENT: 1676,
    ER_SLAVE_CONVERSION_FAILED: 1677,
    ER_SLAVE_CANT_CREATE_CONVERSION: 1678,
    ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_BINLOG_FORMAT: 1679,
    ER_PATH_LENGTH: 1680,
    ER_WARN_DEPRECATED_SYNTAX_NO_REPLACEMENT: 1681,
    ER_WRONG_NATIVE_TABLE_STRUCTURE: 1682,
    ER_WRONG_PERFSCHEMA_USAGE: 1683,
    ER_WARN_I_S_SKIPPED_TABLE: 1684,
    ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_BINLOG_DIRECT: 1685,
    ER_STORED_FUNCTION_PREVENTS_SWITCH_BINLOG_DIRECT: 1686,
    ER_SPATIAL_MUST_HAVE_GEOM_COL: 1687,
    ER_TOO_LONG_INDEX_COMMENT: 1688,
    ER_LOCK_ABORTED: 1689,
    ER_DATA_OUT_OF_RANGE: 1690,
    ER_WRONG_SPVAR_TYPE_IN_LIMIT: 1691,
    ER_BINLOG_UNSAFE_MULTIPLE_ENGINES_AND_SELF_LOGGING_ENGINE: 1692,
    ER_BINLOG_UNSAFE_MIXED_STATEMENT: 1693,
    ER_INSIDE_TRANSACTION_PREVENTS_SWITCH_SQL_LOG_BIN: 1694,
    ER_STORED_FUNCTION_PREVENTS_SWITCH_SQL_LOG_BIN: 1695,
    ER_FAILED_READ_FROM_PAR_FILE: 1696,
    ER_VALUES_IS_NOT_INT_TYPE_ERROR: 1697,
    ER_ACCESS_DENIED_NO_PASSWORD_ERROR: 1698,
    ER_SET_PASSWORD_AUTH_PLUGIN: 1699,
    ER_GRANT_PLUGIN_USER_EXISTS: 1700,
    ER_TRUNCATE_ILLEGAL_FK: 1701,
    ER_PLUGIN_IS_PERMANENT: 1702,
    ER_SLAVE_HEARTBEAT_VALUE_OUT_OF_RANGE_MIN: 1703,
    ER_SLAVE_HEARTBEAT_VALUE_OUT_OF_RANGE_MAX: 1704,
    ER_STMT_CACHE_FULL: 1705,
    ER_MULTI_UPDATE_KEY_CONFLICT: 1706,
    ER_TABLE_NEEDS_REBUILD: 1707,
    WARN_OPTION_BELOW_LIMIT: 1708,
    ER_INDEX_COLUMN_TOO_LONG: 1709,
    ER_ERROR_IN_TRIGGER_BODY: 1710,
    ER_ERROR_IN_UNKNOWN_TRIGGER_BODY: 1711,
    ER_INDEX_CORRUPT: 1712,
    ER_UNDO_RECORD_TOO_BIG: 1713,
    ER_BINLOG_UNSAFE_INSERT_IGNORE_SELECT: 1714,
    ER_BINLOG_UNSAFE_INSERT_SELECT_UPDATE: 1715,
    ER_BINLOG_UNSAFE_REPLACE_SELECT: 1716,
    ER_BINLOG_UNSAFE_CREATE_IGNORE_SELECT: 1717,
    ER_BINLOG_UNSAFE_CREATE_REPLACE_SELECT: 1718,
    ER_BINLOG_UNSAFE_UPDATE_IGNORE: 1719,
    ER_PLUGIN_NO_UNINSTALL: 1720,
    ER_PLUGIN_NO_INSTALL: 1721,
    ER_BINLOG_UNSAFE_WRITE_AUTOINC_SELECT: 1722,
    ER_BINLOG_UNSAFE_CREATE_SELECT_AUTOINC: 1723,
    ER_BINLOG_UNSAFE_INSERT_TWO_KEYS: 1724,
    ER_TABLE_IN_FK_CHECK: 1725,
    ER_UNSUPPORTED_ENGINE: 1726,
    ER_BINLOG_UNSAFE_AUTOINC_NOT_FIRST: 1727,
    ER_CANNOT_LOAD_FROM_TABLE_V2: 1728,
    ER_MASTER_DELAY_VALUE_OUT_OF_RANGE: 1729,
    ER_ONLY_FD_AND_RBR_EVENTS_ALLOWED_IN_BINLOG_STATEMENT: 1730,
    ER_PARTITION_EXCHANGE_DIFFERENT_OPTION: 1731,
    ER_PARTITION_EXCHANGE_PART_TABLE: 1732,
    ER_PARTITION_EXCHANGE_TEMP_TABLE: 1733,
    ER_PARTITION_INSTEAD_OF_SUBPARTITION: 1734,
    ER_UNKNOWN_PARTITION: 1735,
    ER_TABLES_DIFFERENT_METADATA: 1736,
    ER_ROW_DOES_NOT_MATCH_PARTITION: 1737,
    ER_BINLOG_CACHE_SIZE_GREATER_THAN_MAX: 1738,
    ER_WARN_INDEX_NOT_APPLICABLE: 1739,
    ER_PARTITION_EXCHANGE_FOREIGN_KEY: 1740,
    ER_NO_SUCH_KEY_VALUE: 1741,
    ER_RPL_INFO_DATA_TOO_LONG: 1742,
    ER_NETWORK_READ_EVENT_CHECKSUM_FAILURE: 1743,
    ER_BINLOG_READ_EVENT_CHECKSUM_FAILURE: 1744,
    ER_BINLOG_STMT_CACHE_SIZE_GREATER_THAN_MAX: 1745,
    ER_CANT_UPDATE_TABLE_IN_CREATE_TABLE_SELECT: 1746,
    ER_PARTITION_CLAUSE_ON_NONPARTITIONED: 1747,
    ER_ROW_DOES_NOT_MATCH_GIVEN_PARTITION_SET: 1748,
    ER_NO_SUCH_PARTITION: 1749,
    ER_CHANGE_RPL_INFO_REPOSITORY_FAILURE: 1750,
    ER_WARNING_NOT_COMPLETE_ROLLBACK_WITH_CREATED_TEMP_TABLE: 1751,
    ER_WARNING_NOT_COMPLETE_ROLLBACK_WITH_DROPPED_TEMP_TABLE: 1752,
    ER_MTS_FEATURE_IS_NOT_SUPPORTED: 1753,
    ER_MTS_UPDATED_DBS_GREATER_MAX: 1754,
    ER_MTS_CANT_PARALLEL: 1755,
    ER_MTS_INCONSISTENT_DATA: 1756,
    ER_FULLTEXT_NOT_SUPPORTED_WITH_PARTITIONING: 1757,
    ER_DA_INVALID_CONDITION_NUMBER: 1758,
    ER_INSECURE_PLAIN_TEXT: 1759,
    ER_INSECURE_CHANGE_MASTER: 1760,
    ER_FOREIGN_DUPLICATE_KEY_WITH_CHILD_INFO: 1761,
    ER_FOREIGN_DUPLICATE_KEY_WITHOUT_CHILD_INFO: 1762,
    ER_SQLTHREAD_WITH_SECURE_SLAVE: 1763,
    ER_TABLE_HAS_NO_FT: 1764,
    ER_VARIABLE_NOT_SETTABLE_IN_SF_OR_TRIGGER: 1765,
    ER_VARIABLE_NOT_SETTABLE_IN_TRANSACTION: 1766,
    ER_GTID_NEXT_IS_NOT_IN_GTID_NEXT_LIST: 1767,
    ER_CANT_CHANGE_GTID_NEXT_IN_TRANSACTION: 1768,
    ER_SET_STATEMENT_CANNOT_INVOKE_FUNCTION: 1769,
    ER_GTID_NEXT_CANT_BE_AUTOMATIC_IF_GTID_NEXT_LIST_IS_NON_NULL: 1770,
    ER_SKIPPING_LOGGED_TRANSACTION: 1771,
    ER_MALFORMED_GTID_SET_SPECIFICATION: 1772,
    ER_MALFORMED_GTID_SET_ENCODING: 1773,
    ER_MALFORMED_GTID_SPECIFICATION: 1774,
    ER_GNO_EXHAUSTED: 1775,
    ER_BAD_SLAVE_AUTO_POSITION: 1776,
    ER_AUTO_POSITION_REQUIRES_GTID_MODE_NOT_OFF: 1777,
    ER_CANT_DO_IMPLICIT_COMMIT_IN_TRX_WHEN_GTID_NEXT_IS_SET: 1778,
    ER_GTID_MODE_ON_REQUIRES_ENFORCE_GTID_CONSISTENCY_ON: 1779,
    ER_GTID_MODE_REQUIRES_BINLOG: 1780,
    ER_CANT_SET_GTID_NEXT_TO_GTID_WHEN_GTID_MODE_IS_OFF: 1781,
    ER_CANT_SET_GTID_NEXT_TO_ANONYMOUS_WHEN_GTID_MODE_IS_ON: 1782,
    ER_CANT_SET_GTID_NEXT_LIST_TO_NON_NULL_WHEN_GTID_MODE_IS_OFF: 1783,
    ER_FOUND_GTID_EVENT_WHEN_GTID_MODE_IS_OFF: 1784,
    ER_GTID_UNSAFE_NON_TRANSACTIONAL_TABLE: 1785,
    ER_GTID_UNSAFE_CREATE_SELECT: 1786,
    ER_GTID_UNSAFE_CREATE_DROP_TEMPORARY_TABLE_IN_TRANSACTION: 1787,
    ER_GTID_MODE_CAN_ONLY_CHANGE_ONE_STEP_AT_A_TIME: 1788,
    ER_MASTER_HAS_PURGED_REQUIRED_GTIDS: 1789,
    ER_CANT_SET_GTID_NEXT_WHEN_OWNING_GTID: 1790,
    ER_UNKNOWN_EXPLAIN_FORMAT: 1791,
    ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION: 1792,
    ER_TOO_LONG_TABLE_PARTITION_COMMENT: 1793,
    ER_SLAVE_CONFIGURATION: 1794,
    ER_INNODB_FT_LIMIT: 1795,
    ER_INNODB_NO_FT_TEMP_TABLE: 1796,
    ER_INNODB_FT_WRONG_DOCID_COLUMN: 1797,
    ER_INNODB_FT_WRONG_DOCID_INDEX: 1798,
    ER_INNODB_ONLINE_LOG_TOO_BIG: 1799,
    ER_UNKNOWN_ALTER_ALGORITHM: 1800,
    ER_UNKNOWN_ALTER_LOCK: 1801,
    ER_MTS_CHANGE_MASTER_CANT_RUN_WITH_GAPS: 1802,
    ER_MTS_RECOVERY_FAILURE: 1803,
    ER_MTS_RESET_WORKERS: 1804,
    ER_COL_COUNT_DOESNT_MATCH_CORRUPTED_V2: 1805,
    ER_SLAVE_SILENT_RETRY_TRANSACTION: 1806,
    ER_DISCARD_FK_CHECKS_RUNNING: 1807,
    ER_TABLE_SCHEMA_MISMATCH: 1808,
    ER_TABLE_IN_SYSTEM_TABLESPACE: 1809,
    ER_IO_READ_ERROR: 1810,
    ER_IO_WRITE_ERROR: 1811,
    ER_TABLESPACE_MISSING: 1812,
    ER_TABLESPACE_EXISTS: 1813,
    ER_TABLESPACE_DISCARDED: 1814,
    ER_INTERNAL_ERROR: 1815,
    ER_INNODB_IMPORT_ERROR: 1816,
    ER_INNODB_INDEX_CORRUPT: 1817,
    ER_INVALID_YEAR_COLUMN_LENGTH: 1818,
    ER_NOT_VALID_PASSWORD: 1819,
    ER_MUST_CHANGE_PASSWORD: 1820,
    ER_FK_NO_INDEX_CHILD: 1821,
    ER_FK_NO_INDEX_PARENT: 1822,
    ER_FK_FAIL_ADD_SYSTEM: 1823,
    ER_FK_CANNOT_OPEN_PARENT: 1824,
    ER_FK_INCORRECT_OPTION: 1825,
    ER_FK_DUP_NAME: 1826,
    ER_PASSWORD_FORMAT: 1827,
    ER_FK_COLUMN_CANNOT_DROP: 1828,
    ER_FK_COLUMN_CANNOT_DROP_CHILD: 1829,
    ER_FK_COLUMN_NOT_NULL: 1830,
    ER_DUP_INDEX: 1831,
    ER_FK_COLUMN_CANNOT_CHANGE: 1832,
    ER_FK_COLUMN_CANNOT_CHANGE_CHILD: 1833,
    ER_FK_CANNOT_DELETE_PARENT: 1834,
    ER_MALFORMED_PACKET: 1835,
    ER_READ_ONLY_MODE: 1836,
    ER_GTID_NEXT_TYPE_UNDEFINED_GROUP: 1837,
    ER_VARIABLE_NOT_SETTABLE_IN_SP: 1838,
    ER_CANT_SET_GTID_PURGED_WHEN_GTID_MODE_IS_OFF: 1839,
    ER_CANT_SET_GTID_PURGED_WHEN_GTID_EXECUTED_IS_NOT_EMPTY: 1840,
    ER_CANT_SET_GTID_PURGED_WHEN_OWNED_GTIDS_IS_NOT_EMPTY: 1841,
    ER_GTID_PURGED_WAS_CHANGED: 1842,
    ER_GTID_EXECUTED_WAS_CHANGED: 1843,
    ER_BINLOG_STMT_MODE_AND_NO_REPL_TABLES: 1844,
    ER_ALTER_OPERATION_NOT_SUPPORTED: 1845,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON: 1846,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_COPY: 1847,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_PARTITION: 1848,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_FK_RENAME: 1849,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_COLUMN_TYPE: 1850,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_FK_CHECK: 1851,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_IGNORE: 1852,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_NOPK: 1853,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_AUTOINC: 1854,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_HIDDEN_FTS: 1855,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_CHANGE_FTS: 1856,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_FTS: 1857,
    ER_SQL_SLAVE_SKIP_COUNTER_NOT_SETTABLE_IN_GTID_MODE: 1858,
    ER_DUP_UNKNOWN_IN_INDEX: 1859,
    ER_IDENT_CAUSES_TOO_LONG_PATH: 1860,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_NOT_NULL: 1861,
    ER_MUST_CHANGE_PASSWORD_LOGIN: 1862,
    ER_ROW_IN_WRONG_PARTITION: 1863,
    ER_MTS_EVENT_BIGGER_PENDING_JOBS_SIZE_MAX: 1864,
    ER_INNODB_NO_FT_USES_PARSER: 1865,
    ER_BINLOG_LOGICAL_CORRUPTION: 1866,
    ER_WARN_PURGE_LOG_IN_USE: 1867,
    ER_WARN_PURGE_LOG_IS_ACTIVE: 1868,
    ER_AUTO_INCREMENT_CONFLICT: 1869,
    WARN_ON_BLOCKHOLE_IN_RBR: 1870,
    ER_SLAVE_MI_INIT_REPOSITORY: 1871,
    ER_SLAVE_RLI_INIT_REPOSITORY: 1872,
    ER_ACCESS_DENIED_CHANGE_USER_ERROR: 1873,
    ER_INNODB_READ_ONLY: 1874,
    ER_STOP_SLAVE_SQL_THREAD_TIMEOUT: 1875,
    ER_STOP_SLAVE_IO_THREAD_TIMEOUT: 1876,
    ER_TABLE_CORRUPT: 1877,
    ER_TEMP_FILE_WRITE_FAILURE: 1878,
    ER_INNODB_FT_AUX_NOT_HEX_ID: 1879,
    ER_OLD_TEMPORALS_UPGRADED: 1880,
    ER_INNODB_FORCED_RECOVERY: 1881,
    ER_AES_INVALID_IV: 1882,
    ER_PLUGIN_CANNOT_BE_UNINSTALLED: 1883,
    ER_GTID_UNSAFE_BINLOG_SPLITTABLE_STATEMENT_AND_GTID_GROUP: 1884,
    ER_SLAVE_HAS_MORE_GTIDS_THAN_MASTER: 1885,
    ER_MISSING_KEY: 1886,
    WARN_NAMED_PIPE_ACCESS_EVERYONE: 1887,
    ER_FOUND_MISSING_GTIDS: 1888,
    ER_FILE_CORRUPT: 3000,
    ER_ERROR_ON_MASTER: 3001,
    ER_INCONSISTENT_ERROR: 3002,
    ER_STORAGE_ENGINE_NOT_LOADED: 3003,
    ER_GET_STACKED_DA_WITHOUT_ACTIVE_HANDLER: 3004,
    ER_WARN_LEGACY_SYNTAX_CONVERTED: 3005,
    ER_BINLOG_UNSAFE_FULLTEXT_PLUGIN: 3006,
    ER_CANNOT_DISCARD_TEMPORARY_TABLE: 3007,
    ER_FK_DEPTH_EXCEEDED: 3008,
    ER_COL_COUNT_DOESNT_MATCH_PLEASE_UPDATE_V2: 3009,
    ER_WARN_TRIGGER_DOESNT_HAVE_CREATED: 3010,
    ER_REFERENCED_TRG_DOES_NOT_EXIST: 3011,
    ER_EXPLAIN_NOT_SUPPORTED: 3012,
    ER_INVALID_FIELD_SIZE: 3013,
    ER_MISSING_HA_CREATE_OPTION: 3014,
    ER_ENGINE_OUT_OF_MEMORY: 3015,
    ER_PASSWORD_EXPIRE_ANONYMOUS_USER: 3016,
    ER_SLAVE_SQL_THREAD_MUST_STOP: 3017,
    ER_NO_FT_MATERIALIZED_SUBQUERY: 3018,
    ER_INNODB_UNDO_LOG_FULL: 3019,
    ER_INVALID_ARGUMENT_FOR_LOGARITHM: 3020,
    ER_SLAVE_CHANNEL_IO_THREAD_MUST_STOP: 3021,
    ER_WARN_OPEN_TEMP_TABLES_MUST_BE_ZERO: 3022,
    ER_WARN_ONLY_MASTER_LOG_FILE_NO_POS: 3023,
    ER_QUERY_TIMEOUT: 3024,
    ER_NON_RO_SELECT_DISABLE_TIMER: 3025,
    ER_DUP_LIST_ENTRY: 3026,
    ER_SQL_MODE_NO_EFFECT: 3027,
    ER_AGGREGATE_ORDER_FOR_UNION: 3028,
    ER_AGGREGATE_ORDER_NON_AGG_QUERY: 3029,
    ER_SLAVE_WORKER_STOPPED_PREVIOUS_THD_ERROR: 3030,
    ER_DONT_SUPPORT_SLAVE_PRESERVE_COMMIT_ORDER: 3031,
    ER_SERVER_OFFLINE_MODE: 3032,
    ER_GIS_DIFFERENT_SRIDS: 3033,
    ER_GIS_UNSUPPORTED_ARGUMENT: 3034,
    ER_GIS_UNKNOWN_ERROR: 3035,
    ER_GIS_UNKNOWN_EXCEPTION: 3036,
    ER_GIS_INVALID_DATA: 3037,
    ER_BOOST_GEOMETRY_EMPTY_INPUT_EXCEPTION: 3038,
    ER_BOOST_GEOMETRY_CENTROID_EXCEPTION: 3039,
    ER_BOOST_GEOMETRY_OVERLAY_INVALID_INPUT_EXCEPTION: 3040,
    ER_BOOST_GEOMETRY_TURN_INFO_EXCEPTION: 3041,
    ER_BOOST_GEOMETRY_SELF_INTERSECTION_POINT_EXCEPTION: 3042,
    ER_BOOST_GEOMETRY_UNKNOWN_EXCEPTION: 3043,
    ER_STD_BAD_ALLOC_ERROR: 3044,
    ER_STD_DOMAIN_ERROR: 3045,
    ER_STD_LENGTH_ERROR: 3046,
    ER_STD_INVALID_ARGUMENT: 3047,
    ER_STD_OUT_OF_RANGE_ERROR: 3048,
    ER_STD_OVERFLOW_ERROR: 3049,
    ER_STD_RANGE_ERROR: 3050,
    ER_STD_UNDERFLOW_ERROR: 3051,
    ER_STD_LOGIC_ERROR: 3052,
    ER_STD_RUNTIME_ERROR: 3053,
    ER_STD_UNKNOWN_EXCEPTION: 3054,
    ER_GIS_DATA_WRONG_ENDIANESS: 3055,
    ER_CHANGE_MASTER_PASSWORD_LENGTH: 3056,
    ER_USER_LOCK_WRONG_NAME: 3057,
    ER_USER_LOCK_DEADLOCK: 3058,
    ER_REPLACE_INACCESSIBLE_ROWS: 3059,
    ER_ALTER_OPERATION_NOT_SUPPORTED_REASON_GIS: 3060,
    ER_ILLEGAL_USER_VAR: 3061,
    ER_GTID_MODE_OFF: 3062,
    ER_UNSUPPORTED_BY_REPLICATION_THREAD: 3063,
    ER_INCORRECT_TYPE: 3064,
    ER_FIELD_IN_ORDER_NOT_SELECT: 3065,
    ER_AGGREGATE_IN_ORDER_NOT_SELECT: 3066,
    ER_INVALID_RPL_WILD_TABLE_FILTER_PATTERN: 3067,
    ER_NET_OK_PACKET_TOO_LARGE: 3068,
    ER_INVALID_JSON_DATA: 3069,
    ER_INVALID_GEOJSON_MISSING_MEMBER: 3070,
    ER_INVALID_GEOJSON_WRONG_TYPE: 3071,
    ER_INVALID_GEOJSON_UNSPECIFIED: 3072,
    ER_DIMENSION_UNSUPPORTED: 3073,
    ER_SLAVE_CHANNEL_DOES_NOT_EXIST: 3074,
    ER_SLAVE_MULTIPLE_CHANNELS_HOST_PORT: 3075,
    ER_SLAVE_CHANNEL_NAME_INVALID_OR_TOO_LONG: 3076,
    ER_SLAVE_NEW_CHANNEL_WRONG_REPOSITORY: 3077,
    ER_SLAVE_CHANNEL_DELETE: 3078,
    ER_SLAVE_MULTIPLE_CHANNELS_CMD: 3079,
    ER_SLAVE_MAX_CHANNELS_EXCEEDED: 3080,
    ER_SLAVE_CHANNEL_MUST_STOP: 3081,
    ER_SLAVE_CHANNEL_NOT_RUNNING: 3082,
    ER_SLAVE_CHANNEL_WAS_RUNNING: 3083,
    ER_SLAVE_CHANNEL_WAS_NOT_RUNNING: 3084,
    ER_SLAVE_CHANNEL_SQL_THREAD_MUST_STOP: 3085,
    ER_SLAVE_CHANNEL_SQL_SKIP_COUNTER: 3086,
    ER_WRONG_FIELD_WITH_GROUP_V2: 3087,
    ER_MIX_OF_GROUP_FUNC_AND_FIELDS_V2: 3088,
    ER_WARN_DEPRECATED_SYSVAR_UPDATE: 3089,
    ER_WARN_DEPRECATED_SQLMODE: 3090,
    ER_CANNOT_LOG_PARTIAL_DROP_DATABASE_WITH_GTID: 3091,
    ER_GROUP_REPLICATION_CONFIGURATION: 3092,
    ER_GROUP_REPLICATION_RUNNING: 3093,
    ER_GROUP_REPLICATION_APPLIER_INIT_ERROR: 3094,
    ER_GROUP_REPLICATION_STOP_APPLIER_THREAD_TIMEOUT: 3095,
    ER_GROUP_REPLICATION_COMMUNICATION_LAYER_SESSION_ERROR: 3096,
    ER_GROUP_REPLICATION_COMMUNICATION_LAYER_JOIN_ERROR: 3097,
    ER_BEFORE_DML_VALIDATION_ERROR: 3098,
    ER_PREVENTS_VARIABLE_WITHOUT_RBR: 3099,
    ER_RUN_HOOK_ERROR: 3100,
    ER_TRANSACTION_ROLLBACK_DURING_COMMIT: 3101,
    ER_GENERATED_COLUMN_FUNCTION_IS_NOT_ALLOWED: 3102,
    ER_UNSUPPORTED_ALTER_INPLACE_ON_VIRTUAL_COLUMN: 3103,
    ER_WRONG_FK_OPTION_FOR_GENERATED_COLUMN: 3104,
    ER_NON_DEFAULT_VALUE_FOR_GENERATED_COLUMN: 3105,
    ER_UNSUPPORTED_ACTION_ON_GENERATED_COLUMN: 3106,
    ER_GENERATED_COLUMN_NON_PRIOR: 3107,
    ER_DEPENDENT_BY_GENERATED_COLUMN: 3108,
    ER_GENERATED_COLUMN_REF_AUTO_INC: 3109,
    ER_FEATURE_NOT_AVAILABLE: 3110,
    ER_CANT_SET_GTID_MODE: 3111,
    ER_CANT_USE_AUTO_POSITION_WITH_GTID_MODE_OFF: 3112,
    ER_CANT_REPLICATE_ANONYMOUS_WITH_AUTO_POSITION: 3113,
    ER_CANT_REPLICATE_ANONYMOUS_WITH_GTID_MODE_ON: 3114,
    ER_CANT_REPLICATE_GTID_WITH_GTID_MODE_OFF: 3115,
    ER_CANT_SET_ENFORCE_GTID_CONSISTENCY_ON_WITH_ONGOING_GTID_VIOLATING_TRANSACTIONS: 3116,
    ER_SET_ENFORCE_GTID_CONSISTENCY_WARN_WITH_ONGOING_GTID_VIOLATING_TRANSACTIONS: 3117,
    ER_ACCOUNT_HAS_BEEN_LOCKED: 3118,
    ER_WRONG_TABLESPACE_NAME: 3119,
    ER_TABLESPACE_IS_NOT_EMPTY: 3120,
    ER_WRONG_FILE_NAME: 3121,
    ER_BOOST_GEOMETRY_INCONSISTENT_TURNS_EXCEPTION: 3122,
    ER_WARN_OPTIMIZER_HINT_SYNTAX_ERROR: 3123,
    ER_WARN_BAD_MAX_EXECUTION_TIME: 3124,
    ER_WARN_UNSUPPORTED_MAX_EXECUTION_TIME: 3125,
    ER_WARN_CONFLICTING_HINT: 3126,
    ER_WARN_UNKNOWN_QB_NAME: 3127,
    ER_UNRESOLVED_HINT_NAME: 3128,
    ER_WARN_ON_MODIFYING_GTID_EXECUTED_TABLE: 3129,
    ER_PLUGGABLE_PROTOCOL_COMMAND_NOT_SUPPORTED: 3130,
    ER_LOCKING_SERVICE_WRONG_NAME: 3131,
    ER_LOCKING_SERVICE_DEADLOCK: 3132,
    ER_LOCKING_SERVICE_TIMEOUT: 3133,
    ER_GIS_MAX_POINTS_IN_GEOMETRY_OVERFLOWED: 3134,
    ER_SQL_MODE_MERGED: 3135,
    ER_VTOKEN_PLUGIN_TOKEN_MISMATCH: 3136,
    ER_VTOKEN_PLUGIN_TOKEN_NOT_FOUND: 3137,
    ER_CANT_SET_VARIABLE_WHEN_OWNING_GTID: 3138,
    ER_SLAVE_CHANNEL_OPERATION_NOT_ALLOWED: 3139,
    ER_INVALID_JSON_TEXT: 3140,
    ER_INVALID_JSON_TEXT_IN_PARAM: 3141,
    ER_INVALID_JSON_BINARY_DATA: 3142,
    ER_INVALID_JSON_PATH: 3143,
    ER_INVALID_JSON_CHARSET: 3144,
    ER_INVALID_JSON_CHARSET_IN_FUNCTION: 3145,
    ER_INVALID_TYPE_FOR_JSON: 3146,
    ER_INVALID_CAST_TO_JSON: 3147,
    ER_INVALID_JSON_PATH_CHARSET: 3148,
    ER_INVALID_JSON_PATH_WILDCARD: 3149,
    ER_JSON_VALUE_TOO_BIG: 3150,
    ER_JSON_KEY_TOO_BIG: 3151,
    ER_JSON_USED_AS_KEY: 3152,
    ER_JSON_VACUOUS_PATH: 3153,
    ER_JSON_BAD_ONE_OR_ALL_ARG: 3154,
    ER_NUMERIC_JSON_VALUE_OUT_OF_RANGE: 3155,
    ER_INVALID_JSON_VALUE_FOR_CAST: 3156,
    ER_JSON_DOCUMENT_TOO_DEEP: 3157,
    ER_JSON_DOCUMENT_NULL_KEY: 3158,
    ER_SECURE_TRANSPORT_REQUIRED: 3159,
    ER_NO_SECURE_TRANSPORTS_CONFIGURED: 3160,
    ER_DISABLED_STORAGE_ENGINE: 3161,
    ER_USER_DOES_NOT_EXIST: 3162,
    ER_USER_ALREADY_EXISTS: 3163,
    ER_AUDIT_API_ABORT: 3164,
    ER_INVALID_JSON_PATH_ARRAY_CELL: 3165,
    ER_BUFPOOL_RESIZE_INPROGRESS: 3166,
    ER_FEATURE_DISABLED_SEE_DOC: 3167,
    ER_SERVER_ISNT_AVAILABLE: 3168,
    ER_SESSION_WAS_KILLED: 3169,
    ER_CAPACITY_EXCEEDED: 3170,
    ER_CAPACITY_EXCEEDED_IN_RANGE_OPTIMIZER: 3171,
    ER_TABLE_NEEDS_UPG_PART: 3172,
    ER_CANT_WAIT_FOR_EXECUTED_GTID_SET_WHILE_OWNING_A_GTID: 3173,
    ER_CANNOT_ADD_FOREIGN_BASE_COL_VIRTUAL: 3174,
    ER_CANNOT_CREATE_VIRTUAL_INDEX_CONSTRAINT: 3175,
    ER_ERROR_ON_MODIFYING_GTID_EXECUTED_TABLE: 3176,
    ER_LOCK_REFUSED_BY_ENGINE: 3177,
    ER_UNSUPPORTED_ALTER_ONLINE_ON_VIRTUAL_COLUMN: 3178,
    ER_MASTER_KEY_ROTATION_NOT_SUPPORTED_BY_SE: 3179,
    ER_MASTER_KEY_ROTATION_ERROR_BY_SE: 3180,
    ER_MASTER_KEY_ROTATION_BINLOG_FAILED: 3181,
    ER_MASTER_KEY_ROTATION_SE_UNAVAILABLE: 3182,
    ER_TABLESPACE_CANNOT_ENCRYPT: 3183,
    ER_INVALID_ENCRYPTION_OPTION: 3184,
    ER_CANNOT_FIND_KEY_IN_KEYRING: 3185,
    ER_CAPACITY_EXCEEDED_IN_PARSER: 3186,
    ER_UNSUPPORTED_ALTER_ENCRYPTION_INPLACE: 3187,
    ER_KEYRING_UDF_KEYRING_SERVICE_ERROR: 3188,
    ER_USER_COLUMN_OLD_LENGTH: 3189,
    ER_CANT_RESET_MASTER: 3190,
    ER_GROUP_REPLICATION_MAX_GROUP_SIZE: 3191,
    ER_CANNOT_ADD_FOREIGN_BASE_COL_STORED: 3192,
    ER_TABLE_REFERENCED: 3193,
    ER_PARTITION_ENGINE_DEPRECATED_FOR_TABLE: 3194,
    ER_WARN_USING_GEOMFROMWKB_TO_SET_SRID_ZERO: 3195,
    ER_WARN_USING_GEOMFROMWKB_TO_SET_SRID: 3196,
    ER_XA_RETRY: 3197,
    ER_KEYRING_AWS_UDF_AWS_KMS_ERROR: 3198,
    ER_BINLOG_UNSAFE_XA: 3199,
    ER_UDF_ERROR: 3200,
    ER_KEYRING_MIGRATION_FAILURE: 3201,
    ER_KEYRING_ACCESS_DENIED_ERROR: 3202,
    ER_KEYRING_MIGRATION_STATUS: 3203,
    ER_PLUGIN_FAILED_TO_OPEN_TABLES: 3204,
    ER_PLUGIN_FAILED_TO_OPEN_TABLE: 3205,
    ER_AUDIT_LOG_NO_KEYRING_PLUGIN_INSTALLED: 3206,
    ER_AUDIT_LOG_ENCRYPTION_PASSWORD_HAS_NOT_BEEN_SET: 3207,
    ER_AUDIT_LOG_COULD_NOT_CREATE_AES_KEY: 3208,
    ER_AUDIT_LOG_ENCRYPTION_PASSWORD_CANNOT_BE_FETCHED: 3209,
    ER_AUDIT_LOG_JSON_FILTERING_NOT_ENABLED: 3210,
    ER_AUDIT_LOG_UDF_INSUFFICIENT_PRIVILEGE: 3211,
    ER_AUDIT_LOG_SUPER_PRIVILEGE_REQUIRED: 3212,
    ER_COULD_NOT_REINITIALIZE_AUDIT_LOG_FILTERS: 3213,
    ER_AUDIT_LOG_UDF_INVALID_ARGUMENT_TYPE: 3214,
    ER_AUDIT_LOG_UDF_INVALID_ARGUMENT_COUNT: 3215,
    ER_AUDIT_LOG_HAS_NOT_BEEN_INSTALLED: 3216,
    ER_AUDIT_LOG_UDF_READ_INVALID_MAX_ARRAY_LENGTH_ARG_TYPE: 3217,
    ER_AUDIT_LOG_UDF_READ_INVALID_MAX_ARRAY_LENGTH_ARG_VALUE: 3218,
    ER_AUDIT_LOG_JSON_FILTER_PARSING_ERROR: 3219,
    ER_AUDIT_LOG_JSON_FILTER_NAME_CANNOT_BE_EMPTY: 3220,
    ER_AUDIT_LOG_JSON_USER_NAME_CANNOT_BE_EMPTY: 3221,
    ER_AUDIT_LOG_JSON_FILTER_DOES_NOT_EXISTS: 3222,
    ER_AUDIT_LOG_USER_FIRST_CHARACTER_MUST_BE_ALPHANUMERIC: 3223,
    ER_AUDIT_LOG_USER_NAME_INVALID_CHARACTER: 3224,
    ER_AUDIT_LOG_HOST_NAME_INVALID_CHARACTER: 3225,
    WARN_DEPRECATED_MAXDB_SQL_MODE_FOR_TIMESTAMP: 3226,
    ER_XA_REPLICATION_FILTERS: 3227,
    ER_CANT_OPEN_ERROR_LOG: 3228,
    ER_GROUPING_ON_TIMESTAMP_IN_DST: 3229,
    ER_CANT_START_SERVER_NAMED_PIPE: 3230,
};

function jsonStringify(value, replacer, space) {
    try {
        return JSON.stringify(value, replacer, space);
    }
    catch {
        return '';
    }
}
function trackFirstSeen(map, keys) {
    let ret = true;
    if (keys.length > 1) {
        let sub = map.get(keys[0]);
        if (sub) {
            if (sub.has(keys[1])) {
                ret = false;
            }
            else {
                sub.set(keys[1], true);
            }
        }
        else {
            sub = new Map();
            sub.set(keys[1], true);
            map.set(keys[0], sub);
        }
    }
    else if (map.has(keys[0])) {
        ret = false;
    }
    else {
        map.set(keys[0], true);
    }
    return ret;
}

const { isNativeError } = node_util.types;
const DEFAULT_ERRNO = 1002;
const DEFAULT_CODE = 'ER_NO';
const ERROR_MAP = {
    dup_table_insert: {
        code: 'ER_DUP_ENTRY',
        sqlMessage: errStr `Duplicate entry for table '${0}' and item '${1}'`,
    },
    dup: { code: 'ER_DUP_ENTRY', sqlMessage: 'Duplicate entry' },
    dup_primary_key_entry: {
        code: 'ER_DUP_ENTRY',
        sqlMessage: errStr `Duplicate entry for value '${1}' for '${0}'`,
    },
    parse: {
        code: 'ER_PARSE_ERROR',
        sqlMessage: errStr `You have an error in your SQL syntax; check your syntax near column ${1} at line ${0}`,
    },
    syntax_err: {
        code: 'ER_PARSE_ERROR',
        sqlMessage: errStr `You have an error in your SQL syntax; check your syntax near ${0}`,
    },
    ER_EMPTY_QUERY: { code: 'ER_EMPTY_QUERY', sqlMessage: 'Query was empty' },
    multiple_statements_disabled: {
        code: 'ER_PARSE_ERROR',
        sqlMessage: 'Multiple statements are disabled.  See the "multipleStatements" session option.',
    },
    unsupported: { code: 'ER_NO', sqlMessage: 'Unsupport sql feature.' },
    unsupported_type: {
        code: 'ER_NO',
        sqlMessage: errStr `Unsupported query type: ${0}`,
    },
    database_no_drop_builtin: {
        code: 'ER_DBACCESS_DENIED_ERROR',
        sqlMessage: "Can't drop a built in database",
    },
    database_exists: {
        code: 'ER_DB_CREATE_EXISTS',
        sqlMessage: 'Database exists',
    },
    no_current_database: {
        code: 'ER_NO_DB_ERROR',
        sqlMessage: 'No database selected',
    },
    db_not_found: {
        code: 'ER_BAD_DB_ERROR',
        sqlMessage: errStr `Unknown database '${0}'`,
    },
    table_not_found: {
        code: 'ER_NO_SUCH_TABLE',
        sqlMessage: errStr `Table '${0}' doesn't exist`,
    },
    column_not_found: {
        code: 'ER_BAD_FIELD_ERROR',
        sqlMessage: errStr `Unknown column '${0}'`,
    },
    ER_BAD_TABLE_ERROR: {
        code: 'ER_BAD_TABLE_ERROR',
        sqlMessage: errStr `Unknown  table '${0}'`,
    },
    ER_SP_DOES_NOT_EXIST: {
        code: 'ER_SP_DOES_NOT_EXIST',
        sqlMessage: errStr `FUNCTION ${0} does not exist`,
    },
    ER_TOO_BIG_PRECISION: {
        code: 'ER_TOO_BIG_PRECISION',
        sqlMessage: 'Too-big precision specified. Maximum is 6.',
    },
    table_exists: {
        code: 'ER_TABLE_EXISTS_ERROR',
        sqlMessage: 'Table already exists.',
    },
    bad_interval_usage: {
        code: 'ER_PARSE_ERROR',
        sqlMessage: 'You have an error in your SQL syntax.  Check near "INTERVAL".',
    },
    ER_WRONG_VALUE_COUNT_ON_ROW: {
        code: 'ER_WRONG_VALUE_COUNT_ON_ROW',
        sqlMessage: errStr `Column count doesn't match value count at row ${0}`,
    },
    ER_BAD_NULL_ERROR: { code: 'ER_BAD_NULL_ERROR' },
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: {
        code: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
    },
    ER_KEY_COLUMN_DOES_NOT_EXITS: {
        code: 'ER_KEY_COLUMN_DOES_NOT_EXITS',
        sqlMessage: errStr `Key column '${0}' doesn't exist in table`,
    },
    ER_DUP_KEYNAME: {
        code: 'ER_DUP_KEYNAME',
        sqlMessage: errStr `Duplicate key name '${0}'`,
    },
    ER_CANT_DROP_FIELD_OR_KEY: {
        code: 'ER_CANT_DROP_FIELD_OR_KEY',
        sqlMessage: errStr `Can't DROP '${0}'; check that column/key exists`,
    },
    ER_UNKNOWN_STORAGE_ENGINE: {
        code: 'ER_UNKNOWN_STORAGE_ENGINE',
        sqlMessage: errStr `Unknown storage engine '${0}'`,
    },
    access_denied: {
        code: 'ER_DBACCESS_DENIED_ERROR',
        sqlMessage: 'Access denied',
    },
};
class SQLError extends Error {
    code;
    errno;
    sqlStateMarker;
    sqlState;
    fieldCount;
    fatal = false;
    sqlMessage;
    sql;
    index;
    constructor(err, sql) {
        const sql_err = ERROR_MAP[err] || ERROR_MAP[err.err];
        const code = err.code || sql_err?.code || DEFAULT_CODE;
        const errno = err.errno ||
            sql_err?.errno ||
            CODE_ERRNO[code] ||
            DEFAULT_ERRNO;
        let sqlMessage = err.sqlMessage || sql_err?.sqlMessage;
        if (typeof sqlMessage === 'function') {
            sqlMessage = sqlMessage(err.args);
        }
        const index = typeof err === 'string' ? 0 : (err.index ?? 0);
        const message = err.message ||
            sqlMessage ||
            (typeof err === 'string' ? err : undefined);
        if (err.cause) {
            super(message, { cause: err.cause });
        }
        else if (isNativeError(err) || code === DEFAULT_CODE) {
            super(message, { cause: err });
        }
        else {
            super(message);
        }
        this.code = code;
        this.errno = errno;
        this.index = index;
        if (sqlMessage) {
            this.sqlMessage = sqlMessage;
        }
        if (sql) {
            this.sql = sql;
        }
    }
}
function errStr(strings, ...index_list) {
    return function (arg_list) {
        let s = '';
        for (let i = 0; i < strings.length; i++) {
            s += strings[i];
            s += _stringify(arg_list?.[index_list?.[i]]);
        }
        return s;
    };
}
function _stringify(arg) {
    let ret = arg || '';
    if (arg === null) {
        ret = 'NULL';
    }
    else if (Array.isArray(arg)) {
        ret = arg.map(_stringify).join(',');
    }
    else if (typeof arg === 'object' &&
        arg.toString === Object.prototype.toString) {
        ret = jsonStringify(arg);
    }
    return ret;
}
class NoSingleOperationError extends Error {
    constructor() {
        super('no_single');
        this.name = 'NoSingleOperationError';
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var mysql = {};

var hasRequiredMysql;

function requireMysql () {
	if (hasRequiredMysql) return mysql;
	hasRequiredMysql = 1;
	(function (exports) {
		!function(r,t){for(var e in t)r[e]=t[e];}(exports,function(r){var t={};function e(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:false,exports:{}};return r[n].call(o.exports,o,o.exports,e),o.l=true,o.exports}return e.m=r,e.c=t,e.d=function(r,t,n){e.o(r,t)||Object.defineProperty(r,t,{enumerable:true,get:n});},e.r=function(r){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(r,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(r,"__esModule",{value:true});},e.t=function(r,t){if(1&t&&(r=e(r)),8&t)return r;if(4&t&&"object"==typeof r&&r&&r.__esModule)return r;var n=Object.create(null);if(e.r(n),Object.defineProperty(n,"default",{enumerable:true,value:r}),2&t&&"string"!=typeof r)for(var o in r)e.d(n,o,function(t){return r[t]}.bind(null,o));return n},e.n=function(r){var t=r&&r.__esModule?function(){return r.default}:function(){return r};return e.d(t,"a",t),t},e.o=function(r,t){return Object.prototype.hasOwnProperty.call(r,t)},e.p="",e(e.s=1)}([function(r,t,e){var n=e(2);function o(r,t,e,n){this.message=r,this.expected=t,this.found=e,this.location=n,this.name="SyntaxError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(this,o);}!function(r,t){function e(){this.constructor=r;}e.prototype=t.prototype,r.prototype=new e;}(o,Error),o.buildMessage=function(r,t){var e={literal:function(r){return '"'+o(r.text)+'"'},class:function(r){var t,e="";for(t=0;t<r.parts.length;t++)e+=r.parts[t]instanceof Array?s(r.parts[t][0])+"-"+s(r.parts[t][1]):s(r.parts[t]);return "["+(r.inverted?"^":"")+e+"]"},any:function(r){return "any character"},end:function(r){return "end of input"},other:function(r){return r.description}};function n(r){return r.charCodeAt(0).toString(16).toUpperCase()}function o(r){return r.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(r){return "\\x0"+n(r)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(r){return "\\x"+n(r)}))}function s(r){return r.replace(/\\/g,"\\\\").replace(/\]/g,"\\]").replace(/\^/g,"\\^").replace(/-/g,"\\-").replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(r){return "\\x0"+n(r)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(r){return "\\x"+n(r)}))}return "Expected "+function(r){var t,n,o,s=new Array(r.length);for(t=0;t<r.length;t++)s[t]=(o=r[t],e[o.type](o));if(s.sort(),s.length>0){for(t=1,n=1;t<s.length;t++)s[t-1]!==s[t]&&(s[n]=s[t],n++);s.length=n;}switch(s.length){case 1:return s[0];case 2:return s[0]+" or "+s[1];default:return s.slice(0,-1).join(", ")+", or "+s[s.length-1]}}(r)+" but "+function(r){return r?'"'+o(r)+'"':"end of input"}(t)+" found."},r.exports={SyntaxError:o,parse:function(r,t){t=void 0!==t?t:{};var e,s={},u={start:ac},a=ac,i=function(r,t){return fv(r,t)},c=function(r,t){return {...r,order_by:t&&t.toLowerCase()}},l=function(r,t){return fv(r,t,1)},f=tc("IF",true),b="IDENTIFIED",p=tc("IDENTIFIED",false),v=tc("WITH",true),d=tc("BY",true),y=tc("RANDOM",true),w=tc("PASSWORD",true),L=tc("AS",true),C=function(r,t){return fv(r,t)},h=tc("role",true),m=tc("NONE",true),E=tc("SSL",true),A=tc("X509",true),T=tc("CIPHER",true),_=tc("ISSUER",true),g=tc("SUBJECT",true),I=function(r,t){return t.prefix=r.toLowerCase(),t},S=tc("REQUIRE",true),N=tc("MAX_QUERIES_PER_HOUR",true),O=tc("MAX_UPDATES_PER_HOUR",true),R=tc("MAX_CONNECTIONS_PER_HOUR",true),x=tc("MAX_USER_CONNECTIONS",true),j=tc("EXPIRE",true),k=tc("DEFAULT",true),U=tc("NEVER",true),D=tc("HISTORY",true),M=tc("REUSE",false),P=tc("CURRENT",true),G=tc("OPTIONAL",true),F=tc("FAILED_LOGIN_ATTEMPTS",true),H=tc("PASSWORD_LOCK_TIME",true),Y=tc("UNBOUNDED",true),B=tc("ACCOUNT",true),$=tc("LOCK",true),W=tc("UNLOCK",true),q=tc("ATTRIBUTE",true),V=tc("CASCADED",true),X=tc("LOCAL",true),K=tc("CHECK",true),Q=tc("OPTION",false),z=tc("ALGORITHM",true),Z=tc("UNDEFINED",true),J=tc("MERGE",true),rr=tc("TEMPTABLE",true),tr=tc("SQL",true),er=tc("SECURITY",true),nr=tc("DEFINER",true),or=tc("INVOKER",true),sr=function(r,t){return fv(r,t)},ur=tc("AUTO_INCREMENT",true),ar=tc("UNIQUE",true),ir=tc("KEY",true),cr=tc("PRIMARY",true),lr=tc("@",false),fr=function(){return cv("=",{type:"origin",value:"definer"},{type:"function",name:{name:[{type:"default",value:"current_user"}]},args:{type:"expr_list",value:[]}})},br=tc("BEFORE",true),pr=tc("AFTER",true),vr=tc("FOR",true),dr=tc("EACH",true),yr=tc("ROW",true),wr=tc("STATEMENT",true),Lr=tc("FOLLOWS",true),Cr=tc("PRECEDES",true),hr=tc("COLUMN_FORMAT",true),mr=tc("FIXED",true),Er=tc("DYNAMIC",true),Ar=tc("STORAGE",true),Tr=tc("DISK",true),_r=tc("MEMORY",true),gr=tc("GENERATED",true),Ir=tc("ALWAYS",true),Sr=tc("STORED",true),Nr=tc("VIRTUAL",true),Or=tc("if",true),Rr=tc("exists",true),xr=tc("first",true),jr=tc("after",true),kr=tc("LESS",true),Ur=tc("THAN",true),Dr=tc("DROP",true),Mr=tc("TRUNCATE",true),Pr=tc("DISCARD",true),Gr=tc("IMPORT",true),Fr=tc("COALESCE",true),Hr=tc("ANALYZE",true),Yr=tc("TABLESPACE",true),Br=tc("INSTANT",true),$r=tc("INPLACE",true),Wr=tc("COPY",true),qr=tc("SHARED",true),Vr=tc("EXCLUSIVE",true),Xr=tc("CHANGE",true),Kr=tc("FOREIGN",true),Qr=tc("CONSTRAINT",true),zr=tc("NOCHECK",true),Zr=tc("NOT",true),Jr=tc("REPLICATION",true),rt=tc("FOREIGN KEY",true),tt=tc("ENFORCED",true),et=tc("MATCH FULL",true),nt=tc("MATCH PARTIAL",true),ot=tc("MATCH SIMPLE",true),st=tc("RESTRICT",true),ut=tc("CASCADE",true),at=tc("SET NULL",true),it=tc("NO ACTION",true),ct=tc("SET DEFAULT",true),lt=tc("CHARACTER",true),ft=tc("SET",true),bt=tc("CHARSET",true),pt=tc("COLLATE",true),vt=tc("AVG_ROW_LENGTH",true),dt=tc("KEY_BLOCK_SIZE",true),yt=tc("MAX_ROWS",true),wt=tc("MIN_ROWS",true),Lt=tc("STATS_SAMPLE_PAGES",true),Ct=tc("CHECKSUM",false),ht=tc("DELAY_KEY_WRITE",false),mt=/^[01]/,Et=ec(["0","1"],false,false),At=tc("CONNECTION",true),Tt=tc("ENGINE_ATTRIBUTE",true),_t=tc("SECONDARY_ENGINE_ATTRIBUTE",true),gt=tc("DATA",true),It=tc("INDEX",true),St=tc("DIRECTORY",true),Nt=tc("COMPRESSION",true),Ot=tc("'",false),Rt=tc("ZLIB",true),xt=tc("LZ4",true),jt=tc("ENGINE",true),kt=function(r,t,e){return {keyword:r.toLowerCase(),symbol:t,value:e.toUpperCase()}},Ut=tc("ROW_FORMAT",true),Dt=tc("COMPRESSED",true),Mt=tc("REDUNDANT",true),Pt=tc("COMPACT",true),Gt=tc("READ",true),Ft=tc("LOW_PRIORITY",true),Ht=tc("WRITE",true),Yt=function(r,t){return fv(r,t)},Bt=tc("BINARY",true),$t=tc("MASTER",true),Wt=tc("LOGS",true),qt=tc("TRIGGERS",true),Vt=tc("STATUS",true),Xt=tc("PROCESSLIST",true),Kt=tc("PROCEDURE",true),Qt=tc("FUNCTION",true),zt=tc("BINLOG",true),Zt=tc("EVENTS",true),Jt=tc("COLLATION",true),re=tc("DATABASES",true),te=tc("COLUMNS",true),ee=tc("INDEXES",true),ne=tc("EVENT",true),oe=tc("GRANTS",true),se=tc("SERIALIZABLE",true),ue=tc("REPEATABLE",true),ae=tc("COMMITTED",true),ie=tc("UNCOMMITTED",true),ce=function(r){return {type:"origin",value:"read "+r.toLowerCase()}},le=tc("ISOLATION",true),fe=tc("LEVEL",true),be=tc("ONLY",true),pe=tc("DEFERRABLE",true),ve=tc("commit",true),de=tc("rollback",true),ye=tc("begin",true),we=tc("WORK",true),Le=tc("TRANSACTION",true),Ce=tc("start",true),he=tc("transaction",true),me=tc("FIELDS",true),Ee=tc("TERMINATED",true),Ae=tc("OPTIONALLY",true),Te=tc("ENCLOSED",true),_e=tc("ESCAPED",true),ge=tc("STARTING",true),Ie=tc("LINES",true),Se=tc("LOAD",true),Ne=tc("CONCURRENT",true),Oe=tc("INFILE",true),Re=tc("INTO",true),xe=tc("TABLE",true),je=tc("ROWS",true),ke=tc("VIEW",true),Ue=tc("GRANT",true),De=tc("OPTION",true),Me=function(r){return {type:"origin",value:Array.isArray(r)?r[0]:r}},Pe=tc("ROUTINE",true),Ge=tc("EXECUTE",true),Fe=tc("ADMIN",true),He=tc("GRANT",false),Ye=tc("PROXY",false),Be=tc("(",false),$e=tc(")",false),We=/^[0-9]/,qe=ec([["0","9"]],false,false),Ve=tc("IN",true),Xe=tc("SHARE",true),Ke=tc("MODE",true),Qe=tc("WAIT",true),ze=tc("NOWAIT",true),Ze=tc("SKIP",true),Je=tc("LOCKED",true),rn=tc("NATURAL",true),tn=tc("LANGUAGE",true),en=tc("QUERY",true),nn=tc("EXPANSION",true),on=tc("BOOLEAN",true),sn=tc("MATCH",true),un=tc("AGAINST",false),an=tc("OUTFILE",true),cn=tc("DUMPFILE",true),ln=tc("BTREE",true),fn=tc("HASH",true),bn=tc("PARSER",true),pn=tc("VISIBLE",true),vn=tc("INVISIBLE",true),dn=tc("LATERAL",true),yn=/^[_0-9]/,wn=ec(["_",["0","9"]],false,false),Ln=tc("ROLLUP",true),Cn=tc("?",false),hn=tc("=",false),mn=tc("DUPLICATE",true),En=function(r,t){return bv(r,t)},An=function(r){return r[0]+" "+r[2]},Tn=tc(">=",false),_n=tc(">",false),gn=tc("<=",false),In=tc("<>",false),Sn=tc("<",false),Nn=tc("!=",false),On=tc("ESCAPE",true),Rn=tc("+",false),xn=tc("-",false),jn=tc("*",false),kn=tc("/",false),Un=tc("%",false),Dn=tc("||",false),Mn=tc("div",true),Pn=tc("mod",true),Gn=tc("&",false),Fn=tc(">>",false),Hn=tc("<<",false),Yn=tc("^",false),Bn=tc("|",false),$n=tc("!",false),Wn=tc("~",false),qn=tc("?|",false),Vn=tc("?&",false),Xn=tc("#-",false),Kn=tc("#>>",false),Qn=tc("#>",false),zn=tc("@>",false),Zn=tc("<@",false),Jn=function(r){return  true===sv[r.toUpperCase()]},ro=tc('"',false),to=/^[^"]/,eo=ec(['"'],true,false),no=/^[^']/,oo=ec(["'"],true,false),so=tc("`",false),uo=/^[^`\\]/,ao=ec(["`","\\"],true,false),io=function(r,t){return r+t.join("")},co=/^[A-Za-z_\u4E00-\u9FA5\xC0-\u017F]/,lo=ec([["A","Z"],["a","z"],"_",["一","龥"],["À","ſ"]],false,false),fo=/^[A-Za-z0-9_$\x80-\uFFFF]/,bo=ec([["A","Z"],["a","z"],["0","9"],"_","$",["","￿"]],false,false),po=/^[A-Za-z0-9_:\u4E00-\u9FA5\xC0-\u017F]/,vo=ec([["A","Z"],["a","z"],["0","9"],"_",":",["一","龥"],["À","ſ"]],false,false),yo=tc(":",false),wo=tc("NOW",true),Lo=tc("OVER",true),Co=tc("WINDOW",true),ho=tc("FOLLOWING",true),mo=tc("PRECEDING",true),Eo=tc("SEPARATOR",true),Ao=tc("YEAR_MONTH",true),To=tc("DAY_HOUR",true),_o=tc("DAY_MINUTE",true),go=tc("DAY_SECOND",true),Io=tc("DAY_MICROSECOND",true),So=tc("HOUR_MINUTE",true),No=tc("HOUR_SECOND",true),Oo=tc("HOUR_MICROSECOND",true),Ro=tc("MINUTE_SECOND",true),xo=tc("MINUTE_MICROSECOND",true),jo=tc("SECOND_MICROSECOND",true),ko=tc("TIMEZONE_HOUR",true),Uo=tc("TIMEZONE_MINUTE",true),Do=tc("CENTURY",true),Mo=tc("DAY",true),Po=tc("DATE",true),Go=tc("DECADE",true),Fo=tc("DOW",true),Ho=tc("DOY",true),Yo=tc("EPOCH",true),Bo=tc("HOUR",true),$o=tc("ISODOW",true),Wo=tc("ISOWEEK",true),qo=tc("ISOYEAR",true),Vo=tc("MICROSECONDS",true),Xo=tc("MILLENNIUM",true),Ko=tc("MILLISECONDS",true),Qo=tc("MINUTE",true),zo=tc("MONTH",true),Zo=tc("QUARTER",true),Jo=tc("SECOND",true),rs=tc("TIME",true),ts=tc("TIMEZONE",true),es=tc("WEEK",true),ns=tc("YEAR",true),os=tc("DATE_TRUNC",true),ss=tc("BOTH",true),us=tc("LEADING",true),as=tc("TRAILING",true),is=tc("trim",true),cs=tc("convert",true),ls=tc("binary",true),fs=tc("_binary",true),bs=tc("_latin1",true),ps=tc("X",true),vs=/^[0-9A-Fa-f]/,ds=ec([["0","9"],["A","F"],["a","f"]],false,false),ys=tc("b",true),ws=tc("0x",true),Ls=tc("N",true),Cs=function(r,t){return {type:r.toLowerCase(),value:t[1].join("")}},hs=/^[^"\\\0-\x1F\x7F]/,ms=ec(['"',"\\",["\0",""],""],true,false),Es=/^[\n]/,As=ec(["\n"],false,false),Ts=/^[^'\\]/,_s=ec(["'","\\"],true,false),gs=tc("\\'",false),Is=tc('\\"',false),Ss=tc("\\\\",false),Ns=tc("\\/",false),Os=tc("\\b",false),Rs=tc("\\f",false),xs=tc("\\n",false),js=tc("\\r",false),ks=tc("\\t",false),Us=tc("\\u",false),Ds=tc("\\",false),Ms=tc("''",false),Ps=tc('""',false),Gs=tc("``",false),Fs=/^[\n\r]/,Hs=ec(["\n","\r"],false,false),Ys=tc(".",false),Bs=/^[0-9a-fA-F]/,$s=ec([["0","9"],["a","f"],["A","F"]],false,false),Ws=/^[eE]/,qs=ec(["e","E"],false,false),Vs=/^[+\-]/,Xs=ec(["+","-"],false,false),Ks=tc("NULL",true),Qs=tc("NOT NULL",true),zs=tc("TRUE",true),Zs=tc("TO",true),Js=tc("FALSE",true),ru=tc("SHOW",true),tu=tc("USE",true),eu=tc("ALTER",true),nu=tc("SELECT",true),ou=tc("UPDATE",true),su=tc("CREATE",true),uu=tc("TEMPORARY",true),au=tc("DELETE",true),iu=tc("INSERT",true),cu=tc("RECURSIVE",true),lu=tc("REPLACE",true),fu=tc("RENAME",true),bu=tc("IGNORE",true),pu=tc("EXPLAIN",true),vu=tc("PARTITION",true),du=tc("FROM",true),yu=tc("TRIGGER",true),wu=tc("TABLES",true),Lu=tc("DATABASE",true),Cu=tc("SCHEMA",true),hu=tc("ON",true),mu=tc("LEFT",true),Eu=tc("RIGHT",true),Au=tc("FULL",true),Tu=tc("INNER",true),_u=tc("CROSS",true),gu=tc("JOIN",true),Iu=tc("OUTER",true),Su=tc("UNION",true),Nu=tc("MINUS",true),Ou=tc("INTERSECT",true),Ru=tc("EXCEPT",true),xu=tc("VALUES",true),ju=tc("USING",true),ku=tc("WHERE",true),Uu=tc("GO",true),Du=tc("GROUP",true),Mu=tc("ORDER",true),Pu=tc("HAVING",true),Gu=tc("LIMIT",true),Fu=tc("OFFSET",true),Hu=tc("ASC",true),Yu=tc("DESC",true),Bu=tc("DESCRIBE",true),$u=tc("ALL",true),Wu=tc("DISTINCT",true),qu=tc("BETWEEN",true),Vu=tc("IS",true),Xu=tc("LIKE",true),Ku=tc("RLIKE",true),Qu=tc("REGEXP",true),zu=tc("EXISTS",true),Zu=tc("AND",true),Ju=tc("OR",true),ra=tc("COUNT",true),ta=tc("GROUP_CONCAT",true),ea=tc("MAX",true),na=tc("MIN",true),oa=tc("SUM",true),sa=tc("AVG",true),ua=tc("EXTRACT",true),aa=tc("CALL",true),ia=tc("CASE",true),ca=tc("WHEN",true),la=tc("THEN",true),fa=tc("ELSE",true),ba=tc("END",true),pa=tc("CAST",true),va=tc("VARBINARY",true),da=tc("BIT",true),ya=tc("CHAR",true),wa=tc("VARCHAR",true),La=tc("NUMERIC",true),Ca=tc("DECIMAL",true),ha=tc("SIGNED",true),ma=tc("UNSIGNED",true),Ea=tc("INT",true),Aa=tc("ZEROFILL",true),Ta=tc("INTEGER",true),_a=tc("JSON",true),ga=tc("SMALLINT",true),Ia=tc("MEDIUMINT",true),Sa=tc("TINYINT",true),Na=tc("TINYTEXT",true),Oa=tc("TEXT",true),Ra=tc("MEDIUMTEXT",true),xa=tc("LONGTEXT",true),ja=tc("BIGINT",true),ka=tc("ENUM",true),Ua=tc("FLOAT",true),Da=tc("DOUBLE",true),Ma=tc("DATETIME",true),Pa=tc("TIMESTAMP",true),Ga=tc("USER",true),Fa=tc("CURRENT_DATE",true),Ha=(tc("INTERVAL",true)),Ya=tc("MICROSECOND",true),Ba=tc("CURRENT_TIME",true),$a=tc("CURRENT_TIMESTAMP",true),Wa=tc("CURRENT_USER",true),qa=tc("SESSION_USER",true),Va=tc("SYSTEM_USER",true),Xa=tc("GLOBAL",true),Ka=tc("SESSION",true),Qa=tc("PERSIST",true),za=tc("PERSIST_ONLY",true),Za=tc("GEOMETRY",true),Ja=tc("POINT",true),ri=tc("LINESTRING",true),ti=tc("POLYGON",true),ei=tc("MULTIPOINT",true),ni=tc("MULTILINESTRING",true),oi=tc("MULTIPOLYGON",true),si=tc("GEOMETRYCOLLECTION",true),ui=tc("@@",false),ai=tc("$",false),ii=tc("return",true),ci=tc(":=",false),li=tc("DUAL",true),fi=tc("ADD",true),bi=tc("COLUMN",true),pi=tc("MODIFY",true),vi=tc("FULLTEXT",true),di=tc("SPATIAL",true),yi=tc("COMMENT",true),wi=tc("REFERENCES",true),Li=tc("SQL_CALC_FOUND_ROWS",true),Ci=tc("SQL_CACHE",true),hi=tc("SQL_NO_CACHE",true),mi=tc("SQL_SMALL_RESULT",true),Ei=tc("SQL_BIG_RESULT",true),Ai=tc("SQL_BUFFER_RESULT",true),Ti=tc(",",false),_i=tc("[",false),gi=tc("]",false),Ii=tc(";",false),Si=tc("->",false),Ni=tc("->>",false),Oi=tc("&&",false),Ri=tc("XOR",true),xi=tc("/*",false),ji=tc("*/",false),ki=tc("--",false),Ui=tc("#",false),Di={type:"any"},Mi=/^[ \t\n\r]/,Pi=ec([" ","\t","\n","\r"],false,false),Gi=function(r,t,e){return {type:"assign",left:r,symbol:t,right:e}},Fi=tc("boolean",true),Hi=tc("blob",true),Yi=tc("tinyblob",true),Bi=tc("mediumblob",true),$i=tc("longblob",true),Wi=function(r,t){return {dataType:r,...t||{}}},qi=tc("ARRAY",true),Vi=/^[0-6]/,Xi=ec([["0","6"]],false,false),Ki=0,Qi=0,zi=[{line:1,column:1}],Zi=0,Ji=[],rc=0;if("startRule"in t){if(!(t.startRule in u))throw new Error("Can't start parsing from rule \""+t.startRule+'".');a=u[t.startRule];}function tc(r,t){return {type:"literal",text:r,ignoreCase:t}}function ec(r,t,e){return {type:"class",parts:r,inverted:t,ignoreCase:e}}function nc(t){var e,n=zi[t];if(n)return n;for(e=t-1;!zi[e];)e--;for(n={line:(n=zi[e]).line,column:n.column};e<t;)10===r.charCodeAt(e)?(n.line++,n.column=1):n.column++,e++;return zi[t]=n,n}function oc(r,t){var e=nc(r),n=nc(t);return {start:{offset:r,line:e.line,column:e.column},end:{offset:t,line:n.line,column:n.column}}}function sc(r){Ki<Zi||(Ki>Zi&&(Zi=Ki,Ji=[]),Ji.push(r));}function uc(r,t,e){return new o(o.buildMessage(r,t),r,t,e)}function ac(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=ic())!==s)if(Up()!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ib())!==s&&(a=Up())!==s&&(i=ic())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ib())!==s&&(a=Up())!==s&&(i=ic())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){if(!t||0===t.length)return r;delete r.tableList,delete r.columnList;let e=r;for(let r=0;r<t.length;r++)delete t[r][3].tableList,delete t[r][3].columnList,e.go_next=t[r][3],e.go="go",e=e.go_next;return {tableList:Array.from(wv),columnList:vv(Lv),ast:r}}(t,e)):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;return r}function ic(){var r,t;return r=Ki,Up()!==s&&(t=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=lc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Rp())!==s&&(a=Up())!==s&&(i=lc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Rp())!==s&&(a=Up())!==s&&(i=lc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=function(r,t){const e=r&&r.ast||r,n=t&&t.length&&t[0].length>=4?[e]:e;for(let r=0;r<t.length;r++)t[r][3]&&0!==t[r][3].length&&n.push(t[r][3]&&t[r][3].ast||t[r][3]);return {tableList:Array.from(wv),columnList:vv(Lv),ast:n}}(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=r,r=t):(Ki=r,r=s),r}function cc(){var t;return (t=function(){var r,t,e,n,o,u,a;r=Ki,(t=rb())!==s&&Up()!==s&&(e=yb())!==s&&Up()!==s?((n=Tc())===s&&(n=null),n!==s&&Up()!==s&&(o=vl())!==s?(Qi=r,i=t,c=e,f=n,(b=o)&&b.forEach(r=>wv.add(`${i}::${r.db}::${r.table}`)),t={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:i.toLowerCase(),keyword:c.toLowerCase(),prefix:f,name:b}},r=t):(Ki=r,r=s)):(Ki=r,r=s);var i,c,f,b;r===s&&(r=Ki,(t=rb())!==s&&Up()!==s&&(e=fp())!==s&&Up()!==s?((n=Tc())===s&&(n=null),n!==s&&Up()!==s&&(o=vl())!==s&&Up()!==s?((u=Dc())===s&&(u=null),u!==s?(Qi=r,t=function(r,t,e,n,o){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r.toLowerCase(),keyword:t.toLowerCase(),prefix:e,name:n,options:o&&[{type:"origin",value:o}]}}}(t,e,n,o,u),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=rb())!==s&&Up()!==s&&(e=Lp())!==s&&Up()!==s&&(n=ef())!==s&&Up()!==s&&(o=mb())!==s&&Up()!==s&&(u=Ll())!==s&&Up()!==s?((a=function(){var r,t,e,n,o,u;r=Ki,(t=Sc())===s&&(t=Nc());if(t!==s){for(e=[],n=Ki,(o=Up())!==s?((u=Sc())===s&&(u=Nc()),u!==s?n=o=[o,u]:(Ki=n,n=s)):(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s?((u=Sc())===s&&(u=Nc()),u!==s?n=o=[o,u]:(Ki=n,n=s)):(Ki=n,n=s);e!==s?(Qi=r,t=l(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())===s&&(a=null),a!==s&&Up()!==s?(Qi=r,t=function(r,t,e,n,o){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r.toLowerCase(),keyword:t.toLowerCase(),name:e,table:n,options:o}}}(t,e,n,u,a),r=t):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=rb())!==s&&Up()!==s?((e=Cb())===s&&(e=hb()),e!==s&&Up()!==s?((n=Tc())===s&&(n=null),n!==s&&Up()!==s&&(o=wf())!==s?(Qi=r,t=function(r,t,e,n){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r.toLowerCase(),keyword:t.toLowerCase(),prefix:e,name:n}}}(t,e,n,o),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=rb())!==s&&Up()!==s&&(e=wb())!==s&&Up()!==s?((n=Tc())===s&&(n=null),n!==s&&Up()!==s&&(o=yl())!==s?(Qi=r,t=function(r,t,e,n){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r.toLowerCase(),keyword:t.toLowerCase(),prefix:e,name:[{schema:n.db,trigger:n.table}]}}}(t,e,n,o),r=t):(Ki=r,r=s)):(Ki=r,r=s)))));return r}())===s&&(t=function(){var t;(t=function(){var r,t,e,n,o,u,a,c,l,f;r=Ki,(t=ob())!==s&&Up()!==s?((e=sb())===s&&(e=null),e!==s&&Up()!==s&&yb()!==s&&Up()!==s?((n=vc())===s&&(n=null),n!==s&&Up()!==s&&(o=Ll())!==s&&Up()!==s&&(u=function r(){var t,e;(t=function(){var r,t;r=Ki,Db()!==s&&Up()!==s&&(t=vl())!==s?(Qi=r,r={type:"like",table:t}):(Ki=r,r=s);return r}())===s&&(t=Ki,Np()!==s&&Up()!==s&&(e=r())!==s&&Up()!==s&&Op()!==s?(Qi=t,(n=e).parentheses=true,t=n):(Ki=t,t=s));var n;return t}())!==s?(Qi=r,b=t,p=e,v=n,y=u,(d=o)&&wv.add(`create::${d.db}::${d.table}`),t={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:b[0].toLowerCase(),keyword:"table",temporary:p&&p[0].toLowerCase(),if_not_exists:v,table:[d],like:y}},r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);var b,p,v,d,y;r===s&&(r=Ki,(t=ob())!==s&&Up()!==s?((e=sb())===s&&(e=null),e!==s&&Up()!==s&&yb()!==s&&Up()!==s?((n=vc())===s&&(n=null),n!==s&&Up()!==s&&(o=Ll())!==s&&Up()!==s?((u=function(){var r,t,e,n,o,u,a,i,c;if(r=Ki,(t=Np())!==s)if(Up()!==s)if((e=Cc())!==s){for(n=[],o=Ki,(u=Up())!==s&&(a=Ip())!==s&&(i=Up())!==s&&(c=Cc())!==s?o=u=[u,a,i,c]:(Ki=o,o=s);o!==s;)n.push(o),o=Ki,(u=Up())!==s&&(a=Ip())!==s&&(i=Up())!==s&&(c=Cc())!==s?o=u=[u,a,i,c]:(Ki=o,o=s);n!==s&&(o=Up())!==s&&(u=Op())!==s?(Qi=r,t=sr(e,n),r=t):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;return r}())===s&&(u=null),u!==s&&Up()!==s?((a=function(){var r,t,e,n,o,u,a,c;if(r=Ki,(t=Gc())!==s){for(e=[],n=Ki,(o=Up())!==s?((u=Ip())===s&&(u=null),u!==s&&(a=Up())!==s&&(c=Gc())!==s?n=o=[o,u,a,c]:(Ki=n,n=s)):(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s?((u=Ip())===s&&(u=null),u!==s&&(a=Up())!==s&&(c=Gc())!==s?n=o=[o,u,a,c]:(Ki=n,n=s)):(Ki=n,n=s);e!==s?(Qi=r,t=i(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())===s&&(a=null),a!==s&&Up()!==s?((c=lb())===s&&(c=ib()),c===s&&(c=null),c!==s&&Up()!==s?((l=db())===s&&(l=null),l!==s&&Up()!==s?((f=bc())===s&&(f=null),f!==s?(Qi=r,t=function(r,t,e,n,o,s,u,a,i){return n&&wv.add(`create::${n.db}::${n.table}`),{tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r[0].toLowerCase(),keyword:"table",temporary:t&&t[0].toLowerCase(),if_not_exists:e,table:[n],ignore_replace:u&&u[0].toLowerCase(),as:a&&a[0].toLowerCase(),query_expr:i&&i.ast,create_definitions:o,table_options:s}}}(t,e,n,o,u,a,c,l,f),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s));return r}())===s&&(t=function(){var t,e,n,o,u,a,i,c,l,f,b;t=Ki,(e=ob())!==s&&Up()!==s?((n=Ec())===s&&(n=null),n!==s&&Up()!==s&&wb()!==s&&Up()!==s?((o=vc())===s&&(o=null),o!==s&&Up()!==s&&(u=Ll())!==s&&Up()!==s&&(a=function(){var t;"before"===r.substr(Ki,6).toLowerCase()?(t=r.substr(Ki,6),Ki+=6):(t=s,0===rc&&sc(br));t===s&&("after"===r.substr(Ki,5).toLowerCase()?(t=r.substr(Ki,5),Ki+=5):(t=s,0===rc&&sc(pr)));return t}())!==s&&Up()!==s&&(i=function(){var r,t;r=Ki,(t=ab())===s&&(t=nb())===s&&(t=ub());t!==s&&(Qi=r,t={keyword:t[0].toLowerCase()});return r=t}())!==s&&Up()!==s&&mb()!==s&&Up()!==s&&(c=Ll())!==s&&Up()!==s&&(l=function(){var t,e,n,o;t=Ki,"for"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(vr));e!==s&&Up()!==s?("each"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(dr)),n===s&&(n=null),n!==s&&Up()!==s?("row"===r.substr(Ki,3).toLowerCase()?(o=r.substr(Ki,3),Ki+=3):(o=s,0===rc&&sc(yr)),o===s&&("statement"===r.substr(Ki,9).toLowerCase()?(o=r.substr(Ki,9),Ki+=9):(o=s,0===rc&&sc(wr))),o!==s?(Qi=t,u=e,i=o,e={keyword:(a=n)?`${u.toLowerCase()} ${a.toLowerCase()}`:u.toLowerCase(),args:i.toLowerCase()},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var u,a,i;return t}())!==s&&Up()!==s?((f=function(){var t,e,n;t=Ki,"follows"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Lr));e===s&&("precedes"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Cr)));e!==s&&Up()!==s&&(n=af())!==s?(Qi=t,t=e={keyword:e,trigger:n}):(Ki=t,t=s);return t}())===s&&(f=null),f!==s&&Up()!==s&&(b=function(){var r,t;r=Ki,vb()!==s&&Up()!==s&&(t=Il())!==s?(Qi=r,r={type:"set",expr:t}):(Ki=r,r=s);return r}())!==s?(Qi=t,p=e,v=n,d=o,y=u,w=a,L=i,C=c,h=l,m=f,E=b,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:p[0].toLowerCase(),definer:v,keyword:"trigger",for_each:h,if_not_exists:d,trigger:y,time:w,events:[L],order:m,table:C,execute:E}},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var p,v,d,y,w,L,C,h,m,E;return t}())===s&&(t=function(){var r,t,e,n,o,u,a,c,l,f,b,p;r=Ki,(t=ob())!==s&&Up()!==s?((e=Ep())===s&&(e=hp())===s&&(e=mp()),e===s&&(e=null),e!==s&&Up()!==s&&(n=Lp())!==s&&Up()!==s&&(o=af())!==s&&Up()!==s?((u=fl())===s&&(u=null),u!==s&&Up()!==s&&(a=mb())!==s&&Up()!==s&&(c=Ll())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(l=function(){var r,t,e,n,o,u,a,c;if(r=Ki,(t=pc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=pc())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=pc())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);e!==s?(Qi=r,t=i(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s&&Up()!==s&&Op()!==s&&Up()!==s?((f=bl())===s&&(f=null),f!==s&&Up()!==s?((b=Sc())===s&&(b=null),b!==s&&Up()!==s?((p=Nc())===s&&(p=null),p!==s&&Up()!==s?(Qi=r,v=t,d=e,y=n,w=o,L=u,C=a,h=c,m=l,E=f,A=b,T=p,t={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:v[0].toLowerCase(),index_type:d&&d.toLowerCase(),keyword:y.toLowerCase(),index:w,on_kw:C[0].toLowerCase(),table:h,index_columns:m,index_using:L,index_options:E,algorithm_option:A,lock_option:T}},r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);var v,d,y,w,L,C,h,m,E,A,T;return r}())===s&&(t=function(){var r,t,e,n,o,u;r=Ki,(t=ob())!==s&&Up()!==s?((e=Cb())===s&&(e=hb()),e!==s&&Up()!==s?((n=vc())===s&&(n=null),n!==s&&Up()!==s&&(o=Xp())!==s&&Up()!==s?((u=function(){var r,t,e,n,o,u;if(r=Ki,(t=Pc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Pc())!==s?n=o=[o,u]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Pc())!==s?n=o=[o,u]:(Ki=n,n=s);e!==s?(Qi=r,t=l(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())===s&&(u=null),u!==s?(Qi=r,t=function(r,t,e,n,o){const s=t.toLowerCase();return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r[0].toLowerCase(),keyword:s,if_not_exists:e,[s]:{db:n.schema,schema:n.name},create_definitions:o}}}(t,e,n,o,u),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(t=function(){var t,e,n,o,u,a,i,c,l,f,b,p,v,d,y,w,L,C,h,m,E;t=Ki,(e=ob())!==s&&Up()!==s?(n=Ki,(o=Fb())!==s&&(u=Up())!==s&&(a=ib())!==s?n=o=[o,u,a]:(Ki=n,n=s),n===s&&(n=null),n!==s&&(o=Up())!==s?(u=Ki,"algorithm"===r.substr(Ki,9).toLowerCase()?(a=r.substr(Ki,9),Ki+=9):(a=s,0===rc&&sc(z)),a!==s&&(i=Up())!==s&&(c=dp())!==s&&(l=Up())!==s?("undefined"===r.substr(Ki,9).toLowerCase()?(f=r.substr(Ki,9),Ki+=9):(f=s,0===rc&&sc(Z)),f===s&&("merge"===r.substr(Ki,5).toLowerCase()?(f=r.substr(Ki,5),Ki+=5):(f=s,0===rc&&sc(J)),f===s&&("temptable"===r.substr(Ki,9).toLowerCase()?(f=r.substr(Ki,9),Ki+=9):(f=s,0===rc&&sc(rr)))),f!==s?u=a=[a,i,c,l,f]:(Ki=u,u=s)):(Ki=u,u=s),u===s&&(u=null),u!==s&&(a=Up())!==s?((i=Ec())===s&&(i=null),i!==s&&(c=Up())!==s?(l=Ki,"sql"===r.substr(Ki,3).toLowerCase()?(f=r.substr(Ki,3),Ki+=3):(f=s,0===rc&&sc(tr)),f!==s&&(b=Up())!==s?("security"===r.substr(Ki,8).toLowerCase()?(p=r.substr(Ki,8),Ki+=8):(p=s,0===rc&&sc(er)),p!==s&&(v=Up())!==s?("definer"===r.substr(Ki,7).toLowerCase()?(d=r.substr(Ki,7),Ki+=7):(d=s,0===rc&&sc(nr)),d===s&&("invoker"===r.substr(Ki,7).toLowerCase()?(d=r.substr(Ki,7),Ki+=7):(d=s,0===rc&&sc(or))),d!==s?l=f=[f,b,p,v,d]:(Ki=l,l=s)):(Ki=l,l=s)):(Ki=l,l=s),l===s&&(l=null),l!==s&&(f=Up())!==s&&(b=fp())!==s&&(p=Up())!==s&&(v=Ll())!==s&&(d=Up())!==s?(y=Ki,(w=Np())!==s&&(L=Up())!==s&&(C=nf())!==s&&(h=Up())!==s&&(m=Op())!==s?y=w=[w,L,C,h,m]:(Ki=y,y=s),y===s&&(y=null),y!==s&&(w=Up())!==s&&(L=db())!==s&&(C=Up())!==s&&(h=el())!==s&&(m=Up())!==s?((E=function(){var t,e,n,o,u;t=Ki,(e=gb())!==s&&Up()!==s?("cascaded"===r.substr(Ki,8).toLowerCase()?(n=r.substr(Ki,8),Ki+=8):(n=s,0===rc&&sc(V)),n===s&&("local"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(X))),n!==s&&Up()!==s?("check"===r.substr(Ki,5).toLowerCase()?(o=r.substr(Ki,5),Ki+=5):(o=s,0===rc&&sc(K)),o!==s&&Up()!==s?("OPTION"===r.substr(Ki,6)?(u="OPTION",Ki+=6):(u=s,0===rc&&sc(Q)),u!==s?(Qi=t,e=`with ${n.toLowerCase()} check option`,t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);t===s&&(t=Ki,(e=gb())!==s&&Up()!==s?("check"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(K)),n!==s&&Up()!==s?("OPTION"===r.substr(Ki,6)?(o="OPTION",Ki+=6):(o=s,0===rc&&sc(Q)),o!==s?(Qi=t,t=e="with check option"):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s));return t}())===s&&(E=null),E!==s?(Qi=t,A=e,T=n,_=u,g=i,I=l,N=y,O=h,R=E,(S=v).view=S.table,delete S.table,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:A[0].toLowerCase(),keyword:"view",replace:T&&"or replace",algorithm:_&&_[4],definer:g,sql_security:I&&I[4],columns:N&&N[2],select:O,view:S,with:R}},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var A,T,_,g,I,S,N,O,R;return t}())===s&&(t=function(){var t,e,n,o,u,a,i,c,l,f,b;t=Ki,(e=ob())!==s&&Up()!==s&&ap()!==s&&Up()!==s?((n=vc())===s&&(n=null),n!==s&&Up()!==s&&(o=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=dc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=dc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=dc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=C(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s&&Up()!==s?((u=function(){var t,e,n;t=Ki,zf()!==s&&Up()!==s?("role"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(h)),e!==s&&Up()!==s&&(n=Vc())!==s?(Qi=t,t={keyword:"default role",value:n}):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(u=null),u!==s&&Up()!==s?((a=function(){var t,e,n;t=Ki,"require"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(S));e!==s&&Up()!==s&&(n=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=yc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Gb())!==s&&(a=Up())!==s&&(i=yc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Gb())!==s&&(a=Up())!==s&&(i=yc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=bv(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=t,t=e={keyword:"require",value:n}):(Ki=t,t=s);return t}())===s&&(a=null),a!==s&&Up()!==s?((i=function(){var r,t,e,n,o,u,a;if(r=Ki,(t=gb())!==s)if(Up()!==s)if((e=wc())!==s){for(n=[],o=Ki,(u=Up())!==s&&(a=wc())!==s?o=u=[u,a]:(Ki=o,o=s);o!==s;)n.push(o),o=Ki,(u=Up())!==s&&(a=wc())!==s?o=u=[u,a]:(Ki=o,o=s);n!==s?(Qi=r,t=function(r,t){const e=[r];if(t)for(const r of t)e.push(r[1]);return {keyword:"with",value:e}}(e,n),r=t):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;return r}())===s&&(i=null),i!==s&&Up()!==s?((c=function(){var r,t,e,n,o,u;if(r=Ki,(t=Lc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Lc())!==s?n=o=[o,u]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Lc())!==s?n=o=[o,u]:(Ki=n,n=s);e!==s?(Qi=r,t=fv(t,e,1),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())===s&&(c=null),c!==s&&Up()!==s?((l=function(){var t,e,n;t=Ki,"account"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(B));e!==s&&Up()!==s?("lock"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc($)),n===s&&("unlock"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(W))),n!==s?(Qi=t,e=function(r){const t={type:"origin",value:r.toLowerCase(),prefix:"account"};return t}(n),t=e):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(l=null),l!==s&&Up()!==s?((f=Pp())===s&&(f=null),f!==s&&Up()!==s?((b=function(){var t,e,n;t=Ki,"attribute"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(q));e!==s&&Up()!==s&&(n=Ff())!==s?(Qi=t,(o=n).prefix="attribute",t=e=o):(Ki=t,t=s);var o;return t}())===s&&(b=null),b!==s?(Qi=t,p=e,v=n,d=o,y=u,w=a,L=i,m=c,E=l,A=f,T=b,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:p[0].toLowerCase(),keyword:"user",if_not_exists:v,user:d,default_role:y,require:w,resource_options:L,password_options:m,lock_option:E,comment:A,attribute:T}},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var p,v,d,y,w,L,m,E,A,T;return t}());return t}())===s&&(t=function(){var t,e,n,o;t=Ki,(e=function(){var t,e,n,o;t=Ki,"truncate"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Mr));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TRUNCATE"):(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s?((n=yb())===s&&(n=null),n!==s&&Up()!==s&&(o=vl())!==s?(Qi=t,u=e,a=n,(i=o)&&i.forEach(r=>wv.add(`${u}::${r.db}::${r.table}`)),e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:u.toLowerCase(),keyword:a&&a.toLowerCase()||"table",name:i}},t=e):(Ki=t,t=s)):(Ki=t,t=s);var u,a,i;return t}())===s&&(t=function(){var r,t,e;r=Ki,(t=cb())!==s&&Up()!==s&&yb()!==s&&Up()!==s&&(e=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=ll())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ll())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ll())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=sr(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=r,(n=e).forEach(r=>r.forEach(r=>r.table&&wv.add(`rename::${r.db}::${r.table}`))),t={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"rename",table:n}},r=t):(Ki=r,r=s);var n;return r}())===s&&(t=function(){var t,e,n;t=Ki,(e=function(){var t,e,n,o;t=Ki,"call"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(aa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CALL"):(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s&&(n=function(){var r;(r=Kp())===s&&(r=Qp());return r}())!==s?(Qi=t,o=n,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"call",expr:o}},t=e):(Ki=t,t=s);var o;return t}())===s&&(t=function(){var t,e,n;t=Ki,(e=function(){var t,e,n,o;t=Ki,"use"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(tu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s&&(n=af())!==s?(Qi=t,o=n,wv.add(`use::${o}::null`),e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"use",db:o}},t=e):(Ki=t,t=s);var o;return t}())===s&&(t=function(){var r,t,e,n;r=Ki,(t=tb())!==s&&Up()!==s&&yb()!==s&&Up()!==s&&(e=Ll())!==s&&Up()!==s&&(n=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=gc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=gc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=gc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=sr(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=r,o=e,u=n,wv.add(`alter::${o.db}::${o.table}`),t={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"alter",table:[o],expr:u}},r=t):(Ki=r,r=s);var o,u;return r}())===s&&(t=function(){var t,e,n,o;t=Ki,(e=vb())!==s&&Up()!==s?((n=function(){var t,e,n,o;t=Ki,"global"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Xa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="GLOBAL"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(n=function(){var t,e,n,o;t=Ki,"session"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Ka));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SESSION"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(n=function(){var t,e,n,o;t=Ki,"local"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(X));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="LOCAL"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(n=function(){var t,e,n,o;t=Ki,"persist"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Qa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="PERSIST"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(n=function(){var t,e,n,o;t=Ki,"persist_only"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(za));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="PERSIST_ONLY"):(Ki=t,t=s)):(Ki=t,t=s);return t}()),n===s&&(n=null),n!==s&&Up()!==s&&(o=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Bp())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Bp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Bp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=Yt(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=t,u=n,(a=o).keyword=u,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"set",keyword:u,expr:a}},t=e):(Ki=t,t=s)):(Ki=t,t=s);var u,a;return t}())===s&&(t=function(){var t,e,n;t=Ki,(e=function(){var t,e,n,o;t=Ki,"lock"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc($));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s&&Lb()!==s&&Up()!==s&&(n=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Fc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Fc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Fc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=Yt(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=t,o=n,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"lock",keyword:"tables",tables:o}},t=e):(Ki=t,t=s);var o;return t}())===s&&(t=function(){var t,e;t=Ki,(e=function(){var t,e,n,o;t=Ki,"unlock"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(W));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s&&Lb()!==s?(Qi=t,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"unlock",keyword:"tables"}},t=e):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o,u,a,i,c,l;t=Ki,(e=Jf())!==s&&Up()!==s?("binary"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(Bt)),n===s&&("master"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc($t))),n!==s&&(o=Up())!==s?("logs"===r.substr(Ki,4).toLowerCase()?(u=r.substr(Ki,4),Ki+=4):(u=s,0===rc&&sc(Wt)),u!==s?(Qi=t,f=n,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",suffix:"logs",keyword:f.toLowerCase()}},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var f;t===s&&(t=Ki,(e=Jf())!==s&&Up()!==s&&(n=Lb())!==s?(Qi=t,wv.add("show::null::null"),e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",keyword:"tables"}},t=e):(Ki=t,t=s),t===s&&(t=Ki,(e=Jf())!==s&&Up()!==s?("triggers"===r.substr(Ki,8).toLowerCase()?(n=r.substr(Ki,8),Ki+=8):(n=s,0===rc&&sc(qt)),n===s&&("status"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(Vt)),n===s&&("processlist"===r.substr(Ki,11).toLowerCase()?(n=r.substr(Ki,11),Ki+=11):(n=s,0===rc&&sc(Xt)))),n!==s?(Qi=t,d=n,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",keyword:d.toLowerCase()}},t=e):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Jf())!==s&&Up()!==s?("procedure"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(Kt)),n===s&&("function"===r.substr(Ki,8).toLowerCase()?(n=r.substr(Ki,8),Ki+=8):(n=s,0===rc&&sc(Qt))),n!==s&&(o=Up())!==s?("status"===r.substr(Ki,6).toLowerCase()?(u=r.substr(Ki,6),Ki+=6):(u=s,0===rc&&sc(Vt)),u!==s?(Qi=t,e=function(r){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",keyword:r.toLowerCase(),suffix:"status"}}}(n),t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Jf())!==s&&Up()!==s?("binlog"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(zt)),n!==s&&(o=Up())!==s?("events"===r.substr(Ki,6).toLowerCase()?(u=r.substr(Ki,6),Ki+=6):(u=s,0===rc&&sc(Zt)),u!==s&&(a=Up())!==s?((i=Kl())===s&&(i=null),i!==s&&Up()!==s?((c=cl())===s&&(c=null),c!==s&&Up()!==s?((l=gl())===s&&(l=null),l!==s?(Qi=t,b=i,p=c,v=l,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",suffix:"events",keyword:"binlog",in:b,from:p,limit:v}},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Jf())!==s&&Up()!==s?(n=Ki,"character"===r.substr(Ki,9).toLowerCase()?(o=r.substr(Ki,9),Ki+=9):(o=s,0===rc&&sc(lt)),o!==s&&(u=Up())!==s?("set"===r.substr(Ki,3).toLowerCase()?(a=r.substr(Ki,3),Ki+=3):(a=s,0===rc&&sc(ft)),a!==s?n=o=[o,u,a]:(Ki=n,n=s)):(Ki=n,n=s),n===s&&("collation"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(Jt)),n===s&&("databases"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(re)))),n!==s&&(o=Up())!==s?((u=Xl())===s&&(u=hl()),u===s&&(u=null),u!==s?(Qi=t,e=function(r,t){let e=Array.isArray(r)&&r||[r];return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",suffix:e[2]&&e[2].toLowerCase(),keyword:e[0].toLowerCase(),expr:t}}}(n,u),t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Jf())!==s&&Up()!==s?("columns"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(te)),n===s&&("indexes"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(ee)),n===s&&("index"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(It)))),n!==s&&(o=Up())!==s&&(u=cl())!==s?(Qi=t,e=function(r,t){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",keyword:r.toLowerCase(),from:t}}}(n,u),t=e):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Jf())!==s&&Up()!==s&&(n=ob())!==s&&(o=Up())!==s?((u=fp())===s&&(u=yb())===s&&("event"===r.substr(Ki,5).toLowerCase()?(u=r.substr(Ki,5),Ki+=5):(u=s,0===rc&&sc(ne)),u===s&&(u=wb())===s&&("procedure"===r.substr(Ki,9).toLowerCase()?(u=r.substr(Ki,9),Ki+=9):(u=s,0===rc&&sc(Kt)))),u!==s&&(a=Up())!==s&&(i=Ll())!==s?(Qi=t,e=function(r,t){const e=r.toLowerCase();return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",keyword:"create",suffix:e,[e]:t}}}(u,i),t=e):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=function(){var t,e,n,o;t=Ki,(e=Jf())!==s&&Up()!==s?("grants"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(oe)),n!==s&&Up()!==s?((o=function(){var t,e,n,o,u,a,i;t=Ki,"for"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(vr));e!==s&&Up()!==s&&(n=af())!==s&&Up()!==s?(o=Ki,(u=bp())!==s&&(a=Up())!==s&&(i=af())!==s?o=u=[u,a,i]:(Ki=o,o=s),o===s&&(o=null),o!==s&&(u=Up())!==s?((a=function(){var r,t;r=Ki,_b()!==s&&Up()!==s&&(t=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=af())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=af())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=af())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=Yt(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=r,r=t):(Ki=r,r=s);return r}())===s&&(a=null),a!==s?(Qi=t,l=a,e={user:n,host:(c=o)&&c[2],role_list:l},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var c,l;return t}())===s&&(o=null),o!==s?(Qi=t,u=o,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"show",keyword:"grants",for:u}},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var u;return t}()))))))));var b,p,v;var d;return t}())===s&&(t=function(){var t,e,n;t=Ki,(e=Ob())===s&&(e=function(){var t,e,n,o;t=Ki,"describe"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Bu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DESCRIBE"):(Ki=t,t=s)):(Ki=t,t=s);return t}());e!==s&&Up()!==s&&(n=af())!==s?(Qi=t,o=n,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"desc",table:o}},t=e):(Ki=t,t=s);var o;return t}())===s&&(t=function(){var t,e,n,o,u,a,i,c,l;t=Ki,"grant"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Ue));e!==s&&Up()!==s&&(n=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Wc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Wc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Wc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=C(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s&&Up()!==s&&(o=mb())!==s&&Up()!==s?((u=function(){var t,e;t=Ki,(e=yb())===s&&("function"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Qt)),e===s&&("procedure"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(Kt))));e!==s&&(Qi=t,e={type:"origin",value:e.toUpperCase()});return t=e}())===s&&(u=null),u!==s&&Up()!==s&&(a=function(){var r,t,e,n,o;r=Ki,t=Ki,(e=af())===s&&(e=Sp());e!==s&&(n=Up())!==s&&(o=gp())!==s?t=e=[e,n,o]:(Ki=t,t=s);t===s&&(t=null);t!==s&&(e=Up())!==s?((n=af())===s&&(n=Sp()),n!==s?(Qi=r,a=n,t={prefix:(u=t)&&u[0],name:a},r=t):(Ki=r,r=s)):(Ki=r,r=s);var u,a;return r}())!==s&&Up()!==s&&(i=Zf())!==s&&Up()!==s&&(c=Vc())!==s&&Up()!==s?((l=function(){var t,e,n;t=Ki,gb()!==s&&Up()!==s?("grant"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Ue)),e!==s&&Up()!==s?("option"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(De)),n!==s?(Qi=t,t={type:"origin",value:"with grant option"}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(l=null),l!==s?(Qi=t,f=n,b=u,p=a,v=i,d=c,y=l,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"grant",keyword:"priv",objects:f,on:{object_type:b,priv_level:[p]},to_from:v[0],user_or_roles:d,with:y}},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var f,b,p,v,d,y;t===s&&(t=Ki,"GRANT"===r.substr(Ki,5)?(e="GRANT",Ki+=5):(e=s,0===rc&&sc(He)),e!==s&&Up()!==s?("PROXY"===r.substr(Ki,5)?(n="PROXY",Ki+=5):(n=s,0===rc&&sc(Ye)),n!==s&&Up()!==s&&(o=mb())!==s&&Up()!==s&&(u=qc())!==s&&Up()!==s&&(a=Zf())!==s&&Up()!==s&&(i=Vc())!==s&&Up()!==s?((c=Xc())===s&&(c=null),c!==s?(Qi=t,e=function(r,t,e,n){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"grant",keyword:"proxy",objects:[{priv:{type:"origin",value:"proxy"}}],on:r,to_from:t[0],user_or_roles:e,with:n}}}(u,a,i,c),t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"GRANT"===r.substr(Ki,5)?(e="GRANT",Ki+=5):(e=s,0===rc&&sc(He)),e!==s&&Up()!==s&&(n=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=af())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=af())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=af())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=C(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s&&Up()!==s&&(o=Zf())!==s&&Up()!==s&&(u=Vc())!==s&&Up()!==s?((a=Xc())===s&&(a=null),a!==s?(Qi=t,e=function(r,t,e,n){return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"grant",keyword:"role",objects:r.map(r=>({priv:{type:"string",value:r}})),to_from:t[0],user_or_roles:e,with:n}}}(n,o,u,a),t=e):(Ki=t,t=s)):(Ki=t,t=s)));return t}())===s&&(t=function(){var t,e,n;t=Ki,(e=function(){var t,e,n,o;t=Ki,"explain"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(pu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s&&(n=el())!==s?(Qi=t,o=n,e={tableList:Array.from(wv),columnList:vv(Lv),ast:{type:"explain",expr:o}},t=e):(Ki=t,t=s);var o;return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"commit"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(ve));e===s&&("rollback"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(de)));e!==s&&(Qi=t,e={type:"transaction",expr:{action:{type:"origin",value:e}}});(t=e)===s&&(t=Ki,"begin"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(ye)),e!==s&&Up()!==s?("work"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(we)),n===s&&("transaction"===r.substr(Ki,11).toLowerCase()?(n=r.substr(Ki,11),Ki+=11):(n=s,0===rc&&sc(Le))),n===s&&(n=null),n!==s&&Up()!==s?((o=Yc())===s&&(o=null),o!==s?(Qi=t,e=function(r,t){return {type:"transaction",expr:{action:{type:"origin",value:"begin"},keyword:r,modes:t}}}(n,o),t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"start"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Ce)),e!==s&&Up()!==s?("transaction"===r.substr(Ki,11).toLowerCase()?(n=r.substr(Ki,11),Ki+=11):(n=s,0===rc&&sc(he)),n!==s&&Up()!==s?((o=Yc())===s&&(o=null),o!==s?(Qi=t,e=function(r,t){return {type:"transaction",expr:{action:{type:"origin",value:"start"},keyword:r,modes:t}}}(n,o),t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)));return t}())===s&&(t=function(){var t,e,n,o,u,a,i,c,l,f,b,p,v,y,w,L,C,h,m,E,A,T,_,g,I;t=Ki,"load"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Se));e!==s&&Up()!==s?("data"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(gt)),n!==s&&Up()!==s?("low_priority"===r.substr(Ki,12).toLowerCase()?(o=r.substr(Ki,12),Ki+=12):(o=s,0===rc&&sc(Ft)),o===s&&("concurrent"===r.substr(Ki,10).toLowerCase()?(o=r.substr(Ki,10),Ki+=10):(o=s,0===rc&&sc(Ne))),o===s&&(o=null),o!==s&&Up()!==s?("local"===r.substr(Ki,5).toLowerCase()?(u=r.substr(Ki,5),Ki+=5):(u=s,0===rc&&sc(X)),u===s&&(u=null),u!==s&&Up()!==s?("infile"===r.substr(Ki,6).toLowerCase()?(a=r.substr(Ki,6),Ki+=6):(a=s,0===rc&&sc(Oe)),a!==s&&Up()!==s&&(i=sf())!==s&&Up()!==s?((c=xl())===s&&(c=null),c!==s&&Up()!==s?("into"===r.substr(Ki,4).toLowerCase()?(l=r.substr(Ki,4),Ki+=4):(l=s,0===rc&&sc(Re)),l!==s&&Up()!==s?("table"===r.substr(Ki,5).toLowerCase()?(f=r.substr(Ki,5),Ki+=5):(f=s,0===rc&&sc(xe)),f!==s&&Up()!==s&&(b=Ll())!==s&&Up()!==s?((p=Ol())===s&&(p=null),p!==s&&Up()!==s?(v=Ki,(y=Mc())!==s&&(w=Up())!==s&&(L=sf())!==s?v=y=[y,w,L]:(Ki=v,v=s),v===s&&(v=null),v!==s&&(y=Up())!==s?((w=function(){var t,e,n,o,u,a,i,c,l,f,b,p;t=Ki,"fields"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(me));e===s&&("columns"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(te)));e!==s&&Up()!==s?(n=Ki,"terminated"===r.substr(Ki,10).toLowerCase()?(o=r.substr(Ki,10),Ki+=10):(o=s,0===rc&&sc(Ee)),o!==s&&(u=Up())!==s?("by"===r.substr(Ki,2).toLowerCase()?(a=r.substr(Ki,2),Ki+=2):(a=s,0===rc&&sc(d)),a!==s&&(i=Up())!==s&&(c=sf())!==s?n=o=[o,u,a,i,c]:(Ki=n,n=s)):(Ki=n,n=s),n===s&&(n=null),n!==s&&(o=Up())!==s?(u=Ki,"optionally"===r.substr(Ki,10).toLowerCase()?(a=r.substr(Ki,10),Ki+=10):(a=s,0===rc&&sc(Ae)),a===s&&(a=null),a!==s&&(i=Up())!==s?("enclosed"===r.substr(Ki,8).toLowerCase()?(c=r.substr(Ki,8),Ki+=8):(c=s,0===rc&&sc(Te)),c!==s&&(l=Up())!==s?("by"===r.substr(Ki,2).toLowerCase()?(f=r.substr(Ki,2),Ki+=2):(f=s,0===rc&&sc(d)),f!==s&&(b=Up())!==s&&(p=sf())!==s?u=a=[a,i,c,l,f,b,p]:(Ki=u,u=s)):(Ki=u,u=s)):(Ki=u,u=s),u===s&&(u=null),u!==s&&(a=Up())!==s?(i=Ki,"escaped"===r.substr(Ki,7).toLowerCase()?(c=r.substr(Ki,7),Ki+=7):(c=s,0===rc&&sc(_e)),c!==s&&(l=Up())!==s?("by"===r.substr(Ki,2).toLowerCase()?(f=r.substr(Ki,2),Ki+=2):(f=s,0===rc&&sc(d)),f!==s&&(b=Up())!==s&&(p=sf())!==s?i=c=[c,l,f,b,p]:(Ki=i,i=s)):(Ki=i,i=s),i===s&&(i=null),i!==s?(Qi=t,v=e,w=u,L=i,(y=n)&&(y[4].prefix="TERMINATED BY"),w&&(w[6].prefix=(w[0]&&"OPTIONALLY"===w[0].toUpperCase()?"OPTIONALLY ":"")+"ENCLOSED BY"),L&&(L[4].prefix="ESCAPED BY"),e={keyword:v,terminated:y&&y[4],enclosed:w&&w[6],escaped:L&&L[4]},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var v,y,w,L;return t}())===s&&(w=null),w!==s&&(L=Up())!==s?((C=function(){var t,e,n,o;t=Ki,"lines"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Ie));e!==s&&Up()!==s?((n=Bc())===s&&(n=null),n!==s&&Up()!==s?((o=Bc())===s&&(o=null),o!==s?(Qi=t,e=function(r,t,e){if(t&&e&&t.type===e.type)throw new Error("LINES cannot be specified twice");return t&&Reflect.deleteProperty(t,"type"),e&&Reflect.deleteProperty(e,"type"),{keyword:r,...t||{},...e||{}}}(e,n,o),t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(C=null),C!==s&&Up()!==s?(h=Ki,(m=lb())!==s&&(E=Up())!==s&&(A=$f())!==s&&(T=Up())!==s?("lines"===r.substr(Ki,5).toLowerCase()?(_=r.substr(Ki,5),Ki+=5):(_=s,0===rc&&sc(Ie)),_===s&&("rows"===r.substr(Ki,4).toLowerCase()?(_=r.substr(Ki,4),Ki+=4):(_=s,0===rc&&sc(je))),_!==s?h=m=[m,E,A,T,_]:(Ki=h,h=s)):(Ki=h,h=s),h===s&&(h=null),h!==s&&(m=Up())!==s?((E=ol())===s&&(E=null),E!==s&&(A=Up())!==s?(T=Ki,(_=vb())!==s&&(g=Up())!==s&&(I=Il())!==s?T=_=[_,g,I]:(Ki=T,T=s),T===s&&(T=null),T!==s?(Qi=t,N=E,O=T,e={type:"load_data",mode:o,local:u,file:i,replace_ignore:c,table:b,partition:p,character_set:v,fields:w,lines:C,ignore:(S=h)&&{count:S[2],suffix:S[4]},column:N,set:O&&O[2]},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var S,N,O;return t}()),t}function lc(){var r;return (r=bc())===s&&(r=function(){var r,t,e,n,o,u,a,i;r=Ki,(t=Up())!==s?((e=Qc())===s&&(e=null),e!==s&&Up()!==s&&nb()!==s&&Up()!==s&&(n=vl())!==s&&Up()!==s&&vb()!==s&&Up()!==s&&(o=Il())!==s&&Up()!==s?((u=hl())===s&&(u=null),u!==s&&Up()!==s?((a=Al())===s&&(a=null),a!==s&&Up()!==s?((i=gl())===s&&(i=null),i!==s?(Qi=r,t=function(r,t,e,n,o,s){const u={};return t&&t.forEach(r=>{const{db:t,as:e,table:n,join:o}=r,s=o?"select":"update";t&&(u[n]=t),n&&wv.add(`${s}::${t}::${n}`);}),e&&e.forEach(r=>{if(r.table){const t=pv(r.table);wv.add(`update::${u[t]||null}::${t}`);}Lv.add(`update::${r.table}::${r.column}`);}),{tableList:Array.from(wv),columnList:vv(Lv),ast:{with:r,type:"update",table:t,set:e,where:n,orderby:o,limit:s}}}(e,n,o,u,a,i),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(r=function(){var r,t,e,n,o,u,a,i,c;r=Ki,(t=xl())!==s&&Up()!==s?((e=lb())===s&&(e=null),e!==s&&Up()!==s?((n=bb())===s&&(n=null),n!==s&&Up()!==s&&(o=Ll())!==s&&Up()!==s?((u=Ol())===s&&(u=null),u!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(a=nf())!==s&&Up()!==s&&Op()!==s&&Up()!==s&&(i=Nl())!==s&&Up()!==s?((c=Rl())===s&&(c=null),c!==s?(Qi=r,t=function(r,t,e,n,o,s,u,a){if(n&&(wv.add(`insert::${n.db}::${n.table}`),n.as=null),s){let r=n&&n.table||null;Array.isArray(u.values)&&u.values.forEach((r,t)=>{if(r.value.length!=s.length)throw new Error("Error: column count doesn't match value count at row "+(t+1))}),s.forEach(t=>Lv.add(`insert::${r}::${t}`));}const i=[t,e].filter(r=>r).map(r=>r[0]&&r[0].toLowerCase()).join(" ");return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r,table:[n],columns:s,values:u,partition:o,prefix:i,on_duplicate_update:a}}}(t,e,n,o,u,a,i,c),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(r=function(){var r,t,e,n,o,u,a,i;r=Ki,(t=xl())!==s&&Up()!==s?((e=lb())===s&&(e=null),e!==s&&Up()!==s?((n=bb())===s&&(n=null),n!==s&&Up()!==s&&(o=Ll())!==s&&Up()!==s?((u=Ol())===s&&(u=null),u!==s&&Up()!==s&&(a=Nl())!==s&&Up()!==s?((i=Rl())===s&&(i=null),i!==s?(Qi=r,t=function(r,t,e,n,o,s,u){n&&(wv.add(`insert::${n.db}::${n.table}`),Lv.add(`insert::${n.table}::(.*)`),n.as=null);const a=[t,e].filter(r=>r).map(r=>r[0]&&r[0].toLowerCase()).join(" ");return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r,table:[n],columns:null,values:s,partition:o,prefix:a,on_duplicate_update:u}}}(t,e,n,o,u,a,i),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(r=function(){var r,t,e,n,o,u,a,i;r=Ki,(t=xl())!==s&&Up()!==s?((e=lb())===s&&(e=null),e!==s&&Up()!==s?((n=bb())===s&&(n=null),n!==s&&Up()!==s&&(o=Ll())!==s&&Up()!==s?((u=Ol())===s&&(u=null),u!==s&&Up()!==s&&vb()!==s&&Up()!==s&&(a=Il())!==s&&Up()!==s?((i=Rl())===s&&(i=null),i!==s?(Qi=r,t=function(r,t,e,n,o,s,u){n&&(wv.add(`insert::${n.db}::${n.table}`),Lv.add(`insert::${n.table}::(.*)`),n.as=null);const a=[t,e].filter(r=>r).map(r=>r[0]&&r[0].toLowerCase()).join(" ");return {tableList:Array.from(wv),columnList:vv(Lv),ast:{type:r,table:[n],columns:null,partition:o,prefix:a,set:s,on_duplicate_update:u}}}(t,e,n,o,u,a,i),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(r=function(){var r,t,e,n,o,u,a,i;r=Ki,(t=Up())!==s?((e=Qc())===s&&(e=null),e!==s&&Up()!==s&&ub()!==s&&Up()!==s?((n=vl())===s&&(n=null),n!==s&&Up()!==s&&(o=cl())!==s&&Up()!==s?((u=hl())===s&&(u=null),u!==s&&Up()!==s?((a=Al())===s&&(a=null),a!==s&&Up()!==s?((i=gl())===s&&(i=null),i!==s?(Qi=r,t=function(r,t,e,n,o,s){if(e){(Array.isArray(e)?e:e.expr).forEach(r=>{const{db:t,as:e,table:n,join:o}=r,s=o?"select":"delete";n&&wv.add(`${s}::${t}::${n}`),o||Lv.add(`delete::${n}::(.*)`);});}if(null===t&&1===e.length){const r=e[0];t=[{db:r.db,table:r.table,as:r.as,addition:true}];}return {tableList:Array.from(wv),columnList:vv(Lv),ast:{with:r,type:"delete",table:t,from:e,where:n,orderby:o,limit:s}}}(e,n,o,u,a,i),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(r=cc())===s&&(r=function(){var r,t;r=[],t=Yp();for(;t!==s;)r.push(t),t=Yp();return r}()),r}function fc(){var t,e,n,o;return t=Ki,(e=function(){var t,e,n,o;t=Ki,"union"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Su));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s?((n=Rb())===s&&(n=xb()),n===s&&(n=null),n!==s?(Qi=t,t=e=(o=n)?"union "+o.toLowerCase():"union"):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=function(){var t,e,n,o;t=Ki,"minus"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Nu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e="minus"),(t=e)===s&&(t=Ki,(e=function(){var t,e,n,o;t=Ki,"intersect"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(Ou));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e="intersect"),(t=e)===s&&(t=Ki,(e=function(){var t,e,n,o;t=Ki,"except"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Ru));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e="except"),t=e))),t}function bc(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Kc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=fc())!==s&&(a=Up())!==s&&(i=Kc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=fc())!==s&&(a=Up())!==s&&(i=Kc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s&&(n=Up())!==s?((o=Al())===s&&(o=null),o!==s&&(u=Up())!==s?((a=gl())===s&&(a=null),a!==s?(Qi=r,r=t=function(r,t,e,n){let o=r;for(let r=0;r<t.length;r++)o._next=t[r][3],o.set_op=t[r][1],o=o._next;return e&&(r._orderby=e),n&&(r._limit=n),{tableList:Array.from(wv),columnList:vv(Lv),ast:r}}(t,e,o,a)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);}else Ki=r,r=s;return r}function pc(){var r,t,e;return r=Ki,(t=Fl())!==s&&Up()!==s?((e=Nb())===s&&(e=Ob()),e===s&&(e=null),e!==s?(Qi=r,r=t=c(t,e)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=function(){var r,t,e;r=Ki,(t=ef())!==s&&Up()!==s?((e=Nb())===s&&(e=Ob()),e===s&&(e=null),e!==s?(Qi=r,t=c(t,e),r=t):(Ki=r,r=s)):(Ki=r,r=s);return r}()),r}function vc(){var t,e;return t=Ki,"if"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(f)),e!==s&&Up()!==s&&Pb()!==s&&Up()!==s&&Mb()!==s?(Qi=t,t=e="IF NOT EXISTS"):(Ki=t,t=s),t}function dc(){var t,e,n;return t=Ki,(e=qc())!==s&&Up()!==s?((n=function(){var t,e,n,o,u,a,i,c,l;return t=Ki,r.substr(Ki,10)===b?(e=b,Ki+=10):(e=s,0===rc&&sc(p)),e!==s&&Up()!==s?(n=Ki,"with"===r.substr(Ki,4).toLowerCase()?(o=r.substr(Ki,4),Ki+=4):(o=s,0===rc&&sc(v)),o!==s&&(u=Up())!==s&&(a=af())!==s?n=o=[o,u,a]:(Ki=n,n=s),n===s&&(n=null),n!==s&&(o=Up())!==s?("by"===r.substr(Ki,2).toLowerCase()?(u=r.substr(Ki,2),Ki+=2):(u=s,0===rc&&sc(d)),u!==s&&(a=Up())!==s?("random"===r.substr(Ki,6).toLowerCase()?(i=r.substr(Ki,6),Ki+=6):(i=s,0===rc&&sc(y)),i!==s&&Up()!==s?("password"===r.substr(Ki,8).toLowerCase()?(c=r.substr(Ki,8),Ki+=8):(c=s,0===rc&&sc(w)),c!==s?(Qi=t,t=e={keyword:["identified",(l=n)&&l[0].toLowerCase()].filter(r=>r).join(" "),auth_plugin:l&&l[2],value:{prefix:"by",type:"origin",value:"random password"}}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,r.substr(Ki,10)===b?(e=b,Ki+=10):(e=s,0===rc&&sc(p)),e!==s&&Up()!==s?(n=Ki,"with"===r.substr(Ki,4).toLowerCase()?(o=r.substr(Ki,4),Ki+=4):(o=s,0===rc&&sc(v)),o!==s&&(u=Up())!==s&&(a=af())!==s?n=o=[o,u,a]:(Ki=n,n=s),n===s&&(n=null),n!==s&&(o=Up())!==s?("by"===r.substr(Ki,2).toLowerCase()?(u=r.substr(Ki,2),Ki+=2):(u=s,0===rc&&sc(d)),u!==s&&(a=Up())!==s&&(i=Ff())!==s?(Qi=t,t=e=function(r,t){return t.prefix="by",{keyword:["identified",r&&r[0].toLowerCase()].filter(r=>r).join(" "),auth_plugin:r&&r[2],value:t}}(n,i)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,r.substr(Ki,10)===b?(e=b,Ki+=10):(e=s,0===rc&&sc(p)),e!==s&&Up()!==s?("with"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(v)),n!==s&&(o=Up())!==s&&(u=af())!==s&&(a=Up())!==s?("as"===r.substr(Ki,2).toLowerCase()?(i=r.substr(Ki,2),Ki+=2):(i=s,0===rc&&sc(L)),i!==s&&Up()!==s&&(c=Ff())!==s?(Qi=t,t=e=function(r,t){return t.prefix="as",{keyword:"identified with",auth_plugin:r&&r[2],value:t}}(u,c)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s))),t}())===s&&(n=null),n!==s?(Qi=t,t=e={user:e,auth_option:n}):(Ki=t,t=s)):(Ki=t,t=s),t}function yc(){var t,e,n;return t=Ki,"none"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(m)),e===s&&("ssl"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(E)),e===s&&("x509"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(A)))),e!==s&&(Qi=t,e={type:"origin",value:e}),(t=e)===s&&(t=Ki,"cipher"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(T)),e===s&&("issuer"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(_)),e===s&&("subject"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(g)))),e!==s&&Up()!==s&&(n=Ff())!==s?(Qi=t,t=e=I(e,n)):(Ki=t,t=s)),t}function wc(){var t,e,n;return t=Ki,"max_queries_per_hour"===r.substr(Ki,20).toLowerCase()?(e=r.substr(Ki,20),Ki+=20):(e=s,0===rc&&sc(N)),e===s&&("max_updates_per_hour"===r.substr(Ki,20).toLowerCase()?(e=r.substr(Ki,20),Ki+=20):(e=s,0===rc&&sc(O)),e===s&&("max_connections_per_hour"===r.substr(Ki,24).toLowerCase()?(e=r.substr(Ki,24),Ki+=24):(e=s,0===rc&&sc(R)),e===s&&("max_user_connections"===r.substr(Ki,20).toLowerCase()?(e=r.substr(Ki,20),Ki+=20):(e=s,0===rc&&sc(x))))),e!==s&&Up()!==s&&(n=$f())!==s?(Qi=t,t=e=I(e,n)):(Ki=t,t=s),t}function Lc(){var t,e,n,o,u,a;return t=Ki,"password"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(w)),e!==s&&Up()!==s?("expire"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(j)),n!==s&&Up()!==s?("default"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(k)),o===s&&("never"===r.substr(Ki,5).toLowerCase()?(o=r.substr(Ki,5),Ki+=5):(o=s,0===rc&&sc(U)),o===s&&(o=Dl())),o!==s?(Qi=t,t=e={keyword:"password expire",value:"string"==typeof(a=o)?{type:"origin",value:a}:a}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"password"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(w)),e!==s&&Up()!==s?("history"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(D)),n!==s&&Up()!==s?("default"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(k)),o===s&&(o=$f()),o!==s?(Qi=t,t=e=function(r){return {keyword:"password history",value:"string"==typeof r?{type:"origin",value:r}:r}}(o)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"password"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(w)),e!==s&&Up()!==s?("REUSE"===r.substr(Ki,5)?(n="REUSE",Ki+=5):(n=s,0===rc&&sc(M)),n!==s&&Up()!==s&&(o=Dl())!==s?(Qi=t,t=e=function(r){return {keyword:"password reuse",value:r}}(o)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"password"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(w)),e!==s&&Up()!==s?("require"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(S)),n!==s&&Up()!==s?("current"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(P)),o!==s&&Up()!==s?("default"===r.substr(Ki,7).toLowerCase()?(u=r.substr(Ki,7),Ki+=7):(u=s,0===rc&&sc(k)),u===s&&("optional"===r.substr(Ki,8).toLowerCase()?(u=r.substr(Ki,8),Ki+=8):(u=s,0===rc&&sc(G))),u!==s?(Qi=t,t=e=function(r){return {keyword:"password require current",value:{type:"origin",value:r}}}(u)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"failed_login_attempts"===r.substr(Ki,21).toLowerCase()?(e=r.substr(Ki,21),Ki+=21):(e=s,0===rc&&sc(F)),e!==s&&Up()!==s&&(n=$f())!==s?(Qi=t,t=e=function(r){return {keyword:"failed_login_attempts",value:r}}(n)):(Ki=t,t=s),t===s&&(t=Ki,"password_lock_time"===r.substr(Ki,18).toLowerCase()?(e=r.substr(Ki,18),Ki+=18):(e=s,0===rc&&sc(H)),e!==s&&Up()!==s?((n=$f())===s&&("unbounded"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(Y))),n!==s?(Qi=t,t=e=function(r){return {keyword:"password_lock_time",value:"string"==typeof r?{type:"origin",value:r}:r}}(n)):(Ki=t,t=s)):(Ki=t,t=s)))))),t}function Cc(){var r;return (r=xc())===s&&(r=mc())===s&&(r=Oc())===s&&(r=Rc()),r}function hc(){var t,e,n,o,u;return t=Ki,(e=function(){var t,e;t=Ki,(e=function(){var t,e,n,o;t=Ki,"not null"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Qs));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e={type:"not null",value:"not null"});return t=e}())===s&&(e=Gf()),e!==s&&(Qi=t,(u=e)&&!u.value&&(u.value="null"),e={nullable:u}),(t=e)===s&&(t=Ki,(e=function(){var r,t;r=Ki,zf()!==s&&Up()!==s&&(t=Fl())!==s?(Qi=r,r={type:"default",value:t}):(Ki=r,r=s);return r}())!==s&&(Qi=t,e={default_val:e}),(t=e)===s&&(t=Ki,"auto_increment"===r.substr(Ki,14).toLowerCase()?(e=r.substr(Ki,14),Ki+=14):(e=s,0===rc&&sc(ur)),e!==s&&(Qi=t,e={auto_increment:e.toLowerCase()}),(t=e)===s&&(t=Ki,"unique"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(ar)),e!==s&&Up()!==s?("key"===r.substr(Ki,3).toLowerCase()?(n=r.substr(Ki,3),Ki+=3):(n=s,0===rc&&sc(ir)),n===s&&(n=null),n!==s?(Qi=t,t=e=function(r){const t=["unique"];return r&&t.push(r),{unique:t.join(" ").toLowerCase("")}}(n)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"primary"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(cr)),e===s&&(e=null),e!==s&&Up()!==s?("key"===r.substr(Ki,3).toLowerCase()?(n=r.substr(Ki,3),Ki+=3):(n=s,0===rc&&sc(ir)),n!==s?(Qi=t,t=e=function(r){const t=[];return r&&t.push("primary"),t.push("key"),{primary_key:t.join(" ").toLowerCase("")}}(e)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Pp())!==s&&(Qi=t,e={comment:e}),(t=e)===s&&(t=Ki,(e=Ac())!==s&&(Qi=t,e={collate:e}),(t=e)===s&&(t=Ki,(e=function(){var t,e,n;t=Ki,"column_format"===r.substr(Ki,13).toLowerCase()?(e=r.substr(Ki,13),Ki+=13):(e=s,0===rc&&sc(hr));e!==s&&Up()!==s?("fixed"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(mr)),n===s&&("dynamic"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(Er)),n===s&&("default"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(k)))),n!==s?(Qi=t,e={type:"column_format",value:n.toLowerCase()},t=e):(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e={column_format:e}),(t=e)===s&&(t=Ki,(e=function(){var t,e,n;t=Ki,"storage"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Ar));e!==s&&Up()!==s?("disk"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(Tr)),n===s&&("memory"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(_r))),n!==s?(Qi=t,e={type:"storage",value:n.toLowerCase()},t=e):(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e={storage:e}),(t=e)===s&&(t=Ki,(e=kc())!==s&&(Qi=t,e={reference_definition:e}),(t=e)===s&&(t=Ki,(e=function(){var t,e,n,o,u,a,i,c;t=Ki,(e=jc())===s&&(e=null);e!==s&&Up()!==s?("check"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(K)),n!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(o=Hl())!==s&&Up()!==s&&Op()!==s&&Up()!==s?(u=Ki,(a=Pb())===s&&(a=null),a!==s&&(i=Up())!==s?("enforced"===r.substr(Ki,8).toLowerCase()?(c=r.substr(Ki,8),Ki+=8):(c=s,0===rc&&sc(tt)),c!==s?u=a=[a,i,c]:(Ki=u,u=s)):(Ki=u,u=s),u===s&&(u=null),u!==s?(Qi=t,e=function(r,t,e,n){const o=[];return n&&o.push(n[0],n[2]),{constraint_type:t.toLowerCase(),keyword:r&&r.keyword,constraint:r&&r.constraint,definition:[e],enforced:o.filter(r=>r).join(" ").toLowerCase(),resource:"constraint"}}(e,n,o,u),t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e={check:e}),(t=e)===s&&(t=Ki,(e=Mc())!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s&&(o=sf())!==s?(Qi=t,t=e=function(r,t,e){return {character_set:{type:r,value:e,symbol:t}}}(e,n,o)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=function(){var t,e,n,o,u,a,i,c;t=Ki,e=Ki,(n=function(){var t,e,n,o,u;t=Ki,e=Ki,"generated"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(gr));n!==s&&(o=Up())!==s?("always"===r.substr(Ki,6).toLowerCase()?(u=r.substr(Ki,6),Ki+=6):(u=s,0===rc&&sc(Ir)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s);e!==s&&(Qi=t,e=e.join("").toLowerCase());return t=e}())===s&&(n=null);n!==s&&(o=Up())!==s?("as"===r.substr(Ki,2).toLowerCase()?(u=r.substr(Ki,2),Ki+=2):(u=s,0===rc&&sc(L)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s);if(e!==s)if((n=Up())!==s)if((o=Np())!==s)if((u=Up())!==s)if((a=Pf())===s&&(a=Fl()),a!==s)if(Up()!==s)if(Op()!==s)if(Up()!==s){for(i=[],"stored"===r.substr(Ki,6).toLowerCase()?(c=r.substr(Ki,6),Ki+=6):(c=s,0===rc&&sc(Sr)),c===s&&("virtual"===r.substr(Ki,7).toLowerCase()?(c=r.substr(Ki,7),Ki+=7):(c=s,0===rc&&sc(Nr)));c!==s;)i.push(c),"stored"===r.substr(Ki,6).toLowerCase()?(c=r.substr(Ki,6),Ki+=6):(c=s,0===rc&&sc(Sr)),c===s&&("virtual"===r.substr(Ki,7).toLowerCase()?(c=r.substr(Ki,7),Ki+=7):(c=s,0===rc&&sc(Nr)));i!==s?(Qi=t,l=i,e={type:"generated",expr:a,value:e.filter(r=>"string"==typeof r).join(" ").toLowerCase(),storage_type:l&&l[0]&&l[0].toLowerCase()},t=e):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;var l;return t}())!==s&&(Qi=t,e={generated:e}),t=e)))))))))))),t}function mc(){var r,t,e,n,o,u,a;return r=Ki,(t=ef())!==s&&Up()!==s&&(e=rv())!==s&&Up()!==s?((n=function(){var r,t,e,n,o,u;if(r=Ki,(t=hc())!==s)if(Up()!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=hc())!==s?n=o=[o,u]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=hc())!==s?n=o=[o,u]:(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){let e=r;for(let r=0;r<t.length;r++)e={...e,...t[r][1]};return e}(t,e)):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;return r}())===s&&(n=null),n!==s?(Qi=r,o=t,u=e,a=n,Lv.add(`create::${o.table}::${o.column}`),r=t={column:o,definition:u,resource:"column",...a||{}}):(Ki=r,r=s)):(Ki=r,r=s),r}function Ec(){var t,e,n,o,u;return t=Ki,"definer"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(nr)),e!==s&&Up()!==s&&dp()!==s&&Up()!==s?((n=pf())===s&&(n=Ff()),n!==s&&Up()!==s?(64===r.charCodeAt(Ki)?(o="@",Ki++):(o=s,0===rc&&sc(lr)),o!==s&&Up()!==s?((u=pf())===s&&(u=Ff()),u!==s?(Qi=t,t=e=function(r,t){const e=cv("@",r,t);return cv("=",{type:"origin",value:"definer"},e)}(n,u)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"definer"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(nr)),e!==s&&Up()!==s&&dp()!==s&&Up()!==s&&(n=lp())!==s&&Up()!==s&&(o=Np())!==s&&Up()!==s&&(u=Op())!==s?(Qi=t,t=e=fr()):(Ki=t,t=s),t===s&&(t=Ki,"definer"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(nr)),e!==s&&Up()!==s&&dp()!==s&&Up()!==s&&(n=lp())!==s?(Qi=t,t=e=fr()):(Ki=t,t=s))),t}function Ac(){var t,e,n;return t=Ki,function(){var t,e,n,o;t=Ki,"collate"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(pt));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="COLLATE"):(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s?((e=dp())===s&&(e=null),e!==s&&Up()!==s&&(n=af())!==s?(Qi=t,t={type:"collate",keyword:"collate",collate:{name:n,symbol:e}}):(Ki=t,t=s)):(Ki=t,t=s),t}function Tc(){var t,e,n;return t=Ki,"if"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(Or)),e!==s&&Up()!==s?("exists"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(Rr)),n!==s?(Qi=t,t=e="if exists"):(Ki=t,t=s)):(Ki=t,t=s),t}function _c(){var t,e,n;return t=Ki,"first"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(xr)),e!==s&&(Qi=t,e={keyword:e}),(t=e)===s&&(t=Ki,"after"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(jr)),e!==s&&Up()!==s&&(n=ef())!==s?(Qi=t,t=e=function(r,t){return {keyword:r,expr:t}}(e,n)):(Ki=t,t=s)),t}function gc(){var t,e,n;return (t=function(){var r,t;r=Ki,yp()!==s&&Up()!==s&&(t=xc())!==s?(Qi=r,r={action:"add",create_definitions:t,resource:"constraint",type:"alter"}):(Ki=r,r=s);return r}())===s&&(t=function(){var t,e,n,o;t=Ki,(e=rb())!==s&&Up()!==s?("check"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(K)),n!==s&&Up()!==s&&(o=wf())!==s?(Qi=t,e={action:"drop",constraint:o,keyword:n.toLowerCase(),resource:"constraint",type:"alter"},t=e):(Ki=t,t=s)):(Ki=t,t=s);t===s&&(t=Ki,(e=rb())!==s&&Up()!==s?("constraint"===r.substr(Ki,10).toLowerCase()?(n=r.substr(Ki,10),Ki+=10):(n=s,0===rc&&sc(Qr)),n!==s&&Up()!==s&&(o=wf())!==s?(Qi=t,e=function(r,t){return {action:"drop",constraint:t,keyword:r.toLowerCase(),resource:"constraint",type:"alter"}}(n,o),t=e):(Ki=t,t=s)):(Ki=t,t=s));return t}())===s&&(t=function(){var t,e,n,o,u,a;t=Ki,(e=rb())!==s&&Up()!==s?("primary"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(cr)),n!==s&&(o=Up())!==s&&(u=Cp())!==s?(Qi=t,t=e={action:"drop",key:"",keyword:"primary key",resource:"key",type:"alter"}):(Ki=t,t=s)):(Ki=t,t=s);t===s&&(t=Ki,(e=rb())!==s&&Up()!==s?(n=Ki,"foreign"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(Kr)),o===s&&(o=null),o!==s&&(u=Up())!==s&&(a=Cp())!==s?n=o=[o,u,a]:(Ki=n,n=s),n===s&&(n=Lp()),n!==s&&(o=Up())!==s&&(u=af())!==s?(Qi=t,e=function(r,t){const e=Array.isArray(r)?"key":"index";return {action:"drop",[e]:t,keyword:Array.isArray(r)?""+[r[0],r[2]].filter(r=>r).join(" ").toLowerCase():r.toLowerCase(),resource:e,type:"alter"}}(n,u),t=e):(Ki=t,t=s)):(Ki=t,t=s));return t}())===s&&(t=function(){var t,e,n,o;t=Ki,gb()!==s&&Up()!==s?("check"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(K)),e!==s&&Up()!==s?("check"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(K)),n!==s&&Up()!==s&&Tp()!==s&&Up()!==s&&(o=wf())!==s?(Qi=t,t={action:"with",constraint:o,keyword:"check check",resource:"constraint",type:"alter"}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n;t=Ki,"nocheck"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(zr));e!==s&&Up()!==s&&Tp()!==s&&Up()!==s&&(n=wf())!==s?(Qi=t,t=e={action:"nocheck",constraint:n,resource:"constraint",type:"alter"}):(Ki=t,t=s);return t}())===s&&(t=function(){var r,t,e,n,o;r=Ki,(t=yp())!==s&&Up()!==s&&(e=wp())!==s&&Up()!==s&&(n=mc())!==s&&Up()!==s?((o=_c())===s&&(o=null),o!==s?(Qi=r,u=e,a=n,i=o,t={action:"add",...a,keyword:u,suffix:i,resource:"column",type:"alter"},r=t):(Ki=r,r=s)):(Ki=r,r=s);var u,a,i;r===s&&(r=Ki,(t=yp())!==s&&Up()!==s&&(e=mc())!==s&&Up()!==s?((n=_c())===s&&(n=null),n!==s?(Qi=r,t=function(r,t){return {action:"add",...r,suffix:t,resource:"column",type:"alter"}}(e,n),r=t):(Ki=r,r=s)):(Ki=r,r=s));return r}())===s&&(t=function(){var r,t,e,n;r=Ki,(t=rb())!==s&&Up()!==s&&(e=wp())!==s&&Up()!==s&&(n=ef())!==s?(Qi=r,r=t={action:"drop",column:n,keyword:e,resource:"column",type:"alter"}):(Ki=r,r=s);r===s&&(r=Ki,(t=rb())!==s&&Up()!==s&&(e=ef())!==s?(Qi=r,t=function(r){return {action:"drop",column:r,resource:"column",type:"alter"}}(e),r=t):(Ki=r,r=s));return r}())===s&&(t=function(){var t,e,n,o,u;t=Ki,(e=function(){var t,e,n,o;t=Ki,"modify"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(pi));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MODIFY"):(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s?((n=wp())===s&&(n=null),n!==s&&Up()!==s&&(o=mc())!==s&&Up()!==s?((u=_c())===s&&(u=null),u!==s?(Qi=t,a=o,i=u,e={action:"modify",keyword:n,...a,suffix:i,resource:"column",type:"alter"},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var a,i;return t}())===s&&(t=function(){var r,t,e;r=Ki,(t=yp())!==s&&Up()!==s&&(e=Oc())!==s?(Qi=r,n=e,t={action:"add",type:"alter",...n},r=t):(Ki=r,r=s);var n;return r}())===s&&(t=function(){var r,t,e;r=Ki,(t=yp())!==s&&Up()!==s&&(e=Rc())!==s?(Qi=r,n=e,t={action:"add",type:"alter",...n},r=t):(Ki=r,r=s);var n;return r}())===s&&(t=function(){var r,t,e,n,o;r=Ki,(t=cb())!==s&&Up()!==s&&wp()!==s&&Up()!==s&&(e=ef())!==s&&Up()!==s?((n=Zf())===s&&(n=db()),n===s&&(n=null),n!==s&&Up()!==s&&(o=ef())!==s?(Qi=r,a=o,t={action:"rename",type:"alter",resource:"column",keyword:"column",old_column:e,prefix:(u=n)&&u[0].toLowerCase(),column:a},r=t):(Ki=r,r=s)):(Ki=r,r=s);var u,a;return r}())===s&&(t=function(){var r,t,e,n;r=Ki,(t=cb())!==s&&Up()!==s?((e=Zf())===s&&(e=db()),e===s&&(e=null),e!==s&&Up()!==s&&(n=af())!==s?(Qi=r,u=n,t={action:"rename",type:"alter",resource:"table",keyword:(o=e)&&o[0].toLowerCase(),table:u},r=t):(Ki=r,r=s)):(Ki=r,r=s);var o,u;return r}())===s&&(t=Sc())===s&&(t=Nc())===s&&(t=function(){var t,e,n,o,u,a;t=Ki,"change"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Xr));e!==s&&Up()!==s?((n=wp())===s&&(n=null),n!==s&&Up()!==s&&(o=ef())!==s&&Up()!==s&&(u=mc())!==s&&Up()!==s?((a=_c())===s&&(a=null),a!==s?(Qi=t,i=n,c=u,l=a,e={action:"change",old_column:o,...c,keyword:i,resource:"column",type:"alter",suffix:l},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var i,c,l;return t}())===s&&(t=function(){var t,e,n,o,u;t=Ki,"drop"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Dr));e===s&&("truncate"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Mr)),e===s&&("discard"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Pr)),e===s&&("import"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Gr)),e===s&&("coalesce"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Fr)),e===s&&("analyze"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Hr)),e===s&&("check"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(K))))))));e!==s&&Up()!==s&&(n=fb())!==s&&Up()!==s&&(o=ol())!==s&&Up()!==s?("tablespace"===r.substr(Ki,10).toLowerCase()?(u=r.substr(Ki,10),Ki+=10):(u=s,0===rc&&sc(Yr)),u===s&&(u=null),u!==s?(Qi=t,e=function(r,t,e,n){const o={action:r.toLowerCase(),keyword:t,resource:"partition",type:"alter",partitions:e};return n&&(o.suffix={keyword:n}),o}(e,n,o,u),t=e):(Ki=t,t=s)):(Ki=t,t=s);t===s&&(t=Ki,(e=yp())!==s&&Up()!==s&&(n=fb())!==s&&Up()!==s&&(o=Np())!==s&&Up()!==s&&(u=function(){var r,t,e,n,o,u,a,c;if(r=Ki,(t=Ic())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=Ic())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=Ic())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);e!==s?(Qi=r,t=i(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s&&Up()!==s&&Op()!==s?(Qi=t,t=e={action:"add",keyword:n,resource:"partition",type:"alter",partitions:u}):(Ki=t,t=s));return t}())===s&&(t=Ki,(e=Gc())!==s&&(Qi=t,(n=e).resource=n.keyword,n[n.keyword]=n.value,delete n.value,e={type:"alter",...n}),t=e),t}function Ic(){var t,e,n,o,u;return t=Ki,fb()!==s&&Up()!==s&&(e=sf())!==s&&Up()!==s&&Tb()!==s&&Up()!==s?("less"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(kr)),n!==s&&Up()!==s?("than"===r.substr(Ki,4).toLowerCase()?(o=r.substr(Ki,4),Ki+=4):(o=s,0===rc&&sc(Ur)),o!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(u=$f())!==s&&Up()!==s&&Op()!==s?(Qi=t,t={name:e,value:{type:"less than",expr:u,parentheses:true}}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function Sc(){var t,e,n,o;return t=Ki,"algorithm"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(z)),e!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s?("default"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(k)),o===s&&("instant"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(Br)),o===s&&("inplace"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc($r)),o===s&&("copy"===r.substr(Ki,4).toLowerCase()?(o=r.substr(Ki,4),Ki+=4):(o=s,0===rc&&sc(Wr))))),o!==s?(Qi=t,t=e={type:"alter",keyword:"algorithm",resource:"algorithm",symbol:n,algorithm:o}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function Nc(){var t,e,n,o;return t=Ki,"lock"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc($)),e!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s?("default"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(k)),o===s&&("none"===r.substr(Ki,4).toLowerCase()?(o=r.substr(Ki,4),Ki+=4):(o=s,0===rc&&sc(m)),o===s&&("shared"===r.substr(Ki,6).toLowerCase()?(o=r.substr(Ki,6),Ki+=6):(o=s,0===rc&&sc(qr)),o===s&&("exclusive"===r.substr(Ki,9).toLowerCase()?(o=r.substr(Ki,9),Ki+=9):(o=s,0===rc&&sc(Vr))))),o!==s?(Qi=t,t=e={type:"alter",keyword:"lock",resource:"lock",symbol:n,lock:o}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function Oc(){var r,t,e,n,o,u,a,i;return r=Ki,(t=Lp())===s&&(t=Cp()),t!==s&&Up()!==s?((e=df())===s&&(e=null),e!==s&&Up()!==s?((n=fl())===s&&(n=null),n!==s&&Up()!==s&&(o=rl())!==s&&Up()!==s?((u=bl())===s&&(u=null),u!==s&&Up()!==s?(Qi=r,a=n,i=u,r=t={index:e,definition:o,keyword:t.toLowerCase(),index_type:a,resource:"index",index_options:i}):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r}function Rc(){var r,t,e,n,o,u,a,i,c;return r=Ki,(t=hp())===s&&(t=mp()),t!==s&&Up()!==s?((e=Lp())===s&&(e=Cp()),e===s&&(e=null),e!==s&&Up()!==s?((n=df())===s&&(n=null),n!==s&&Up()!==s&&(o=Zc())!==s&&Up()!==s?((u=bl())===s&&(u=null),u!==s?(Qi=r,a=t,c=u,r=t={index:n,definition:o,keyword:(i=e)&&`${a.toLowerCase()} ${i.toLowerCase()}`||a.toLowerCase(),index_options:c,resource:"index"}):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r}function xc(){var t;return (t=function(){var t,e,n,o,u,a,i,c;t=Ki,(e=jc())===s&&(e=null);e!==s&&Up()!==s?(n=Ki,"primary"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(cr)),o!==s&&(u=Up())!==s?("key"===r.substr(Ki,3).toLowerCase()?(a=r.substr(Ki,3),Ki+=3):(a=s,0===rc&&sc(ir)),a!==s?n=o=[o,u,a]:(Ki=n,n=s)):(Ki=n,n=s),n!==s&&(o=Up())!==s?((u=fl())===s&&(u=null),u!==s&&(a=Up())!==s&&(i=rl())!==s&&Up()!==s?((c=bl())===s&&(c=null),c!==s?(Qi=t,f=n,b=u,p=i,v=c,e={constraint:(l=e)&&l.constraint,definition:p,constraint_type:`${f[0].toLowerCase()} ${f[2].toLowerCase()}`,keyword:l&&l.keyword,index_type:b,resource:"constraint",index_options:v},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var l,f,b,p,v;return t}())===s&&(t=function(){var r,t,e,n,o,u,a,i;r=Ki,(t=jc())===s&&(t=null);t!==s&&Up()!==s&&(e=Ep())!==s&&Up()!==s?((n=Lp())===s&&(n=Cp()),n===s&&(n=null),n!==s&&Up()!==s?((o=df())===s&&(o=null),o!==s&&Up()!==s?((u=fl())===s&&(u=null),u!==s&&Up()!==s&&(a=rl())!==s&&Up()!==s?((i=bl())===s&&(i=null),i!==s?(Qi=r,l=e,f=n,b=o,p=u,v=a,d=i,t={constraint:(c=t)&&c.constraint,definition:v,constraint_type:f&&`${l.toLowerCase()} ${f.toLowerCase()}`||l.toLowerCase(),keyword:c&&c.keyword,index_type:p,index:b,resource:"constraint",index_options:d},r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);var c,l,f,b,p,v,d;return r}())===s&&(t=function(){var t,e,n,o,u,a;t=Ki,(e=jc())===s&&(e=null);e!==s&&Up()!==s?("foreign key"===r.substr(Ki,11).toLowerCase()?(n=r.substr(Ki,11),Ki+=11):(n=s,0===rc&&sc(rt)),n!==s&&Up()!==s?((o=df())===s&&(o=null),o!==s&&Up()!==s&&(u=Zc())!==s&&Up()!==s?((a=kc())===s&&(a=null),a!==s?(Qi=t,c=n,l=o,f=u,b=a,e={constraint:(i=e)&&i.constraint,definition:f,constraint_type:c,keyword:i&&i.keyword,index:l,resource:"constraint",reference_definition:b},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var i,c,l,f,b;return t}())===s&&(t=function(){var t,e,n,o,u,a,i,c,l,f;t=Ki,(e=jc())===s&&(e=null);e!==s&&Up()!==s?("check"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(K)),n!==s&&Up()!==s?(o=Ki,"not"===r.substr(Ki,3).toLowerCase()?(u=r.substr(Ki,3),Ki+=3):(u=s,0===rc&&sc(Zr)),u!==s&&(a=Up())!==s?("for"===r.substr(Ki,3).toLowerCase()?(i=r.substr(Ki,3),Ki+=3):(i=s,0===rc&&sc(vr)),i!==s&&(c=Up())!==s?("replication"===r.substr(Ki,11).toLowerCase()?(l=r.substr(Ki,11),Ki+=11):(l=s,0===rc&&sc(Jr)),l!==s&&(f=Up())!==s?o=u=[u,a,i,c,l,f]:(Ki=o,o=s)):(Ki=o,o=s)):(Ki=o,o=s),o===s&&(o=null),o!==s&&(u=Np())!==s&&(a=Up())!==s&&(i=Hl())!==s&&(c=Up())!==s&&(l=Op())!==s?(Qi=t,b=e,p=o,v=i,e={constraint_type:n.toLowerCase(),keyword:b&&b.keyword,constraint:b&&b.constraint,index_type:p&&{keyword:"not for replication"},definition:[v],resource:"constraint"},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var b,p,v;return t}()),t}function jc(){var r,t,e,n;return r=Ki,(t=Tp())!==s&&Up()!==s?((e=af())===s&&(e=null),e!==s?(Qi=r,n=e,r=t={keyword:t.toLowerCase(),constraint:n}):(Ki=r,r=s)):(Ki=r,r=s),r}function kc(){var t,e,n,o,u,a,i,c,l,f;return t=Ki,(e=_p())!==s&&Up()!==s&&(n=vl())!==s&&Up()!==s&&(o=Zc())!==s&&Up()!==s?("match full"===r.substr(Ki,10).toLowerCase()?(u=r.substr(Ki,10),Ki+=10):(u=s,0===rc&&sc(et)),u===s&&("match partial"===r.substr(Ki,13).toLowerCase()?(u=r.substr(Ki,13),Ki+=13):(u=s,0===rc&&sc(nt)),u===s&&("match simple"===r.substr(Ki,12).toLowerCase()?(u=r.substr(Ki,12),Ki+=12):(u=s,0===rc&&sc(ot)))),u===s&&(u=null),u!==s&&Up()!==s?((a=Uc())===s&&(a=null),a!==s&&Up()!==s?((i=Uc())===s&&(i=null),i!==s?(Qi=t,c=u,l=a,f=i,t=e={definition:o,table:n,keyword:e.toLowerCase(),match:c&&c.toLowerCase(),on_action:[l,f].filter(r=>r)}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Uc())!==s&&(Qi=t,e={on_action:[e]}),t=e),t}function Uc(){var t,e,n,o;return t=Ki,mb()!==s&&Up()!==s?((e=ub())===s&&(e=nb()),e!==s&&Up()!==s&&(n=function(){var t,e,n;t=Ki,(e=cp())!==s&&Up()!==s&&Np()!==s&&Up()!==s?((n=Ul())===s&&(n=null),n!==s&&Up()!==s&&Op()!==s?(Qi=t,t=e={type:"function",name:{name:[{type:"origin",value:e}]},args:n}):(Ki=t,t=s)):(Ki=t,t=s);t===s&&(t=Ki,(e=Dc())===s&&("set null"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(at)),e===s&&("no action"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(it)),e===s&&("set default"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(ct)),e===s&&(e=cp())))),e!==s&&(Qi=t,e={type:"origin",value:e.toLowerCase()}),t=e);return t}())!==s?(Qi=t,o=n,t={type:"on "+e[0].toLowerCase(),value:o}):(Ki=t,t=s)):(Ki=t,t=s),t}function Dc(){var t,e;return t=Ki,"restrict"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(st)),e===s&&("cascade"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(ut))),e!==s&&(Qi=t,e=e.toLowerCase()),t=e}function Mc(){var t,e,n;return t=Ki,"character"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(lt)),e!==s&&Up()!==s?("set"===r.substr(Ki,3).toLowerCase()?(n=r.substr(Ki,3),Ki+=3):(n=s,0===rc&&sc(ft)),n!==s?(Qi=t,t=e="CHARACTER SET"):(Ki=t,t=s)):(Ki=t,t=s),t}function Pc(){var t,e,n,o,u,a,i,c,l;return t=Ki,(e=zf())===s&&(e=null),e!==s&&Up()!==s?((n=Mc())===s&&("charset"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(bt)),n===s&&("collate"===r.substr(Ki,7).toLowerCase()?(n=r.substr(Ki,7),Ki+=7):(n=s,0===rc&&sc(pt)))),n!==s&&Up()!==s?((o=dp())===s&&(o=null),o!==s&&Up()!==s&&(u=sf())!==s?(Qi=t,i=n,c=o,l=u,t=e={keyword:(a=e)&&`${a[0].toLowerCase()} ${i.toLowerCase()}`||i.toLowerCase(),symbol:c,value:l}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function Gc(){var t,e,n,o,u,a,i,c,l;return t=Ki,"auto_increment"===r.substr(Ki,14).toLowerCase()?(e=r.substr(Ki,14),Ki+=14):(e=s,0===rc&&sc(ur)),e===s&&("avg_row_length"===r.substr(Ki,14).toLowerCase()?(e=r.substr(Ki,14),Ki+=14):(e=s,0===rc&&sc(vt)),e===s&&("key_block_size"===r.substr(Ki,14).toLowerCase()?(e=r.substr(Ki,14),Ki+=14):(e=s,0===rc&&sc(dt)),e===s&&("max_rows"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(yt)),e===s&&("min_rows"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(wt)),e===s&&("stats_sample_pages"===r.substr(Ki,18).toLowerCase()?(e=r.substr(Ki,18),Ki+=18):(e=s,0===rc&&sc(Lt))))))),e!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s&&(o=$f())!==s?(Qi=t,c=n,l=o,t=e={keyword:e.toLowerCase(),symbol:c,value:l.value}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"CHECKSUM"===r.substr(Ki,8)?(e="CHECKSUM",Ki+=8):(e=s,0===rc&&sc(Ct)),e===s&&("DELAY_KEY_WRITE"===r.substr(Ki,15)?(e="DELAY_KEY_WRITE",Ki+=15):(e=s,0===rc&&sc(ht))),e!==s&&Up()!==s&&(n=dp())!==s&&Up()!==s?(mt.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(Et)),o!==s?(Qi=t,t=e=function(r,t,e){return {keyword:r.toLowerCase(),symbol:t,value:e}}(e,n,o)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Pc())===s&&(t=Ki,(e=Ap())===s&&("connection"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(At)),e===s&&("engine_attribute"===r.substr(Ki,16).toLowerCase()?(e=r.substr(Ki,16),Ki+=16):(e=s,0===rc&&sc(Tt)),e===s&&("secondary_engine_attribute"===r.substr(Ki,26).toLowerCase()?(e=r.substr(Ki,26),Ki+=26):(e=s,0===rc&&sc(_t))))),e!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s&&(o=Ff())!==s?(Qi=t,t=e=function(r,t,e){return {keyword:r.toLowerCase(),symbol:t,value:`'${e.value}'`}}(e,n,o)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"data"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(gt)),e===s&&("index"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(It))),e!==s&&Up()!==s?("directory"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(St)),n!==s&&Up()!==s?((o=dp())===s&&(o=null),o!==s&&(u=Up())!==s&&(a=Ff())!==s?(Qi=t,t=e=function(r,t,e){return {keyword:r.toLowerCase()+" directory",symbol:t,value:`'${e.value}'`}}(e,o,a)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"compression"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(Nt)),e!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s?(o=Ki,39===r.charCodeAt(Ki)?(u="'",Ki++):(u=s,0===rc&&sc(Ot)),u!==s?("zlib"===r.substr(Ki,4).toLowerCase()?(a=r.substr(Ki,4),Ki+=4):(a=s,0===rc&&sc(Rt)),a===s&&("lz4"===r.substr(Ki,3).toLowerCase()?(a=r.substr(Ki,3),Ki+=3):(a=s,0===rc&&sc(xt)),a===s&&("none"===r.substr(Ki,4).toLowerCase()?(a=r.substr(Ki,4),Ki+=4):(a=s,0===rc&&sc(m)))),a!==s?(39===r.charCodeAt(Ki)?(i="'",Ki++):(i=s,0===rc&&sc(Ot)),i!==s?o=u=[u,a,i]:(Ki=o,o=s)):(Ki=o,o=s)):(Ki=o,o=s),o!==s?(Qi=t,t=e=function(r,t,e){return {keyword:r.toLowerCase(),symbol:t,value:e.join("").toUpperCase()}}(e,n,o)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"engine"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(jt)),e!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s&&(o=wf())!==s?(Qi=t,t=e=kt(e,n,o)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"row_format"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Ut)),e!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s?("default"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(k)),o===s&&("dynamic"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(Er)),o===s&&("fixed"===r.substr(Ki,5).toLowerCase()?(o=r.substr(Ki,5),Ki+=5):(o=s,0===rc&&sc(mr)),o===s&&("compressed"===r.substr(Ki,10).toLowerCase()?(o=r.substr(Ki,10),Ki+=10):(o=s,0===rc&&sc(Dt)),o===s&&("redundant"===r.substr(Ki,9).toLowerCase()?(o=r.substr(Ki,9),Ki+=9):(o=s,0===rc&&sc(Mt)),o===s&&("compact"===r.substr(Ki,7).toLowerCase()?(o=r.substr(Ki,7),Ki+=7):(o=s,0===rc&&sc(Pt))))))),o!==s?(Qi=t,t=e=kt(e,n,o)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s))))))),t}function Fc(){var t,e,n,o,u;return t=Ki,(e=yl())!==s&&Up()!==s&&(n=function(){var t,e,n;return t=Ki,"read"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Gt)),e!==s&&Up()!==s?("local"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(X)),n===s&&(n=null),n!==s?(Qi=t,t=e={type:"read",suffix:n&&"local"}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"low_priority"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(Ft)),e===s&&(e=null),e!==s&&Up()!==s?("write"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(Ht)),n!==s?(Qi=t,t=e={type:"write",prefix:e&&"low_priority"}):(Ki=t,t=s)):(Ki=t,t=s)),t}())!==s?(Qi=t,o=e,u=n,wv.add(`lock::${o.db}::${o.table}`),t=e={table:o,lock_type:u}):(Ki=t,t=s),t}function Hc(){var t,e,n,o;return t=Ki,"isolation"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(le)),e!==s&&Up()!==s?("level"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(fe)),n!==s&&Up()!==s&&(o=function(){var t,e,n;return t=Ki,"serializable"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(se)),e!==s&&(Qi=t,e={type:"origin",value:"serializable"}),(t=e)===s&&(t=Ki,"repeatable"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(ue)),e!==s&&Up()!==s?("read"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(Gt)),n!==s?(Qi=t,t=e={type:"origin",value:"repeatable read"}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"read"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Gt)),e!==s&&Up()!==s?("committed"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(ae)),n===s&&("uncommitted"===r.substr(Ki,11).toLowerCase()?(n=r.substr(Ki,11),Ki+=11):(n=s,0===rc&&sc(ie))),n!==s?(Qi=t,t=e=ce(n)):(Ki=t,t=s)):(Ki=t,t=s))),t}())!==s?(Qi=t,t=e={type:"origin",value:"isolation level "+o.value}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"read"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Gt)),e!==s&&Up()!==s?("write"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(Ht)),n===s&&("only"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(be))),n!==s?(Qi=t,t=e=ce(n)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Pb())===s&&(e=null),e!==s&&Up()!==s?("deferrable"===r.substr(Ki,10).toLowerCase()?(n=r.substr(Ki,10),Ki+=10):(n=s,0===rc&&sc(pe)),n!==s?(Qi=t,t=e={type:"origin",value:e?"not deferrable":"deferrable"}):(Ki=t,t=s)):(Ki=t,t=s))),t}function Yc(){var r,t,e,n,o,u,a,c;if(r=Ki,(t=Hc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=Hc())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=Hc())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);e!==s?(Qi=r,r=t=i(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Bc(){var t,e,n,o,u,a;return t=Ki,"starting"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(ge)),e===s&&("terminated"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Ee))),e!==s&&Up()!==s?("by"===r.substr(Ki,2).toLowerCase()?(n=r.substr(Ki,2),Ki+=2):(n=s,0===rc&&sc(d)),n!==s&&Up()!==s&&(o=sf())!==s?(Qi=t,u=e,(a=o).prefix=u.toUpperCase()+" BY",t=e={type:u.toLowerCase(),[u.toLowerCase()]:a}):(Ki=t,t=s)):(Ki=t,t=s),t}function $c(){var t;return (t=function(){var t,e,n,o,u;return t=Ki,(e=Rb())===s&&(e=tb())===s&&(e=Ki,(n=ob())!==s&&(o=Up())!==s?("view"===r.substr(Ki,4).toLowerCase()?(u=r.substr(Ki,4),Ki+=4):(u=s,0===rc&&sc(ke)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s),e===s&&(e=ob())===s&&(e=ub())===s&&(e=rb())===s&&(e=Ki,"grant"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(Ue)),n!==s&&(o=Up())!==s?("option"===r.substr(Ki,6).toLowerCase()?(u=r.substr(Ki,6),Ki+=6):(u=s,0===rc&&sc(De)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s),e===s&&(e=Lp())===s&&(e=ab())===s&&(e=_p())===s&&(e=eb())===s&&(e=Ki,(n=Jf())!==s&&(o=Up())!==s&&(u=fp())!==s?e=n=[n,o,u]:(Ki=e,e=s),e===s&&(e=wb())===s&&(e=nb())))),e!==s&&(Qi=t,e=Me(e)),t=e}())===s&&(t=function(){var t,e,n,o,u;return t=Ki,e=Ki,(n=tb())!==s&&(o=Up())!==s?("routine"===r.substr(Ki,7).toLowerCase()?(u=r.substr(Ki,7),Ki+=7):(u=s,0===rc&&sc(Pe)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s),e===s&&("execute"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Ge)),e===s&&(e=Ki,"grant"===r.substr(Ki,5).toLowerCase()?(n=r.substr(Ki,5),Ki+=5):(n=s,0===rc&&sc(Ue)),n!==s&&(o=Up())!==s?("option"===r.substr(Ki,6).toLowerCase()?(u=r.substr(Ki,6),Ki+=6):(u=s,0===rc&&sc(De)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s),e===s&&(e=Ki,(n=ob())!==s&&(o=Up())!==s?("routine"===r.substr(Ki,7).toLowerCase()?(u=r.substr(Ki,7),Ki+=7):(u=s,0===rc&&sc(Pe)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s)))),e!==s&&(Qi=t,e=Me(e)),t=e}()),t}function Wc(){var r,t,e,n,o,u,a,i,c;return r=Ki,(t=$c())!==s&&Up()!==s?(e=Ki,(n=Np())!==s&&(o=Up())!==s&&(u=ml())!==s&&(a=Up())!==s&&(i=Op())!==s?e=n=[n,o,u,a,i]:(Ki=e,e=s),e===s&&(e=null),e!==s?(Qi=r,r=t={priv:t,columns:(c=e)&&c[2]}):(Ki=r,r=s)):(Ki=r,r=s),r}function qc(){var t,e,n,o,u,a,i;return t=Ki,(e=af())!==s&&Up()!==s?(n=Ki,64===r.charCodeAt(Ki)?(o="@",Ki++):(o=s,0===rc&&sc(lr)),o!==s&&(u=Up())!==s&&(a=af())!==s?n=o=[o,u,a]:(Ki=n,n=s),n===s&&(n=null),n!==s?(Qi=t,t=e={name:{type:"single_quote_string",value:e},host:(i=n)?{type:"single_quote_string",value:i[2]}:null}):(Ki=t,t=s)):(Ki=t,t=s),t}function Vc(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=qc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=qc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=qc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=C(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Xc(){var t,e,n;return t=Ki,gb()!==s&&Up()!==s?("admin"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Fe)),e!==s&&Up()!==s?("option"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(De)),n!==s?(Qi=t,t={type:"origin",value:"with admin option"}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function Kc(){var t,e,n,o,u,a,i;return (t=el())===s&&(t=Ki,e=Ki,40===r.charCodeAt(Ki)?(n="(",Ki++):(n=s,0===rc&&sc(Be)),n!==s&&(o=Up())!==s&&(u=Kc())!==s&&(a=Up())!==s?(41===r.charCodeAt(Ki)?(i=")",Ki++):(i=s,0===rc&&sc($e)),i!==s?e=n=[n,o,u,a,i]:(Ki=e,e=s)):(Ki=e,e=s),e!==s&&(Qi=t,e={...e[2],parentheses_symbol:true}),t=e),t}function Qc(){var t,e,n,o,u,a,i,c,l,f,b,p,v;if(t=Ki,gb()!==s)if(Up()!==s)if((e=zc())!==s){for(n=[],o=Ki,(u=Up())!==s&&(a=Ip())!==s&&(i=Up())!==s&&(c=zc())!==s?o=u=[u,a,i,c]:(Ki=o,o=s);o!==s;)n.push(o),o=Ki,(u=Up())!==s&&(a=Ip())!==s&&(i=Up())!==s&&(c=zc())!==s?o=u=[u,a,i,c]:(Ki=o,o=s);n!==s?(Qi=t,t=sr(e,n)):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;if(t===s)if(t=Ki,Up()!==s)if(gb()!==s)if((e=Up())!==s)if((n=function(){var t,e,n,o;t=Ki,"recursive"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(cu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s)if((o=Up())!==s)if((u=zc())!==s){for(a=[],i=Ki,(c=Up())!==s&&(l=Ip())!==s&&(f=Up())!==s&&(b=zc())!==s?i=c=[c,l,f,b]:(Ki=i,i=s);i!==s;)a.push(i),i=Ki,(c=Up())!==s&&(l=Ip())!==s&&(f=Up())!==s&&(b=zc())!==s?i=c=[c,l,f,b]:(Ki=i,i=s);a!==s?(Qi=t,v=a,(p=u).recursive=true,t=fv(p,v)):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;return t}function zc(){var r,t,e,n,o,u,a;return r=Ki,(t=Ff())===s&&(t=wf())===s&&(t=Ll()),t!==s&&Up()!==s?((e=Zc())===s&&(e=null),e!==s&&Up()!==s&&db()!==s&&Up()!==s&&Np()!==s&&Up()!==s?((n=jl())===s&&(n=bc()),n!==s&&Up()!==s&&Op()!==s?(Qi=r,u=e,a=n,"string"==typeof(o=t)&&(o={type:"default",value:o}),o.table&&(o={type:"default",value:o.table}),r=t={name:o,stmt:a,columns:u}):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r}function Zc(){var r,t;return r=Ki,Np()!==s&&Up()!==s&&(t=function(){var r;(r=ml())===s&&(r=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Pf())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Pf())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Pf())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=sr(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}());return r}())!==s&&Up()!==s&&Op()!==s?(Qi=r,r=t):(Ki=r,r=s),r}function Jc(){var t,e,n,o,u,a,i;if(t=Ki,(e=vf())!==s)if(Up()!==s)if((n=Np())!==s)if(Up()!==s){if(o=[],We.test(r.charAt(Ki))?(u=r.charAt(Ki),Ki++):(u=s,0===rc&&sc(qe)),u!==s)for(;u!==s;)o.push(u),We.test(r.charAt(Ki))?(u=r.charAt(Ki),Ki++):(u=s,0===rc&&sc(qe));else o=s;o!==s&&(u=Up())!==s&&Op()!==s&&Up()!==s?((a=Nb())===s&&(a=Ob()),a===s&&(a=null),a!==s?(Qi=t,i=a,t=e={type:"column_ref",column:e,suffix:`(${parseInt(o.join(""),10)})`,order_by:i,...av()}):(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;return t===s&&(t=Ki,(e=vf())!==s&&Up()!==s?((n=Nb())===s&&(n=Ob()),n===s&&(n=null),n!==s?(Qi=t,t=e=function(r,t){return {type:"column_ref",column:r,order_by:t,...av()}}(e,n)):(Ki=t,t=s)):(Ki=t,t=s)),t}function rl(){var r,t,e;return r=Ki,Np()!==s&&Up()!==s?((t=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Jc())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Jc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Jc())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=sr(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}())===s&&(t=Ul()),t!==s&&Up()!==s&&Op()!==s?(Qi=r,r=(e=t).type?e.value:e):(Ki=r,r=s)):(Ki=r,r=s),r}function tl(){var t,e,n,o;return t=Ki,(e=function(){var t,e,n,o,u,a;return t=Ki,e=Ki,"for"===r.substr(Ki,3).toLowerCase()?(n=r.substr(Ki,3),Ki+=3):(n=s,0===rc&&sc(vr)),n!==s&&(o=Up())!==s&&(u=nb())!==s?e=n=[n,o,u]:(Ki=e,e=s),e!==s&&(Qi=t,e=`${(a=e)[0]} ${a[2][0]}`),t=e}())===s&&(e=function(){var t,e,n,o,u,a,i,c,l,f;return t=Ki,e=Ki,"lock"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc($)),n!==s&&(o=Up())!==s?("in"===r.substr(Ki,2).toLowerCase()?(u=r.substr(Ki,2),Ki+=2):(u=s,0===rc&&sc(Ve)),u!==s&&(a=Up())!==s?("share"===r.substr(Ki,5).toLowerCase()?(i=r.substr(Ki,5),Ki+=5):(i=s,0===rc&&sc(Xe)),i!==s&&(c=Up())!==s?("mode"===r.substr(Ki,4).toLowerCase()?(l=r.substr(Ki,4),Ki+=4):(l=s,0===rc&&sc(Ke)),l!==s?e=n=[n,o,u,a,i,c,l]:(Ki=e,e=s)):(Ki=e,e=s)):(Ki=e,e=s)):(Ki=e,e=s),e!==s&&(Qi=t,e=`${(f=e)[0]} ${f[2]} ${f[4]} ${f[6]}`),t=e}()),e!==s&&Up()!==s?((n=function(){var t,e,n,o,u,a,i;return t=Ki,e=Ki,"wait"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(Qe)),n!==s&&(o=Up())!==s&&(u=$f())!==s?e=n=[n,o,u]:(Ki=e,e=s),e!==s&&(Qi=t,e=`${(a=e)[0]} ${a[2].value}`),(t=e)===s&&("nowait"===r.substr(Ki,6).toLowerCase()?(t=r.substr(Ki,6),Ki+=6):(t=s,0===rc&&sc(ze)),t===s&&(t=Ki,e=Ki,"skip"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(Ze)),n!==s&&(o=Up())!==s?("locked"===r.substr(Ki,6).toLowerCase()?(u=r.substr(Ki,6),Ki+=6):(u=s,0===rc&&sc(Je)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s),e!==s&&(Qi=t,e=`${(i=e)[0]} ${i[2]}`),t=e)),t}())===s&&(n=null),n!==s?(Qi=t,t=e=e+((o=n)?" "+o:"")):(Ki=t,t=s)):(Ki=t,t=s),t}function el(){var t,e,n,o,u,a,i,c,l,f,b,p,v,d,y,w,L;return t=Ki,Up()!==s?((e=Qc())===s&&(e=null),e!==s&&Up()!==s&&eb()!==s&&Dp()!==s?((n=function(){var r,t,e,n,o,u;if(r=Ki,(t=nl())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=nl())!==s?n=o=[o,u]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=nl())!==s?n=o=[o,u]:(Ki=n,n=s);e!==s?(Qi=r,t=function(r,t){const e=[r];for(let r=0,n=t.length;r<n;++r)e.push(t[r][1]);return e}(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())===s&&(n=null),n!==s&&Up()!==s?((o=xb())===s&&(o=null),o!==s&&Up()!==s&&(u=ol())!==s&&Up()!==s?((a=il())===s&&(a=null),a!==s&&Up()!==s?((i=cl())===s&&(i=null),i!==s&&Up()!==s?((c=il())===s&&(c=null),c!==s&&Up()!==s?((l=hl())===s&&(l=null),l!==s&&Up()!==s?((f=function(){var t,e,n,o;t=Ki,(e=function(){var t,e,n,o;t=Ki,"group"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Du));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s&&Sb()!==s&&Up()!==s&&(n=Ul())!==s&&Up()!==s?((o=function(){var t,e;t=Ki,gb()!==s&&Up()!==s?("rollup"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Ln)),e!==s?(Qi=t,t={type:"origin",value:"with rollup"}):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(o=null),o!==s?(Qi=t,u=o,e={columns:n.value,modifiers:[u]},t=e):(Ki=t,t=s)):(Ki=t,t=s);var u;return t}())===s&&(f=null),f!==s&&Up()!==s?((b=function(){var t,e;t=Ki,function(){var t,e,n,o;t=Ki,"having"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Pu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s&&(e=Yl())!==s?(Qi=t,t=e):(Ki=t,t=s);return t}())===s&&(b=null),b!==s&&Up()!==s?((p=Al())===s&&(p=null),p!==s&&Up()!==s?((v=Ac())===s&&(v=null),v!==s&&Up()!==s?((d=gl())===s&&(d=null),d!==s&&Up()!==s?((y=tl())===s&&(y=null),y!==s&&Up()!==s?((w=function(){var t,e,n;t=Ki,"window"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Co));e!==s&&Up()!==s&&(n=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Tf())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Tf())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Tf())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=fv(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=t,t=e={keyword:"window",type:"window",expr:n}):(Ki=t,t=s);return t}())===s&&(w=null),w!==s&&Up()!==s?((L=il())===s&&(L=null),L!==s?(Qi=t,t=function(r,t,e,n,o,s,u,a,i,c,l,f,b,p,v,d){if(o&&u||o&&d||u&&d||o&&u&&d)throw new Error("A given SQL statement can contain at most one INTO clause");if(s){(Array.isArray(s)?s:s.expr).forEach(r=>r.table&&wv.add(`select::${r.db}::${r.table}`));}return {with:r,type:"select",options:t,distinct:e,columns:n,into:{...o||u||d||{},position:(o?"column":u&&"from")||d&&"end"},from:s,where:a,groupby:i,having:c,orderby:l,limit:b,locking_read:p&&p,window:v,collate:f,...av()}}(e,n,o,u,a,i,c,l,f,b,p,v,d,y,w,L)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function nl(){var t,e;return t=Ki,(e=function(){var t;"sql_calc_found_rows"===r.substr(Ki,19).toLowerCase()?(t=r.substr(Ki,19),Ki+=19):(t=s,0===rc&&sc(Li));return t}())===s&&((e=function(){var t;"sql_cache"===r.substr(Ki,9).toLowerCase()?(t=r.substr(Ki,9),Ki+=9):(t=s,0===rc&&sc(Ci));return t}())===s&&(e=function(){var t;"sql_no_cache"===r.substr(Ki,12).toLowerCase()?(t=r.substr(Ki,12),Ki+=12):(t=s,0===rc&&sc(hi));return t}()),e===s&&(e=function(){var t;"sql_big_result"===r.substr(Ki,14).toLowerCase()?(t=r.substr(Ki,14),Ki+=14):(t=s,0===rc&&sc(Ei));return t}())===s&&(e=function(){var t;"sql_small_result"===r.substr(Ki,16).toLowerCase()?(t=r.substr(Ki,16),Ki+=16):(t=s,0===rc&&sc(mi));return t}())===s&&(e=function(){var t;"sql_buffer_result"===r.substr(Ki,17).toLowerCase()?(t=r.substr(Ki,17),Ki+=17):(t=s,0===rc&&sc(Ai));return t}())),e!==s&&(Qi=t,e=e),t=e}function ol(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Rb())===s&&(t=Ki,(e=Sp())!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Sp())),t!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ul())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ul())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){Lv.add("select::null::(.*)");const e={expr:{type:"column_ref",table:null,column:"*"},as:null,...av()};return t&&t.length>0?fv(e,t):[e]}(0,e)):(Ki=r,r=s);}else Ki=r,r=s;if(r===s)if(r=Ki,(t=ul())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ul())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ul())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=sr(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function sl(){var t,e,n,o,u,a,i;return t=Ki,"match"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(sn)),e!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(n=ml())!==s&&Up()!==s&&Op()!==s&&Up()!==s?("AGAINST"===r.substr(Ki,7)?(o="AGAINST",Ki+=7):(o=s,0===rc&&sc(un)),o!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(u=Fl())!==s&&Up()!==s?((a=function(){var t,e,n,o,u,a,i;return t=Ki,kb()!==s&&Up()!==s?("natural"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(rn)),e!==s&&Up()!==s?("language"===r.substr(Ki,8).toLowerCase()?(n=r.substr(Ki,8),Ki+=8):(n=s,0===rc&&sc(tn)),n!==s&&Up()!==s?("mode"===r.substr(Ki,4).toLowerCase()?(o=r.substr(Ki,4),Ki+=4):(o=s,0===rc&&sc(Ke)),o!==s&&Up()!==s?("with"===r.substr(Ki,4).toLowerCase()?(u=r.substr(Ki,4),Ki+=4):(u=s,0===rc&&sc(v)),u!==s&&Up()!==s?("query"===r.substr(Ki,5).toLowerCase()?(a=r.substr(Ki,5),Ki+=5):(a=s,0===rc&&sc(en)),a!==s&&Up()!==s?("expansion"===r.substr(Ki,9).toLowerCase()?(i=r.substr(Ki,9),Ki+=9):(i=s,0===rc&&sc(nn)),i!==s?(Qi=t,t={type:"origin",value:"IN NATURAL LANGUAGE MODE WITH QUERY EXPANSION"}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,kb()!==s&&Up()!==s?("natural"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(rn)),e!==s&&Up()!==s?("language"===r.substr(Ki,8).toLowerCase()?(n=r.substr(Ki,8),Ki+=8):(n=s,0===rc&&sc(tn)),n!==s&&Up()!==s?("mode"===r.substr(Ki,4).toLowerCase()?(o=r.substr(Ki,4),Ki+=4):(o=s,0===rc&&sc(Ke)),o!==s?(Qi=t,t={type:"origin",value:"IN NATURAL LANGUAGE MODE"}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,kb()!==s&&Up()!==s?("boolean"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(on)),e!==s&&Up()!==s?("mode"===r.substr(Ki,4).toLowerCase()?(n=r.substr(Ki,4),Ki+=4):(n=s,0===rc&&sc(Ke)),n!==s?(Qi=t,t={type:"origin",value:"IN BOOLEAN MODE"}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,gb()!==s&&Up()!==s?("query"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(en)),e!==s&&Up()!==s?("expansion"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(nn)),n!==s?(Qi=t,t={type:"origin",value:"WITH QUERY EXPANSION"}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)))),t}())===s&&(a=null),a!==s&&Up()!==s&&Op()!==s&&Up()!==s?((i=al())===s&&(i=null),i!==s?(Qi=t,t=e={against:"against",columns:n,expr:u,match:"match",mode:a,type:"fulltext_search",as:i}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function ul(){var r,t,e,n,o,u,a,i;return r=Ki,(t=sl())!==s&&(Qi=r,t=function(r){const{as:t,...e}=r;return {expr:e,as:t}}(t)),(r=t)===s&&(r=Ki,(t=af())!==s&&(e=Up())!==s&&(n=gp())!==s&&(o=Up())!==s&&(u=af())!==s&&Up()!==s&&gp()!==s&&Up()!==s&&Sp()!==s?(Qi=r,a=t,i=u,Lv.add(`select::${a}::${i}::(.*)`),r=t={expr:{type:"column_ref",db:a,table:i,column:"*"},as:null,...av()}):(Ki=r,r=s),r===s&&(r=Ki,t=Ki,(e=af())!==s&&(n=Up())!==s&&(o=gp())!==s?t=e=[e,n,o]:(Ki=t,t=s),t===s&&(t=null),t!==s&&(e=Up())!==s&&(n=Sp())!==s?(Qi=r,r=t=function(r){const t=r&&r[0]||null;return Lv.add(`select::${t}::(.*)`),{expr:{type:"column_ref",table:t,column:"*"},as:null,...av()}}(t)):(Ki=r,r=s),r===s&&(r=Ki,(t=function(){var r,t,e,n;r=Ki,(t=Zp())===s&&(t=Jp());t!==s&&Up()!==s&&(e=vp())!==s&&Up()!==s&&(n=$p())!==s?(Qi=r,t=Gi(t,e,n),r=t):(Ki=r,r=s);return r}())!==s&&(e=Up())!==s?((n=al())===s&&(n=null),n!==s?(Qi=r,r=t={expr:t,as:n}):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Fl())!==s){for(e=[],n=Ki,(o=Up())!==s?((u=Gb())===s&&(u=Fb())===s&&(u=kp()),u!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s?((u=Gb())===s&&(u=Fb())===s&&(u=kp()),u!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);e!==s?(Qi=r,t=function(r,t){const e=r.ast;if(e&&"select"===e.type&&(!(r.parentheses_symbol||r.parentheses||r.ast.parentheses||r.ast.parentheses_symbol)||1!==e.columns.length||"*"===e.columns[0].expr.column))throw new Error("invalid column clause with select statement");if(!t||0===t.length)return r;const n=t.length;let o=t[n-1][3];for(let e=n-1;e>=0;e--){const n=0===e?r:t[e-1][3];o=cv(t[e][1],n,o);}return o}(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s&&(e=Up())!==s?((n=al())===s&&(n=null),n!==s?(Qi=r,r=t=function(r,t){return "double_quote_string"!==r.type&&"single_quote_string"!==r.type||Lv.add("select::null::"+r.value),{expr:r,as:t}}(t,n)):(Ki=r,r=s)):(Ki=r,r=s))))),r}function al(){var r,t,e;return r=Ki,(t=db())!==s&&Up()!==s&&(e=function(){var r,t;r=Ki,(t=wf())!==s?(Qi=Ki,(function(r){if(true===sv[r.toUpperCase()])throw new Error("Error: "+JSON.stringify(r)+" is a reserved word, can not as alias clause");return  false}(t)?s:void 0)!==s?(Qi=r,r=t=t):(Ki=r,r=s)):(Ki=r,r=s);r===s&&(r=Ki,(t=lf())!==s&&(Qi=r,t=t),r=t);return r}())!==s?(Qi=r,r=t=e):(Ki=r,r=s),r===s&&(r=Ki,(t=db())===s&&(t=null),t!==s&&Up()!==s&&(e=af())!==s?(Qi=r,r=t=e):(Ki=r,r=s)),r}function il(){var t,e,n;return t=Ki,bb()!==s&&Up()!==s&&(e=function(){var r,t,e,n,o,u,a,c;if(r=Ki,(t=Zp())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=Zp())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(c=Zp())!==s?n=o=[o,u,a,c]:(Ki=n,n=s);e!==s?(Qi=r,t=i(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=t,t={keyword:"var",type:"into",expr:e}):(Ki=t,t=s),t===s&&(t=Ki,bb()!==s&&Up()!==s?("outfile"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(an)),e===s&&("dumpfile"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(cn))),e===s&&(e=null),e!==s&&Up()!==s?((n=Ff())===s&&(n=af()),n!==s?(Qi=t,t={keyword:e,type:"into",expr:n}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)),t}function cl(){var r,t;return r=Ki,pb()!==s&&Up()!==s&&(t=vl())!==s?(Qi=r,r=t):(Ki=r,r=s),r}function ll(){var r,t,e;return r=Ki,(t=Ll())!==s&&Up()!==s&&Zf()!==s&&Up()!==s&&(e=Ll())!==s?(Qi=r,r=t=[t,e]):(Ki=r,r=s),r}function fl(){var t,e;return t=Ki,_b()!==s&&Up()!==s?("btree"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(ln)),e===s&&("hash"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(fn))),e!==s?(Qi=t,t={keyword:"using",type:e.toLowerCase()}):(Ki=t,t=s)):(Ki=t,t=s),t}function bl(){var r,t,e,n,o,u;if(r=Ki,(t=pl())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=pl())!==s?n=o=[o,u]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=pl())!==s?n=o=[o,u]:(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){const e=[r];for(let r=0;r<t.length;r++)e.push(t[r][1]);return e}(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function pl(){var t,e,n,o,u,a;return t=Ki,(e=function(){var t,e,n,o;t=Ki,"key_block_size"===r.substr(Ki,14).toLowerCase()?(e=r.substr(Ki,14),Ki+=14):(e=s,0===rc&&sc(dt));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="KEY_BLOCK_SIZE"):(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&Up()!==s?((n=dp())===s&&(n=null),n!==s&&Up()!==s&&(o=$f())!==s?(Qi=t,u=n,a=o,t=e={type:e.toLowerCase(),symbol:u,expr:a}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=fl())===s&&(t=Ki,"with"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(v)),e!==s&&Up()!==s?("parser"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(bn)),n!==s&&Up()!==s&&(o=wf())!==s?(Qi=t,t=e={type:"with parser",expr:o}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"visible"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(pn)),e===s&&("invisible"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(vn))),e!==s&&(Qi=t,e=function(r){return {type:r.toLowerCase(),expr:r.toLowerCase()}}(e)),(t=e)===s&&(t=Pp()))),t}function vl(){var r,t,e,n,o,u,a,i,c,l,f,b;if(r=Ki,(t=yl())!==s){for(e=[],n=dl();n!==s;)e.push(n),n=dl();e!==s?(Qi=r,f=t,(b=e).unshift(f),b.forEach(r=>{const{table:t,as:e}=r;Cv[t]=t,e&&(Cv[e]=t),dv(Lv);}),r=t=b):(Ki=r,r=s);}else Ki=r,r=s;if(r===s){if(r=Ki,t=[],(e=Np())!==s)for(;e!==s;)t.push(e),e=Np();else t=s;if(t!==s)if((e=Up())!==s)if((n=yl())!==s){for(o=[],u=dl();u!==s;)o.push(u),u=dl();if(o!==s)if((u=Up())!==s){if(a=[],(i=Op())!==s)for(;i!==s;)a.push(i),i=Op();else a=s;if(a!==s)if((i=Up())!==s){for(c=[],l=dl();l!==s;)c.push(l),l=dl();c!==s?(Qi=r,r=t=function(r,t,e,n,o){if(r.length!==n.length)throw new Error(`parentheses not match in from clause: ${r.length} != ${n.length}`);return e.unshift(t),e.forEach(r=>{const{table:t,as:e}=r;Cv[t]=t,e&&(Cv[e]=t),dv(Lv);}),o.forEach(r=>{const{table:t,as:e}=r;Cv[t]=t,e&&(Cv[e]=t),dv(Lv);}),{expr:e,parentheses:{length:n.length},joins:o}}(t,n,o,a,c)):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;}else Ki=r,r=s;else Ki=r,r=s;}else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;}return r}function dl(){var r,t,e;return r=Ki,Up()!==s&&(t=Ip())!==s&&Up()!==s&&(e=yl())!==s?(Qi=r,r=e):(Ki=r,r=s),r===s&&(r=Ki,Up()!==s&&(t=function(){var r,t,e,n,o,u,a,i,c,l,f;if(r=Ki,(t=wl())!==s)if(Up()!==s)if((e=yl())===s&&(e=vl()),e!==s)if(Up()!==s)if((n=_b())!==s)if(Up()!==s)if(Np()!==s)if(Up()!==s)if((o=sf())!==s){for(u=[],a=Ki,(i=Up())!==s&&(c=Ip())!==s&&(l=Up())!==s&&(f=sf())!==s?a=i=[i,c,l,f]:(Ki=a,a=s);a!==s;)u.push(a),a=Ki,(i=Up())!==s&&(c=Ip())!==s&&(l=Up())!==s&&(f=sf())!==s?a=i=[i,c,l,f]:(Ki=a,a=s);u!==s&&(a=Up())!==s&&(i=Op())!==s?(Qi=r,b=t,v=o,d=u,(p=e).join=b,p.using=fv(v,d),r=t=p):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;var b,p,v,d;r===s&&(r=Ki,(t=wl())!==s&&Up()!==s?((e=yl())===s&&(e=vl()),e!==s&&Up()!==s?((n=Cl())===s&&(n=null),n!==s?(Qi=r,t=function(r,t,e){return t.join=r,t.on=e,t}(t,e,n),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=wl())===s&&(t=fc()),t!==s&&Up()!==s&&(e=Np())!==s&&Up()!==s&&(n=bc())!==s&&Up()!==s&&Op()!==s&&Up()!==s?((o=al())===s&&(o=null),o!==s&&(u=Up())!==s?((a=Cl())===s&&(a=null),a!==s?(Qi=r,t=function(r,t,e,n){return t.parentheses=true,{expr:t,as:e,join:r,on:n}}(t,n,o,a),r=t):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)));return r}())!==s?(Qi=r,r=t):(Ki=r,r=s)),r}function yl(){var t,e,n,o,u,a,i;return t=Ki,(e=function(){var t;"dual"===r.substr(Ki,4).toLowerCase()?(t=r.substr(Ki,4),Ki+=4):(t=s,0===rc&&sc(li));return t}())!==s&&(Qi=t,e={type:"dual"}),(t=e)===s&&(t=Ki,(e=Ll())!==s&&Up()!==s?((n=al())===s&&(n=null),n!==s?(Qi=t,i=n,t=e="var"===(a=e).type?(a.as=i,a):{db:a.db,table:a.table,as:i,...av()}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Np())!==s&&Up()!==s&&(n=Ll())!==s&&Up()!==s?((o=al())===s&&(o=null),o!==s&&Up()!==s&&Op()!==s?(Qi=t,t=e=function(r,t,e){return "var"===r.type?(r.as=t,r.parentheses=true,r):{db:r.db,table:r.table,as:t,parentheses:true}}(n,o)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=jl())!==s&&Up()!==s?((n=al())===s&&(n=null),n!==s?(Qi=t,t=e=function(r,t){return {expr:{type:"values",values:r,prefix:"row"},as:t}}(e,n)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,"lateral"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(dn)),e===s&&(e=null),e!==s&&Up()!==s&&(n=Np())!==s&&Up()!==s?((o=bc())===s&&(o=jl()),o!==s&&Up()!==s&&Op()!==s&&Up()!==s?((u=al())===s&&(u=null),u!==s?(Qi=t,t=e=function(r,t,e){Array.isArray(t)&&(t={type:"values",values:t,prefix:"row"}),t.parentheses=true;const n={expr:t,as:e};return r&&(n.prefix=r),n}(e,o,u)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s))))),t}function wl(){var t,e,n,o;return t=Ki,(e=function(){var t,e,n,o;t=Ki,"left"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(mu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(n=Up())!==s?((o=Ab())===s&&(o=null),o!==s&&Up()!==s&&Eb()!==s?(Qi=t,t=e="LEFT JOIN"):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=function(){var t,e,n,o;t=Ki,"right"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Eu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(n=Up())!==s?((o=Ab())===s&&(o=null),o!==s&&Up()!==s&&Eb()!==s?(Qi=t,t=e="RIGHT JOIN"):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=function(){var t,e,n,o;t=Ki,"full"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Au));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(n=Up())!==s?((o=Ab())===s&&(o=null),o!==s&&Up()!==s&&Eb()!==s?(Qi=t,t=e="FULL JOIN"):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=function(){var t,e,n,o;t=Ki,"cross"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(_u));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(n=Up())!==s&&(o=Eb())!==s?(Qi=t,t=e="CROSS JOIN"):(Ki=t,t=s),t===s&&(t=Ki,e=Ki,(n=function(){var t,e,n,o;t=Ki,"inner"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Tu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(o=Up())!==s?e=n=[n,o]:(Ki=e,e=s),e===s&&(e=null),e!==s&&(n=Eb())!==s?(Qi=t,t=e="INNER JOIN"):(Ki=t,t=s))))),t}function Ll(){var t,e,n,o,u,a,i,c,l;if(t=Ki,e=[],yn.test(r.charAt(Ki))?(n=r.charAt(Ki),Ki++):(n=s,0===rc&&sc(wn)),n!==s)for(;n!==s;)e.push(n),yn.test(r.charAt(Ki))?(n=r.charAt(Ki),Ki++):(n=s,0===rc&&sc(wn));else e=s;return e!==s&&(n=uf())!==s?(o=Ki,(u=Up())!==s&&(a=gp())!==s&&(i=Up())!==s&&(c=uf())!==s?o=u=[u,a,i,c]:(Ki=o,o=s),o===s&&(o=null),o!==s?(Qi=t,t=e=function(r,t,e){const n=`${r.join("")}${t}`,o={db:null,table:n};return null!==e&&(o.db=n,o.table=e[3]),o}(e,n,o)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=af())!==s?(n=Ki,(o=Up())!==s&&(u=gp())!==s&&(a=Up())!==s&&(i=uf())!==s?n=o=[o,u,a,i]:(Ki=n,n=s),n===s&&(n=null),n!==s?(Qi=t,t=e=function(r,t){const e={db:null,table:r};return null!==t&&(e.db=r,e.table=t[3]),e}(e,n)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Zp())!==s&&(Qi=t,(l=e).db=null,l.table=l.name,e=l),t=e)),t}function Cl(){var r,t;return r=Ki,mb()!==s&&Up()!==s&&(t=Hl())!==s?(Qi=r,r=t):(Ki=r,r=s),r}function hl(){var t,e;return t=Ki,function(){var t,e,n,o;t=Ki,"where"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(ku));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s&&(e=Yl())!==s?(Qi=t,t=e):(Ki=t,t=s),t}function ml(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=ef())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ef())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=ef())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=sr(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function El(){var r,t;return r=Ki,fb()!==s&&Up()!==s&&Sb()!==s&&Up()!==s&&(t=ol())!==s?(Qi=r,r=t):(Ki=r,r=s),r}function Al(){var t,e;return t=Ki,function(){var t,e,n,o;t=Ki,"order"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Mu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s&&Sb()!==s&&Up()!==s&&(e=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Tl())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Tl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Tl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=sr(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=t,t=e):(Ki=t,t=s),t}function Tl(){var r,t,e;return r=Ki,(t=Fl())!==s&&Up()!==s?((e=Ob())===s&&(e=Nb()),e===s&&(e=null),e!==s?(Qi=r,r=t={expr:t,type:e}):(Ki=r,r=s)):(Ki=r,r=s),r}function _l(){var t,e;return (t=$f())===s&&(t=mf())===s&&(t=Ki,63===r.charCodeAt(Ki)?(e="?",Ki++):(e=s,0===rc&&sc(Cn)),e!==s&&(Qi=t,e={type:"origin",value:"?"}),t=e),t}function gl(){var t,e,n,o,u,a;return t=Ki,function(){var t,e,n,o;t=Ki,"limit"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Gu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s&&(e=_l())!==s&&Up()!==s?(n=Ki,(o=Ip())===s&&(o=function(){var t,e,n,o;t=Ki,"offset"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Fu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="OFFSET"):(Ki=t,t=s)):(Ki=t,t=s);return t}()),o!==s&&(u=Up())!==s&&(a=_l())!==s?n=o=[o,u,a]:(Ki=n,n=s),n===s&&(n=null),n!==s?(Qi=t,t=function(r,t){const e=[r];return t&&e.push(t[2]),{seperator:t&&t[0]&&t[0].toLowerCase()||"",value:e,...av()}}(e,n)):(Ki=t,t=s)):(Ki=t,t=s),t}function Il(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Sl())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Sl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Sl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=sr(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Sl(){var t,e,n,o,u,a,i,c,l;return t=Ki,e=Ki,(n=af())!==s&&(o=Up())!==s&&(u=gp())!==s?e=n=[n,o,u]:(Ki=e,e=s),e===s&&(e=null),e!==s&&(n=Up())!==s&&(o=vf())!==s&&(u=Up())!==s?(61===r.charCodeAt(Ki)?(a="=",Ki++):(a=s,0===rc&&sc(hn)),a!==s&&Up()!==s&&(i=Fl())!==s?(Qi=t,t=e={column:o,value:i,table:(l=e)&&l[0]}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,e=Ki,(n=af())!==s&&(o=Up())!==s&&(u=gp())!==s?e=n=[n,o,u]:(Ki=e,e=s),e===s&&(e=null),e!==s&&(n=Up())!==s&&(o=vf())!==s&&(u=Up())!==s?(61===r.charCodeAt(Ki)?(a="=",Ki++):(a=s,0===rc&&sc(hn)),a!==s&&Up()!==s&&(i=Tb())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(c=ef())!==s&&Up()!==s&&Op()!==s?(Qi=t,t=e=function(r,t,e){return {column:t,value:e,table:r&&r[0],keyword:"values"}}(e,o,c)):(Ki=t,t=s)):(Ki=t,t=s)),t}function Nl(){var r,t;return (r=jl())===s&&(r=Ki,(t=bc())!==s&&(Qi=r,t=t.ast),r=t),r}function Ol(){var r,t,e,n,o,u,a,i,c;if(r=Ki,fb()!==s)if(Up()!==s)if((t=Np())!==s)if(Up()!==s)if((e=wf())!==s){for(n=[],o=Ki,(u=Up())!==s&&(a=Ip())!==s&&(i=Up())!==s&&(c=wf())!==s?o=u=[u,a,i,c]:(Ki=o,o=s);o!==s;)n.push(o),o=Ki,(u=Up())!==s&&(a=Ip())!==s&&(i=Up())!==s&&(c=wf())!==s?o=u=[u,a,i,c]:(Ki=o,o=s);n!==s&&(o=Up())!==s&&(u=Op())!==s?(Qi=r,r=C(e,n)):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;else Ki=r,r=s;return r===s&&(r=Ki,fb()!==s&&Up()!==s&&(t=kl())!==s?(Qi=r,r=t):(Ki=r,r=s)),r}function Rl(){var t,e,n;return t=Ki,mb()!==s&&Up()!==s?("duplicate"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(mn)),e!==s&&Up()!==s&&Cp()!==s&&Up()!==s&&nb()!==s&&Up()!==s&&(n=Il())!==s?(Qi=t,t={keyword:"on duplicate key update",set:n}):(Ki=t,t=s)):(Ki=t,t=s),t}function xl(){var r,t;return r=Ki,(t=ab())!==s&&(Qi=r,t="insert"),(r=t)===s&&(r=Ki,(t=ib())!==s&&(Qi=r,t="replace"),r=t),r}function jl(){var r,t;return r=Ki,Tb()!==s&&Up()!==s&&(t=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=kl())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=kl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=kl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=sr(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())!==s?(Qi=r,r={type:"values",values:t}):(Ki=r,r=s),r}function kl(){var t,e,n,o,u;return t=Ki,"row"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(yr)),e===s&&(e=null),e!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(n=Ul())!==s&&Up()!==s&&Op()!==s?(Qi=t,o=e,(u=n).prefix=o&&o.toLowerCase(),t=e=u):(Ki=t,t=s),t}function Ul(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Fl())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){const e={type:"expr_list"};return e.value=fv(r,t),e}(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Dl(){var t,e,n;return t=Ki,ip()!==s&&Up()!==s&&(e=Fl())!==s&&Up()!==s&&(n=function(){var t;(t=function(){var t,e,n,o;t=Ki,"year"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ns));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="YEAR"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"quarter"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Zo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="QUARTER"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"month"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(zo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MONTH"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"week"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(es));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="WEEK"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"day"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Mo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DAY"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"hour"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Bo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="HOUR"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"minute"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Qo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MINUTE"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"second"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Jo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"microsecond"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(Ya));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MICROSECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"second_microsecond"===r.substr(Ki,18).toLowerCase()?(e=r.substr(Ki,18),Ki+=18):(e=s,0===rc&&sc(jo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SECOND_MICROSECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"minute_microsecond"===r.substr(Ki,18).toLowerCase()?(e=r.substr(Ki,18),Ki+=18):(e=s,0===rc&&sc(xo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MINUTE_MICROSECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"minute_second"===r.substr(Ki,13).toLowerCase()?(e=r.substr(Ki,13),Ki+=13):(e=s,0===rc&&sc(Ro));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MINUTE_SECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"hour_microsecond"===r.substr(Ki,16).toLowerCase()?(e=r.substr(Ki,16),Ki+=16):(e=s,0===rc&&sc(Oo));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="HOUR_MICROSECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"hour_second"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(No));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="HOUR_SECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"hour_minute"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(So));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="HOUR_MINUTE"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"day_microsecond"===r.substr(Ki,15).toLowerCase()?(e=r.substr(Ki,15),Ki+=15):(e=s,0===rc&&sc(Io));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DAY_MICROSECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"day_second"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(go));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DAY_SECOND"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"day_minute"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(_o));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DAY_MINUTE"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"day_hour"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(To));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DAY_HOUR"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"year_month"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Ao));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="YEAR_MONTH"):(Ki=t,t=s)):(Ki=t,t=s);return t}());return t}())!==s?(Qi=t,t={type:"interval",expr:e,unit:n.toLowerCase()}):(Ki=t,t=s),t}function Ml(){var r,t,e,n,o,u;if(r=Ki,(t=Pl())!==s)if(Up()!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Pl())!==s?n=o=[o,u]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Pl())!==s?n=o=[o,u]:(Ki=n,n=s);e!==s?(Qi=r,r=t=l(t,e)):(Ki=r,r=s);}else Ki=r,r=s;else Ki=r,r=s;return r}function Pl(){var t,e,n;return t=Ki,function(){var t,e,n,o;t=Ki,"when"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ca));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s&&(e=Yl())!==s&&Up()!==s&&function(){var t,e,n,o;t=Ki,"then"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(la));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s&&(n=Fl())!==s?(Qi=t,t={type:"when",cond:e,result:n}):(Ki=t,t=s),t}function Gl(){var t,e;return t=Ki,function(){var t,e,n,o;t=Ki,"else"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(fa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}()!==s&&Up()!==s&&(e=Fl())!==s?(Qi=t,t={type:"else",result:e}):(Ki=t,t=s),t}function Fl(){var r;return (r=function(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Bl())!==s){for(e=[],n=Ki,(o=Dp())!==s&&(u=Fb())!==s&&(a=Up())!==s&&(i=Bl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Dp())!==s&&(u=Fb())!==s&&(a=Up())!==s&&(i=Bl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,t=En(t,e),r=t):(Ki=r,r=s);}else Ki=r,r=s;return r}())===s&&(r=bc()),r}function Hl(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Fl())!==s){for(e=[],n=Ki,(o=Up())!==s?((u=Gb())===s&&(u=Fb()),u!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s?((u=Gb())===s&&(u=Fb()),u!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){const e=t.length;let n=r;for(let r=0;r<e;++r)n=cv(t[r][1],n,t[r][3]);return n}(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Yl(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Fl())!==s){for(e=[],n=Ki,(o=Up())!==s?((u=Gb())===s&&(u=Fb())===s&&(u=Ip())===s&&(u=kp()),u!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s?((u=Gb())===s&&(u=Fb())===s&&(u=Ip())===s&&(u=kp()),u!==s&&(a=Up())!==s&&(i=Fl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){const e=t.length;let n=r,o="";for(let r=0;r<e;++r)","===t[r][1]?(o=",",Array.isArray(n)||(n=[n]),n.push(t[r][3])):n=cv(t[r][1],n,t[r][3]);if(","===o){const r={type:"expr_list"};return r.value=Array.isArray(n)?n:[n],r}return n}(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Bl(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=$l())!==s){for(e=[],n=Ki,(o=Dp())!==s&&(u=Gb())!==s&&(a=Up())!==s&&(i=$l())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Dp())!==s&&(u=Gb())!==s&&(a=Up())!==s&&(i=$l())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=bv(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function $l(){var r,t;return (r=Wl())===s&&(r=function(){var r,t,e;r=Ki,(t=function(){var r,t,e,n,o;r=Ki,t=Ki,(e=Pb())!==s&&(n=Up())!==s&&(o=Mb())!==s?t=e=[e,n,o]:(Ki=t,t=s);t!==s&&(Qi=r,t=An(t));(r=t)===s&&(r=Mb());return r}())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(e=bc())!==s&&Up()!==s&&Op()!==s?(Qi=r,n=t,(o=e).parentheses=true,t=iv(n,o),r=t):(Ki=r,r=s);var n,o;return r}())===s&&(r=Ki,Pb()!==s&&Up()!==s&&(t=$l())!==s?(Qi=r,r=iv("NOT",t)):(Ki=r,r=s)),r}function Wl(){var t,e,n;return t=Ki,(e=Ql())!==s&&Up()!==s?((n=function(){var t;(t=function(){var r,t,e,n,o,u,a;r=Ki,t=[],e=Ki,(n=Up())!==s&&(o=ql())!==s&&(u=Up())!==s&&(a=Ql())!==s?e=n=[n,o,u,a]:(Ki=e,e=s);if(e!==s)for(;e!==s;)t.push(e),e=Ki,(n=Up())!==s&&(o=ql())!==s&&(u=Up())!==s&&(a=Ql())!==s?e=n=[n,o,u,a]:(Ki=e,e=s);else t=s;t!==s&&(e=Up())!==s?((n=Kl())===s&&(n=null),n!==s?(Qi=r,r=t={type:"arithmetic",tail:t,in:n}):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(t=Kl())===s&&(t=function(){var r,t,e,n;r=Ki,(t=function(){var r,t,e,n,o;r=Ki,t=Ki,(e=Pb())!==s&&(n=Up())!==s&&(o=jb())!==s?t=e=[e,n,o]:(Ki=t,t=s);t!==s&&(Qi=r,t=An(t));(r=t)===s&&(r=jb());return r}())!==s&&Up()!==s&&(e=Ql())!==s&&Up()!==s&&Gb()!==s&&Up()!==s&&(n=Ql())!==s?(Qi=r,r=t={op:t,right:{type:"expr_list",value:[e,n]}}):(Ki=r,r=s);return r}())===s&&(t=function(){var r,t,e,n,o;r=Ki,(t=Ub())!==s&&(e=Up())!==s&&(n=Ql())!==s?(Qi=r,r=t={op:"IS",right:n}):(Ki=r,r=s);r===s&&(r=Ki,t=Ki,(e=Ub())!==s&&(n=Up())!==s&&(o=Pb())!==s?t=e=[e,n,o]:(Ki=t,t=s),t!==s&&(e=Up())!==s&&(n=Ql())!==s?(Qi=r,t=function(r){return {op:"IS NOT",right:r}}(n),r=t):(Ki=r,r=s));return r}())===s&&(t=Xl())===s&&(t=function(){var t,e,n,o;t=Ki,(e=function(){var t,e,n;t=Ki,(e=Pb())===s&&(e=null);e!==s&&Up()!==s?((n=function(){var t,e,n,o;t=Ki,"regexp"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Qu));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="REGEXP"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(n=function(){var t,e,n,o;t=Ki,"rlike"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Ku));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="RLIKE"):(Ki=t,t=s)):(Ki=t,t=s);return t}()),n!==s?(Qi=t,u=n,t=e=(o=e)?`${o} ${u}`:u):(Ki=t,t=s)):(Ki=t,t=s);var o,u;return t}())!==s&&Up()!==s?("binary"===r.substr(Ki,6).toLowerCase()?(n=r.substr(Ki,6),Ki+=6):(n=s,0===rc&&sc(Bt)),n===s&&(n=null),n!==s&&Up()!==s?((o=kf())===s&&(o=Ff())===s&&(o=ef()),o!==s?(Qi=t,u=e,t=e={op:(a=n)?`${u} ${a}`:u,right:o}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s);var u,a;return t}());return t}())===s&&(n=null),n!==s?(Qi=t,t=e=function(r,t){if(null===t)return r;if("arithmetic"===t.type){if(!t.in)return bv(r,t.tail);const e=bv(r,t.tail);return cv(t.in.op,e,t.in.right)}return cv(t.op,r,t.right)}(e,n)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ff())===s&&(t=ef()),t}function ql(){var t;return ">="===r.substr(Ki,2)?(t=">=",Ki+=2):(t=s,0===rc&&sc(Tn)),t===s&&(62===r.charCodeAt(Ki)?(t=">",Ki++):(t=s,0===rc&&sc(_n)),t===s&&("<="===r.substr(Ki,2)?(t="<=",Ki+=2):(t=s,0===rc&&sc(gn)),t===s&&("<>"===r.substr(Ki,2)?(t="<>",Ki+=2):(t=s,0===rc&&sc(In)),t===s&&(60===r.charCodeAt(Ki)?(t="<",Ki++):(t=s,0===rc&&sc(Sn)),t===s&&(61===r.charCodeAt(Ki)?(t="=",Ki++):(t=s,0===rc&&sc(hn)),t===s&&("!="===r.substr(Ki,2)?(t="!=",Ki+=2):(t=s,0===rc&&sc(Nn)))))))),t}function Vl(){var r,t,e,n,o;return r=Ki,t=Ki,(e=Pb())!==s&&(n=Up())!==s&&(o=kb())!==s?t=e=[e,n,o]:(Ki=t,t=s),t!==s&&(Qi=r,t=An(t)),(r=t)===s&&(r=kb()),r}function Xl(){var t,e,n,o,u,a,i;return t=Ki,(e=function(){var r,t,e,n,o;return r=Ki,t=Ki,(e=Pb())!==s&&(n=Up())!==s&&(o=Db())!==s?t=e=[e,n,o]:(Ki=t,t=s),t!==s&&(Qi=r,t=An(t)),(r=t)===s&&(r=Db()),r}())!==s&&Up()!==s?((n=Pf())===s&&(n=mf())===s&&(n=Wl()),n!==s&&Up()!==s?((o=function(){var t,e,n;return t=Ki,"escape"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(On)),e!==s&&Up()!==s&&(n=Ff())!==s?(Qi=t,t=e={type:"ESCAPE",value:n}):(Ki=t,t=s),t}())===s&&(o=null),o!==s?(Qi=t,u=e,a=n,(i=o)&&(a.escape=i),t=e={op:u,right:a}):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t}function Kl(){var r,t,e,n;return r=Ki,(t=Vl())!==s&&Up()!==s&&(e=Np())!==s&&Up()!==s&&(n=Ul())!==s&&Up()!==s&&Op()!==s?(Qi=r,r=t={op:t,right:n}):(Ki=r,r=s),r===s&&(r=Ki,(t=Vl())!==s&&Up()!==s?((e=Zp())===s&&(e=ef())===s&&(e=Ff()),e!==s?(Qi=r,r=t=function(r,t){return {op:r,right:t}}(t,e)):(Ki=r,r=s)):(Ki=r,r=s)),r}function Ql(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Zl())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=zl())!==s&&(a=Up())!==s&&(i=Zl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=zl())!==s&&(a=Up())!==s&&(i=Zl())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=function(r,t){if(t&&t.length&&"column_ref"===r.type&&"*"===r.column)throw new Error(JSON.stringify({message:"args could not be star column in additive expr",...av()}));return bv(r,t)}(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function zl(){var t;return 43===r.charCodeAt(Ki)?(t="+",Ki++):(t=s,0===rc&&sc(Rn)),t===s&&(45===r.charCodeAt(Ki)?(t="-",Ki++):(t=s,0===rc&&sc(xn))),t}function Zl(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=rf())!==s){for(e=[],n=Ki,(o=Up())!==s?((u=Jl())===s&&(u=kp()),u!==s&&(a=Up())!==s&&(i=rf())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s?((u=Jl())===s&&(u=kp()),u!==s&&(a=Up())!==s&&(i=rf())!==s?n=o=[o,u,a,i]:(Ki=n,n=s)):(Ki=n,n=s);e!==s?(Qi=r,r=t=bv(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Jl(){var t,e;return 42===r.charCodeAt(Ki)?(t="*",Ki++):(t=s,0===rc&&sc(jn)),t===s&&(47===r.charCodeAt(Ki)?(t="/",Ki++):(t=s,0===rc&&sc(kn)),t===s&&(37===r.charCodeAt(Ki)?(t="%",Ki++):(t=s,0===rc&&sc(Un)),t===s&&("||"===r.substr(Ki,2)?(t="||",Ki+=2):(t=s,0===rc&&sc(Dn)),t===s&&(t=Ki,"div"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Mn)),e===s&&("mod"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Pn))),e!==s&&(Qi=t,e=e.toUpperCase()),(t=e)===s&&(38===r.charCodeAt(Ki)?(t="&",Ki++):(t=s,0===rc&&sc(Gn)),t===s&&(">>"===r.substr(Ki,2)?(t=">>",Ki+=2):(t=s,0===rc&&sc(Fn)),t===s&&("<<"===r.substr(Ki,2)?(t="<<",Ki+=2):(t=s,0===rc&&sc(Hn)),t===s&&(94===r.charCodeAt(Ki)?(t="^",Ki++):(t=s,0===rc&&sc(Yn)),t===s&&(124===r.charCodeAt(Ki)?(t="|",Ki++):(t=s,0===rc&&sc(Bn))))))))))),t}function rf(){var t,e,n,o,u;return (t=function(){var t,e,n,o,u,a,i,c;if(t=Ki,(e=tf())!==s)if(Up()!==s){for(n=[],o=Ki,(u=Up())!==s?("?|"===r.substr(Ki,2)?(a="?|",Ki+=2):(a=s,0===rc&&sc(qn)),a===s&&("?&"===r.substr(Ki,2)?(a="?&",Ki+=2):(a=s,0===rc&&sc(Vn)),a===s&&(63===r.charCodeAt(Ki)?(a="?",Ki++):(a=s,0===rc&&sc(Cn)),a===s&&("#-"===r.substr(Ki,2)?(a="#-",Ki+=2):(a=s,0===rc&&sc(Xn)),a===s&&("#>>"===r.substr(Ki,3)?(a="#>>",Ki+=3):(a=s,0===rc&&sc(Kn)),a===s&&("#>"===r.substr(Ki,2)?(a="#>",Ki+=2):(a=s,0===rc&&sc(Qn)),a===s&&(a=jp())===s&&(a=xp())===s&&("@>"===r.substr(Ki,2)?(a="@>",Ki+=2):(a=s,0===rc&&sc(zn)),a===s&&("<@"===r.substr(Ki,2)?(a="<@",Ki+=2):(a=s,0===rc&&sc(Zn))))))))),a!==s&&(i=Up())!==s&&(c=tf())!==s?o=u=[u,a,i,c]:(Ki=o,o=s)):(Ki=o,o=s);o!==s;)n.push(o),o=Ki,(u=Up())!==s?("?|"===r.substr(Ki,2)?(a="?|",Ki+=2):(a=s,0===rc&&sc(qn)),a===s&&("?&"===r.substr(Ki,2)?(a="?&",Ki+=2):(a=s,0===rc&&sc(Vn)),a===s&&(63===r.charCodeAt(Ki)?(a="?",Ki++):(a=s,0===rc&&sc(Cn)),a===s&&("#-"===r.substr(Ki,2)?(a="#-",Ki+=2):(a=s,0===rc&&sc(Xn)),a===s&&("#>>"===r.substr(Ki,3)?(a="#>>",Ki+=3):(a=s,0===rc&&sc(Kn)),a===s&&("#>"===r.substr(Ki,2)?(a="#>",Ki+=2):(a=s,0===rc&&sc(Qn)),a===s&&(a=jp())===s&&(a=xp())===s&&("@>"===r.substr(Ki,2)?(a="@>",Ki+=2):(a=s,0===rc&&sc(zn)),a===s&&("<@"===r.substr(Ki,2)?(a="<@",Ki+=2):(a=s,0===rc&&sc(Zn))))))))),a!==s&&(i=Up())!==s&&(c=tf())!==s?o=u=[u,a,i,c]:(Ki=o,o=s)):(Ki=o,o=s);n!==s?(Qi=t,l=e,e=(f=n)&&0!==f.length?bv(l,f):l,t=e):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;var l,f;return t}())===s&&(t=Ki,(e=function(){var t;33===r.charCodeAt(Ki)?(t="!",Ki++):(t=s,0===rc&&sc($n));t===s&&(45===r.charCodeAt(Ki)?(t="-",Ki++):(t=s,0===rc&&sc(xn)),t===s&&(43===r.charCodeAt(Ki)?(t="+",Ki++):(t=s,0===rc&&sc(Rn)),t===s&&(126===r.charCodeAt(Ki)?(t="~",Ki++):(t=s,0===rc&&sc(Wn)))));return t}())!==s?(n=Ki,(o=Up())!==s&&(u=rf())!==s?n=o=[o,u]:(Ki=n,n=s),n!==s?(Qi=t,t=e=iv(e,n[1])):(Ki=t,t=s)):(Ki=t,t=s)),t}function tf(){var t,e,n,o;return (t=Dl())===s&&(t=function(){var t;(t=function(){var t,e,n,o;t=Ki,(e=function(){var t,e,n,o;t=Ki,"count"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(ra));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="COUNT"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(e=function(){var t,e,n,o;t=Ki,"group_concat"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(ta));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="GROUP_CONCAT"):(Ki=t,t=s)):(Ki=t,t=s);return t}());e!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(n=function(){var t,e,n,o,u;t=Ki,(e=function(){var t,e;t=Ki,42===r.charCodeAt(Ki)?(e="*",Ki++):(e=s,0===rc&&sc(jn));e!==s&&(Qi=t,e={type:"star",value:"*"});return t=e}())!==s&&(Qi=t,e={expr:e,...av()});(t=e)===s&&(t=Ki,(e=xb())===s&&(e=null),e!==s&&Up()!==s&&(n=Yl())!==s&&Up()!==s?((o=Al())===s&&(o=null),o!==s&&Up()!==s?((u=function(){var t,e,n;t=Ki,"separator"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(Eo));e===s&&(e=null);e!==s&&Up()!==s&&(n=Ff())!==s?(Qi=t,t=e={keyword:e,value:n}):(Ki=t,t=s);return t}())===s&&(u=null),u!==s?(Qi=t,e={distinct:e,expr:n,orderby:o,separator:u,...av()},t=e):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s));return t}())!==s&&Up()!==s&&Op()!==s&&Up()!==s?((o=Af())===s&&(o=null),o!==s?(Qi=t,e={type:"aggr_func",name:e,args:n,over:o,...av()},t=e):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,(e=function(){var t;(t=function(){var t,e,n,o;t=Ki,"sum"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(oa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SUM"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"max"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(ea));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MAX"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"min"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(na));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MIN"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"avg"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(sa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="AVG"):(Ki=t,t=s)):(Ki=t,t=s);return t}());return t}())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(n=Hl())!==s&&Up()!==s&&Op()!==s&&Up()!==s?((o=Af())===s&&(o=null),o!==s?(Qi=t,e={type:"aggr_func",name:e,args:{expr:n},over:o,...av()},t=e):(Ki=t,t=s)):(Ki=t,t=s);return t}());return t}())===s&&(t=sl())===s&&(t=kf())===s&&(t=function(){var r,t,e,n,o,u,a;r=Ki,(t=$b())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(e=Fl())!==s&&Up()!==s&&db()!==s&&Up()!==s&&(n=ev())!==s&&Up()!==s&&(o=Mc())!==s&&Up()!==s&&(u=sf())!==s&&Up()!==s&&Op()!==s?(Qi=r,t=function(r,t,e,n,o){const{dataType:s,length:u}=e;let a=s;return void 0!==u&&(a=`${a}(${u})`),{type:"cast",keyword:r.toLowerCase(),expr:t,symbol:"as",target:[{dataType:a,suffix:[{type:"origin",value:n},o]}]}}(t,e,n,o,u),r=t):(Ki=r,r=s);r===s&&(r=Ki,(t=$b())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(e=Fl())!==s&&Up()!==s&&db()!==s&&Up()!==s&&(n=rv())!==s&&Up()!==s&&(o=Op())!==s?(Qi=r,i=e,c=n,t={type:"cast",keyword:t.toLowerCase(),expr:i,symbol:"as",target:[c]},r=t):(Ki=r,r=s),r===s&&(r=Ki,(t=$b())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(e=Fl())!==s&&Up()!==s&&db()!==s&&Up()!==s&&(n=Vb())!==s&&Up()!==s&&(o=Np())!==s&&Up()!==s&&(u=Wf())!==s&&Up()!==s&&Op()!==s&&Up()!==s&&(a=Op())!==s?(Qi=r,t=function(r,t,e){return {type:"cast",keyword:r.toLowerCase(),expr:t,symbol:"as",target:[{dataType:"DECIMAL("+e+")"}]}}(t,e,u),r=t):(Ki=r,r=s),r===s&&(r=Ki,(t=$b())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(e=Fl())!==s&&Up()!==s&&db()!==s&&Up()!==s&&(n=Vb())!==s&&Up()!==s&&(o=Np())!==s&&Up()!==s&&(u=Wf())!==s&&Up()!==s&&Ip()!==s&&Up()!==s&&(a=Wf())!==s&&Up()!==s&&Op()!==s&&Up()!==s&&Op()!==s?(Qi=r,t=function(r,t,e,n){return {type:"cast",keyword:r.toLowerCase(),expr:t,symbol:"as",target:[{dataType:"DECIMAL("+e+", "+n+")"}]}}(t,e,u,a),r=t):(Ki=r,r=s),r===s&&(r=Ki,(t=$b())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(e=Fl())!==s&&Up()!==s&&db()!==s&&Up()!==s&&(n=Df())!==s&&Up()!==s?((o=Kb())===s&&(o=null),o!==s&&Up()!==s&&(u=Op())!==s?(Qi=r,t=function(r,t,e,n){return {type:"cast",keyword:r.toLowerCase(),expr:t,symbol:"as",target:[{dataType:[e,n].filter(Boolean).join(" ")}]}}(t,e,n,o),r=t):(Ki=r,r=s)):(Ki=r,r=s)))));var i,c;return r}())===s&&(t=function(){var r,t,e,n,o,u,a,i;return r=Ki,Yb()!==s&&Up()!==s&&(t=Ml())!==s&&Up()!==s?((e=Gl())===s&&(e=null),e!==s&&Up()!==s&&(n=Bb())!==s&&Up()!==s?((o=Yb())===s&&(o=null),o!==s?(Qi=r,a=t,(i=e)&&a.push(i),r={type:"case",expr:null,args:a}):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,Yb()!==s&&Up()!==s&&(t=Fl())!==s&&Up()!==s&&(e=Ml())!==s&&Up()!==s?((n=Gl())===s&&(n=null),n!==s&&Up()!==s&&(o=Bb())!==s&&Up()!==s?((u=Yb())===s&&(u=null),u!==s?(Qi=r,r=function(r,t,e){return e&&t.push(e),{type:"case",expr:r,args:t}}(t,e,n)):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s)),r}())===s&&(t=Mf())===s&&(t=ef())===s&&(t=$f())===s&&(t=mf())===s&&(t=Ki,Np()!==s&&(e=Up())!==s&&(n=Yl())!==s&&Up()!==s&&Op()!==s?(Qi=t,(o=n).parentheses=true,t=o):(Ki=t,t=s),t===s&&(t=Zp())===s&&(t=Ki,Up()!==s?(63===r.charCodeAt(Ki)?(e="?",Ki++):(e=s,0===rc&&sc(Cn)),e!==s?(Qi=t,t={type:"origin",value:e}):(Ki=t,t=s)):(Ki=t,t=s))),t}function ef(){var r,t,e,n,o,u,a,i,c,l,f,b,p,v,d,y,w;return r=Ki,(t=wf())===s&&(t=pf()),t!==s&&(e=Up())!==s&&(n=gp())!==s&&(o=Up())!==s?((u=wf())===s&&(u=pf()),u!==s&&(a=Up())!==s&&(i=gp())!==s&&(c=Up())!==s&&(l=vf())!==s?(f=Ki,(b=Up())!==s&&(p=Ac())!==s?f=b=[b,p]:(Ki=f,f=s),f===s&&(f=null),f!==s?(Qi=r,v=t,d=u,y=l,w=f,Lv.add(`select::${"object"==typeof v?v.value:v}::${"object"==typeof d?d.value:d}::${y}`),r=t={type:"column_ref",db:v,table:d,column:y,collate:w&&w[1],...av()}):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=wf())===s&&(t=pf()),t!==s&&(e=Up())!==s&&(n=gp())!==s&&(o=Up())!==s&&(u=vf())!==s?(a=Ki,(i=Up())!==s&&(c=Ac())!==s?a=i=[i,c]:(Ki=a,a=s),a===s&&(a=null),a!==s?(Qi=r,r=t=function(r,t,e){return Lv.add(`select::${"object"==typeof r?r.value:r}::${t}`),{type:"column_ref",table:r,column:t,collate:e&&e[1],...av()}}(t,u,a)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,t=Ki,(e=af())!==s&&(n=Up())!==s&&(o=gp())!==s?t=e=[e,n,o]:(Ki=t,t=s),t===s&&(t=null),t!==s&&(e=Up())!==s&&(n=Sp())!==s?(Qi=r,r=t=function(r){const t=r&&r[0]||null;return Lv.add(`select::${t}::(.*)`),{expr:{type:"column_ref",table:t,column:"*"},as:null,...av()}}(t)):(Ki=r,r=s),r===s&&(r=Ki,(t=df())!==s?(e=Ki,(n=Up())!==s&&(o=Ac())!==s?e=n=[n,o]:(Ki=e,e=s),e===s&&(e=null),e!==s?(Qi=r,r=t=function(r,t){return Lv.add("select::null::"+r),{type:"column_ref",table:null,column:r,collate:t&&t[1],...av()}}(t,e)):(Ki=r,r=s)):(Ki=r,r=s)))),r}function nf(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=df())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=df())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=df())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=sr(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function of(){var r,t;return r=Ki,(t=wf())!==s&&(Qi=r,t={type:"default",value:t}),r=t}function sf(){var r;return (r=of())===s&&(r=cf()),r}function uf(){var r;return (r=wf())===s&&(r=lf()),r}function af(){var r,t;return r=Ki,(t=wf())!==s?(Qi=Ki,(Jn(t)?s:void 0)!==s?(Qi=r,r=t=t):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=lf()),r}function cf(){var r;return (r=ff())===s&&(r=bf())===s&&(r=pf()),r}function lf(){var r,t;return r=Ki,(t=ff())===s&&(t=bf())===s&&(t=pf()),t!==s&&(Qi=r,t=t.value),r=t}function ff(){var t,e,n,o;if(t=Ki,34===r.charCodeAt(Ki)?(e='"',Ki++):(e=s,0===rc&&sc(ro)),e!==s){if(n=[],to.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(eo)),o!==s)for(;o!==s;)n.push(o),to.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(eo));else n=s;n!==s?(34===r.charCodeAt(Ki)?(o='"',Ki++):(o=s,0===rc&&sc(ro)),o!==s?(Qi=t,t=e={type:"double_quote_string",value:n.join("")}):(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;return t}function bf(){var t,e,n,o;if(t=Ki,39===r.charCodeAt(Ki)?(e="'",Ki++):(e=s,0===rc&&sc(Ot)),e!==s){for(n=[],no.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(oo));o!==s;)n.push(o),no.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(oo));n!==s?(39===r.charCodeAt(Ki)?(o="'",Ki++):(o=s,0===rc&&sc(Ot)),o!==s?(Qi=t,t=e={type:"single_quote_string",value:n.join("")}):(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;return t}function pf(){var t,e,n,o;if(t=Ki,96===r.charCodeAt(Ki)?(e="`",Ki++):(e=s,0===rc&&sc(so)),e!==s){if(n=[],uo.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(ao)),o===s&&(o=Bf()),o!==s)for(;o!==s;)n.push(o),uo.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(ao)),o===s&&(o=Bf());else n=s;n!==s?(96===r.charCodeAt(Ki)?(o="`",Ki++):(o=s,0===rc&&sc(so)),o!==s?(Qi=t,t=e={type:"backticks_quote_string",value:n.join("")}):(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;return t}function vf(){var r,t;return r=Ki,(t=yf())!==s&&(Qi=r,t=t),(r=t)===s&&(r=lf()),r}function df(){var r,t;return r=Ki,(t=yf())!==s?(Qi=Ki,(Jn(t)?s:void 0)!==s?(Qi=r,r=t=t):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=pf())!==s&&(Qi=r,t=t.value),r=t),r}function yf(){var r,t,e,n;if(r=Ki,(t=Lf())!==s){for(e=[],n=hf();n!==s;)e.push(n),n=hf();e!==s?(Qi=r,r=t=io(t,e)):(Ki=r,r=s);}else Ki=r,r=s;if(r===s)if(r=Ki,(t=Xf())!==s){if(e=[],(n=hf())!==s)for(;n!==s;)e.push(n),n=hf();else e=s;e!==s?(Qi=r,r=t=io(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function wf(){var r,t,e,n;if(r=Ki,(t=Lf())!==s){for(e=[],n=Cf();n!==s;)e.push(n),n=Cf();e!==s?(Qi=r,r=t=io(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Lf(){var t;return co.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(lo)),t}function Cf(){var t;return fo.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(bo)),t}function hf(){var t;return po.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(vo)),t}function mf(){var t,e,n,o;return t=Ki,e=Ki,58===r.charCodeAt(Ki)?(n=":",Ki++):(n=s,0===rc&&sc(yo)),n!==s&&(o=wf())!==s?e=n=[n,o]:(Ki=e,e=s),e!==s&&(Qi=t,e={type:"param",value:e[1]}),t=e}function Ef(){var t,e,n,o,u,a,i,c,l;return t=Ki,mb()!==s&&Up()!==s&&nb()!==s&&Up()!==s&&(e=cp())!==s&&Up()!==s?(n=Ki,(o=Np())!==s&&(u=Up())!==s?((a=Ul())===s&&(a=null),a!==s&&(i=Up())!==s&&(c=Op())!==s?n=o=[o,u,a,i,c]:(Ki=n,n=s)):(Ki=n,n=s),n===s&&(n=null),n!==s?(Qi=t,t={type:"on update",keyword:e,parentheses:!!(l=n),expr:l?l[2]:null}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,mb()!==s&&Up()!==s&&nb()!==s&&Up()!==s?("now"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(wo)),e!==s&&Up()!==s&&(n=Np())!==s&&(o=Up())!==s&&(u=Op())!==s?(Qi=t,t=function(r){return {type:"on update",keyword:r,parentheses:true}}(e)):(Ki=t,t=s)):(Ki=t,t=s)),t}function Af(){var t,e,n;return t=Ki,"over"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Lo)),e!==s&&Up()!==s&&(n=_f())!==s?(Qi=t,t=e={type:"window",as_window_specification:n}):(Ki=t,t=s),t===s&&(t=Ef()),t}function Tf(){var r,t,e;return r=Ki,(t=wf())!==s&&Up()!==s&&db()!==s&&Up()!==s&&(e=_f())!==s?(Qi=r,r=t={name:t,as_window_specification:e}):(Ki=r,r=s),r}function _f(){var r,t;return (r=wf())===s&&(r=Ki,Np()!==s&&Up()!==s?((t=function(){var r,t,e,n;r=Ki,(t=El())===s&&(t=null);t!==s&&Up()!==s?((e=Al())===s&&(e=null),e!==s&&Up()!==s?((n=function(){var r,t,e,n,o;r=Ki,(t=op())!==s&&Up()!==s?((e=gf())===s&&(e=If()),e!==s?(Qi=r,r=t={type:"rows",expr:e}):(Ki=r,r=s)):(Ki=r,r=s);r===s&&(r=Ki,(t=op())!==s&&Up()!==s&&(e=jb())!==s&&Up()!==s&&(n=If())!==s&&Up()!==s&&Gb()!==s&&Up()!==s&&(o=gf())!==s?(Qi=r,t=cv(e,{type:"origin",value:"rows"},{type:"expr_list",value:[n,o]}),r=t):(Ki=r,r=s));return r}())===s&&(n=null),n!==s?(Qi=r,r=t={name:null,partitionby:t,orderby:e,window_frame_clause:n}):(Ki=r,r=s)):(Ki=r,r=s)):(Ki=r,r=s);return r}())===s&&(t=null),t!==s&&Up()!==s&&Op()!==s?(Qi=r,r={window_specification:t||{},parentheses:true}):(Ki=r,r=s)):(Ki=r,r=s)),r}function gf(){var t,e,n,o;return t=Ki,(e=Nf())!==s&&Up()!==s?("following"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(ho)),n!==s?(Qi=t,(o=e).value+=" FOLLOWING",t=e=o):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Sf()),t}function If(){var t,e,n,o,u;return t=Ki,(e=Nf())!==s&&Up()!==s?("preceding"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(mo)),n===s&&("following"===r.substr(Ki,9).toLowerCase()?(n=r.substr(Ki,9),Ki+=9):(n=s,0===rc&&sc(ho))),n!==s?(Qi=t,u=n,(o=e).value+=" "+u.toUpperCase(),t=e=o):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Sf()),t}function Sf(){var t,e,n;return t=Ki,"current"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(P)),e!==s&&Up()!==s?("row"===r.substr(Ki,3).toLowerCase()?(n=r.substr(Ki,3),Ki+=3):(n=s,0===rc&&sc(yr)),n!==s?(Qi=t,t=e={type:"origin",value:"current row",...av()}):(Ki=t,t=s)):(Ki=t,t=s),t}function Nf(){var t,e;return t=Ki,"unbounded"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(Y)),e!==s&&(Qi=t,e={type:"origin",value:e.toUpperCase(),...av()}),(t=e)===s&&(t=$f()),t}function Of(){var t,e;return t=Ki,"year_month"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Ao)),e===s&&("day_hour"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(To)),e===s&&("day_minute"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(_o)),e===s&&("day_second"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(go)),e===s&&("day_microsecond"===r.substr(Ki,15).toLowerCase()?(e=r.substr(Ki,15),Ki+=15):(e=s,0===rc&&sc(Io)),e===s&&("hour_minute"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(So)),e===s&&("hour_second"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(No)),e===s&&("hour_microsecond"===r.substr(Ki,16).toLowerCase()?(e=r.substr(Ki,16),Ki+=16):(e=s,0===rc&&sc(Oo)),e===s&&("minute_second"===r.substr(Ki,13).toLowerCase()?(e=r.substr(Ki,13),Ki+=13):(e=s,0===rc&&sc(Ro)),e===s&&("minute_microsecond"===r.substr(Ki,18).toLowerCase()?(e=r.substr(Ki,18),Ki+=18):(e=s,0===rc&&sc(xo)),e===s&&("second_microsecond"===r.substr(Ki,18).toLowerCase()?(e=r.substr(Ki,18),Ki+=18):(e=s,0===rc&&sc(jo)),e===s&&("timezone_hour"===r.substr(Ki,13).toLowerCase()?(e=r.substr(Ki,13),Ki+=13):(e=s,0===rc&&sc(ko)),e===s&&("timezone_minute"===r.substr(Ki,15).toLowerCase()?(e=r.substr(Ki,15),Ki+=15):(e=s,0===rc&&sc(Uo)),e===s&&("century"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Do)),e===s&&("day"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Mo)),e===s&&("date"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Po)),e===s&&("decade"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Go)),e===s&&("dow"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Fo)),e===s&&("doy"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Ho)),e===s&&("epoch"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Yo)),e===s&&("hour"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Bo)),e===s&&("isodow"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc($o)),e===s&&("isoweek"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Wo)),e===s&&("isoyear"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(qo)),e===s&&("microseconds"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(Vo)),e===s&&("millennium"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Xo)),e===s&&("milliseconds"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(Ko)),e===s&&("minute"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Qo)),e===s&&("month"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(zo)),e===s&&("quarter"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Zo)),e===s&&("second"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Jo)),e===s&&("time"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(rs)),e===s&&("timezone"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(ts)),e===s&&("week"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(es)),e===s&&("year"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ns)))))))))))))))))))))))))))))))))))),e!==s&&(Qi=t,e=e),t=e}function Rf(){var t,e,n,o,u,a,i,c;return t=Ki,(e=Hb())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(n=Of())!==s&&Up()!==s&&pb()!==s&&Up()!==s?((o=up())===s&&(o=ip())===s&&(o=sp())===s&&(o=ep()),o!==s&&Up()!==s&&(u=Fl())!==s&&Up()!==s&&Op()!==s?(Qi=t,a=n,i=o,c=u,t=e={type:e.toLowerCase(),args:{field:a,cast_type:i,source:c},...av()}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Hb())!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(n=Of())!==s&&Up()!==s&&pb()!==s&&Up()!==s&&(o=Fl())!==s&&Up()!==s&&(u=Op())!==s?(Qi=t,t=e=function(r,t,e){return {type:r.toLowerCase(),args:{field:t,source:e},...av()}}(e,n,o)):(Ki=t,t=s),t===s&&(t=Ki,"date_trunc"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(os)),e!==s&&Up()!==s&&Np()!==s&&Up()!==s&&(n=Fl())!==s&&Up()!==s&&Ip()!==s&&Up()!==s&&(o=Of())!==s&&Up()!==s&&(u=Op())!==s?(Qi=t,t=e=function(r,t){return {type:"function",name:{name:[{type:"origin",value:"date_trunc"}]},args:{type:"expr_list",value:[r,{type:"origin",value:t}]},over:null,...av()}}(n,o)):(Ki=t,t=s))),t}function xf(){var t,e,n;return t=Ki,(e=function(){var t;return "both"===r.substr(Ki,4).toLowerCase()?(t=r.substr(Ki,4),Ki+=4):(t=s,0===rc&&sc(ss)),t===s&&("leading"===r.substr(Ki,7).toLowerCase()?(t=r.substr(Ki,7),Ki+=7):(t=s,0===rc&&sc(us)),t===s&&("trailing"===r.substr(Ki,8).toLowerCase()?(t=r.substr(Ki,8),Ki+=8):(t=s,0===rc&&sc(as)))),t}())===s&&(e=null),e!==s&&Up()!==s?((n=Fl())===s&&(n=null),n!==s&&Up()!==s&&pb()!==s?(Qi=t,t=e=function(r,t,e){let n=[];return r&&n.push({type:"origin",value:r}),t&&n.push(t),n.push({type:"origin",value:"from"}),{type:"expr_list",value:n}}(e,n)):(Ki=t,t=s)):(Ki=t,t=s),t}function jf(){var t,e,n,o;return t=Ki,"trim"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(is)),e!==s&&Up()!==s&&Np()!==s&&Up()!==s?((n=xf())===s&&(n=null),n!==s&&Up()!==s&&(o=Fl())!==s&&Up()!==s&&Op()!==s?(Qi=t,t=e=function(r,t){let e=r||{type:"expr_list",value:[]};return e.value.push(t),{type:"function",name:{name:[{type:"origin",value:"trim"}]},args:e,...av()}}(n,o)):(Ki=t,t=s)):(Ki=t,t=s),t}function kf(){var t,e,n,o,u,a,i,c;return (t=Rf())===s&&(t=jf())===s&&(t=Ki,"convert"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(cs)),e!==s&&Up()!==s&&(n=Np())!==s&&Up()!==s&&(o=function(){var r,t,e,n,o,u;return r=Ki,(t=Wp())!==s&&Up()!==s&&Ip()!==s&&Up()!==s?((e=ev())===s&&(e=ov()),e!==s&&Up()!==s&&(n=Mc())!==s&&Up()!==s&&(o=sf())!==s?(Qi=r,r=t=function(r,t,e,n){const{dataType:o,length:s}=t;let u=o;return void 0!==s&&(u=`${u}(${s})`),{type:"expr_list",value:[r,{type:"origin",value:u,suffix:{prefix:e,...n}}]}}(t,e,n,o)):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=Wp())!==s&&Up()!==s&&Ip()!==s&&Up()!==s?((e=Df())===s&&(e=rv()),e!==s?(Qi=r,r=t={type:"expr_list",value:[t,{type:"datatype",..."string"==typeof(u=e)?{dataType:u}:u}]}):(Ki=r,r=s)):(Ki=r,r=s),r===s&&(r=Ki,(t=Yl())!==s&&Up()!==s&&_b()!==s&&Up()!==s&&(e=wf())!==s?(Qi=r,r=t=function(r,t){return r.suffix="USING "+t.toUpperCase(),{type:"expr_list",value:[r]}}(t,e)):(Ki=r,r=s))),r}())!==s&&(u=Up())!==s&&Op()!==s?(Qi=t,t=e={type:"function",name:{name:[{type:"origin",value:"convert"}]},args:o,...av()}):(Ki=t,t=s),t===s&&(t=Ki,(e=function(){var t;(t=Uf())===s&&(t=lp())===s&&(t=ap())===s&&(t=function(){var t,e,n,o;t=Ki,"session_user"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(qa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SESSION_USER"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"system_user"===r.substr(Ki,11).toLowerCase()?(e=r.substr(Ki,11),Ki+=11):(e=s,0===rc&&sc(Va));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SYSTEM_USER"):(Ki=t,t=s)):(Ki=t,t=s);return t}());return t}())!==s&&Up()!==s&&(n=Np())!==s&&Up()!==s?((o=Ul())===s&&(o=null),o!==s&&(u=Up())!==s&&Op()!==s&&Up()!==s?((a=Af())===s&&(a=null),a!==s?(Qi=t,t=e=function(r,t,e){return {type:"function",name:{name:[{type:"default",value:r}]},args:t||{type:"expr_list",value:[]},over:e,...av()}}(e,o,a)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Uf())!==s&&Up()!==s?((n=Ef())===s&&(n=null),n!==s?(Qi=t,t=e={type:"function",name:{name:[{type:"origin",value:e}]},over:n,...av()}):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=Ki,(e=Xp())!==s?(Qi=Ki,(!uv[(c=e).name[0]&&c.name[0].value.toLowerCase()]?void 0:s)!==s&&(n=Up())!==s&&Np()!==s&&(o=Up())!==s?((u=Yl())===s&&(u=null),u!==s&&Up()!==s&&Op()!==s&&(a=Up())!==s?((i=Af())===s&&(i=null),i!==s?(Qi=t,t=e=function(r,t,e){return t&&"expr_list"!==t.type&&(t={type:"expr_list",value:[t]}),(r.name[0]&&"TIMESTAMPDIFF"===r.name[0].value.toUpperCase()||r.name[0]&&"TIMESTAMPADD"===r.name[0].value.toUpperCase())&&t.value&&t.value[0]&&(t.value[0]={type:"origin",value:t.value[0].column}),{type:"function",name:r,args:t||{type:"expr_list",value:[]},over:e,...av()}}(e,u,i)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s)):(Ki=t,t=s))))),t}function Uf(){var t;return (t=function(){var t,e,n,o;t=Ki,"current_date"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(Fa));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CURRENT_DATE"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"current_time"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(Ba));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CURRENT_TIME"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=cp()),t}function Df(){var t;return (t=function(){var t,e,n,o;t=Ki,"signed"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(ha));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SIGNED"):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n,o;t=Ki,"unsigned"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(ma));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="UNSIGNED"):(Ki=t,t=s)):(Ki=t,t=s);return t}()),t}function Mf(){var t,e,n,o,u,a,i,c,l;return t=Ki,"binary"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(ls)),e===s&&("_binary"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(fs))),e===s&&(e=null),e!==s&&Up()!==s&&(n=Ff())!==s?(o=Ki,(u=Up())!==s&&(a=Ac())!==s?o=u=[u,a]:(Ki=o,o=s),o===s&&(o=null),o!==s?(Qi=t,c=n,l=o,(i=e)&&(c.prefix=i.toLowerCase()),l&&(c.suffix={collate:l[1]}),t=e=c):(Ki=t,t=s)):(Ki=t,t=s),t===s&&(t=function(){var t,e;t=Ki,(e=function(){var t,e,n,o;t=Ki,"true"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(zs));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e={type:"bool",value:true});(t=e)===s&&(t=Ki,(e=function(){var t,e,n,o;t=Ki,"false"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Js));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e={type:"bool",value:false}),t=e);return t}())===s&&(t=Gf())===s&&(t=function(){var t,e,n,o,u,a;t=Ki,(e=sp())===s&&(e=ep())===s&&(e=up())===s&&(e=np());if(e!==s)if(Up()!==s){if(n=Ki,39===r.charCodeAt(Ki)?(o="'",Ki++):(o=s,0===rc&&sc(Ot)),o!==s){for(u=[],a=Yf();a!==s;)u.push(a),a=Yf();u!==s?(39===r.charCodeAt(Ki)?(a="'",Ki++):(a=s,0===rc&&sc(Ot)),a!==s?n=o=[o,u,a]:(Ki=n,n=s)):(Ki=n,n=s);}else Ki=n,n=s;n!==s?(Qi=t,e=Cs(e,n),t=e):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;if(t===s)if(t=Ki,(e=sp())===s&&(e=ep())===s&&(e=up())===s&&(e=np()),e!==s)if(Up()!==s){if(n=Ki,34===r.charCodeAt(Ki)?(o='"',Ki++):(o=s,0===rc&&sc(ro)),o!==s){for(u=[],a=Hf();a!==s;)u.push(a),a=Hf();u!==s?(34===r.charCodeAt(Ki)?(a='"',Ki++):(a=s,0===rc&&sc(ro)),a!==s?n=o=[o,u,a]:(Ki=n,n=s)):(Ki=n,n=s);}else Ki=n,n=s;n!==s?(Qi=t,e=Cs(e,n),t=e):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;return t}()),t}function Pf(){var r;return (r=Mf())===s&&(r=$f()),r}function Gf(){var t,e;return t=Ki,(e=function(){var t,e,n,o;t=Ki,"null"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Ks));e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s);return t}())!==s&&(Qi=t,e={type:"null",value:null}),t=e}function Ff(){var t,e,n,o,u,a,i,c;if(t=Ki,"_binary"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(fs)),e===s&&("_latin1"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(bs))),e===s&&(e=null),e!==s)if((n=Up())!==s)if("x"===r.substr(Ki,1).toLowerCase()?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(ps)),o!==s){if(u=Ki,39===r.charCodeAt(Ki)?(a="'",Ki++):(a=s,0===rc&&sc(Ot)),a!==s){for(i=[],vs.test(r.charAt(Ki))?(c=r.charAt(Ki),Ki++):(c=s,0===rc&&sc(ds));c!==s;)i.push(c),vs.test(r.charAt(Ki))?(c=r.charAt(Ki),Ki++):(c=s,0===rc&&sc(ds));i!==s?(39===r.charCodeAt(Ki)?(c="'",Ki++):(c=s,0===rc&&sc(Ot)),c!==s?u=a=[a,i,c]:(Ki=u,u=s)):(Ki=u,u=s);}else Ki=u,u=s;u!==s?(Qi=t,t=e={type:"hex_string",prefix:e,value:u[1].join("")}):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;if(t===s){if(t=Ki,"_binary"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(fs)),e===s&&("_latin1"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(bs))),e===s&&(e=null),e!==s)if((n=Up())!==s)if("b"===r.substr(Ki,1).toLowerCase()?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(ys)),o!==s){if(u=Ki,39===r.charCodeAt(Ki)?(a="'",Ki++):(a=s,0===rc&&sc(Ot)),a!==s){for(i=[],vs.test(r.charAt(Ki))?(c=r.charAt(Ki),Ki++):(c=s,0===rc&&sc(ds));c!==s;)i.push(c),vs.test(r.charAt(Ki))?(c=r.charAt(Ki),Ki++):(c=s,0===rc&&sc(ds));i!==s?(39===r.charCodeAt(Ki)?(c="'",Ki++):(c=s,0===rc&&sc(Ot)),c!==s?u=a=[a,i,c]:(Ki=u,u=s)):(Ki=u,u=s);}else Ki=u,u=s;u!==s?(Qi=t,t=e=function(r,t,e){return {type:"bit_string",prefix:r,value:e[1].join("")}}(e,0,u)):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;if(t===s){if(t=Ki,"_binary"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(fs)),e===s&&("_latin1"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(bs))),e===s&&(e=null),e!==s)if((n=Up())!==s)if("0x"===r.substr(Ki,2).toLowerCase()?(o=r.substr(Ki,2),Ki+=2):(o=s,0===rc&&sc(ws)),o!==s){for(u=[],vs.test(r.charAt(Ki))?(a=r.charAt(Ki),Ki++):(a=s,0===rc&&sc(ds));a!==s;)u.push(a),vs.test(r.charAt(Ki))?(a=r.charAt(Ki),Ki++):(a=s,0===rc&&sc(ds));u!==s?(Qi=t,t=e=function(r,t,e){return {type:"full_hex_string",prefix:r,value:e.join("")}}(e,0,u)):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;if(t===s){if(t=Ki,"n"===r.substr(Ki,1).toLowerCase()?(e=r.charAt(Ki),Ki++):(e=s,0===rc&&sc(Ls)),e!==s){if(n=Ki,39===r.charCodeAt(Ki)?(o="'",Ki++):(o=s,0===rc&&sc(Ot)),o!==s){for(u=[],a=Yf();a!==s;)u.push(a),a=Yf();u!==s?(39===r.charCodeAt(Ki)?(a="'",Ki++):(a=s,0===rc&&sc(Ot)),a!==s?n=o=[o,u,a]:(Ki=n,n=s)):(Ki=n,n=s);}else Ki=n,n=s;n!==s?(Qi=t,t=e=function(r,t){return {type:"natural_string",value:t[1].join("")}}(0,n)):(Ki=t,t=s);}else Ki=t,t=s;if(t===s){if(t=Ki,e=Ki,39===r.charCodeAt(Ki)?(n="'",Ki++):(n=s,0===rc&&sc(Ot)),n!==s){for(o=[],u=Yf();u!==s;)o.push(u),u=Yf();o!==s?(39===r.charCodeAt(Ki)?(u="'",Ki++):(u=s,0===rc&&sc(Ot)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s);}else Ki=e,e=s;if(e!==s&&(Qi=t,e=function(r){return {type:"single_quote_string",value:r[1].join("")}}(e)),(t=e)===s){if(t=Ki,e=Ki,34===r.charCodeAt(Ki)?(n='"',Ki++):(n=s,0===rc&&sc(ro)),n!==s){for(o=[],u=Hf();u!==s;)o.push(u),u=Hf();o!==s?(34===r.charCodeAt(Ki)?(u='"',Ki++):(u=s,0===rc&&sc(ro)),u!==s?e=n=[n,o,u]:(Ki=e,e=s)):(Ki=e,e=s);}else Ki=e,e=s;e!==s&&(Qi=t,e=function(r){return {type:"double_quote_string",value:r[1].join("")}}(e)),t=e;}}}}}return t}function Hf(){var t;return hs.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(ms)),t===s&&(t=Bf())===s&&(Es.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(As))),t}function Yf(){var t;return Ts.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(_s)),t===s&&(t=Bf()),t}function Bf(){var t,e,n,o,u,a,i,c,l,f;return t=Ki,"\\'"===r.substr(Ki,2)?(e="\\'",Ki+=2):(e=s,0===rc&&sc(gs)),e!==s&&(Qi=t,e="\\'"),(t=e)===s&&(t=Ki,'\\"'===r.substr(Ki,2)?(e='\\"',Ki+=2):(e=s,0===rc&&sc(Is)),e!==s&&(Qi=t,e='\\"'),(t=e)===s&&(t=Ki,"\\\\"===r.substr(Ki,2)?(e="\\\\",Ki+=2):(e=s,0===rc&&sc(Ss)),e!==s&&(Qi=t,e="\\\\"),(t=e)===s&&(t=Ki,"\\/"===r.substr(Ki,2)?(e="\\/",Ki+=2):(e=s,0===rc&&sc(Ns)),e!==s&&(Qi=t,e="\\/"),(t=e)===s&&(t=Ki,"\\b"===r.substr(Ki,2)?(e="\\b",Ki+=2):(e=s,0===rc&&sc(Os)),e!==s&&(Qi=t,e="\b"),(t=e)===s&&(t=Ki,"\\f"===r.substr(Ki,2)?(e="\\f",Ki+=2):(e=s,0===rc&&sc(Rs)),e!==s&&(Qi=t,e="\f"),(t=e)===s&&(t=Ki,"\\n"===r.substr(Ki,2)?(e="\\n",Ki+=2):(e=s,0===rc&&sc(xs)),e!==s&&(Qi=t,e="\n"),(t=e)===s&&(t=Ki,"\\r"===r.substr(Ki,2)?(e="\\r",Ki+=2):(e=s,0===rc&&sc(js)),e!==s&&(Qi=t,e="\r"),(t=e)===s&&(t=Ki,"\\t"===r.substr(Ki,2)?(e="\\t",Ki+=2):(e=s,0===rc&&sc(ks)),e!==s&&(Qi=t,e="\t"),(t=e)===s&&(t=Ki,"\\u"===r.substr(Ki,2)?(e="\\u",Ki+=2):(e=s,0===rc&&sc(Us)),e!==s&&(n=Qf())!==s&&(o=Qf())!==s&&(u=Qf())!==s&&(a=Qf())!==s?(Qi=t,i=n,c=o,l=u,f=a,t=e=String.fromCharCode(parseInt("0x"+i+c+l+f))):(Ki=t,t=s),t===s&&(t=Ki,92===r.charCodeAt(Ki)?(e="\\",Ki++):(e=s,0===rc&&sc(Ds)),e!==s&&(Qi=t,e="\\"),(t=e)===s&&(t=Ki,"''"===r.substr(Ki,2)?(e="''",Ki+=2):(e=s,0===rc&&sc(Ms)),e!==s&&(Qi=t,e="''"),(t=e)===s&&(t=Ki,'""'===r.substr(Ki,2)?(e='""',Ki+=2):(e=s,0===rc&&sc(Ps)),e!==s&&(Qi=t,e='""'),(t=e)===s&&(t=Ki,"``"===r.substr(Ki,2)?(e="``",Ki+=2):(e=s,0===rc&&sc(Gs)),e!==s&&(Qi=t,e="``"),t=e))))))))))))),t}function $f(){var r,t,e;return r=Ki,(t=function(){var r,t,e,n;r=Ki,(t=Wf())!==s&&(e=qf())!==s&&(n=Vf())!==s?(Qi=r,r=t={type:"bigint",value:t+e+n}):(Ki=r,r=s);r===s&&(r=Ki,(t=Wf())!==s&&(e=qf())!==s?(Qi=r,t=function(r,t){const e=r+t;if(lv(r))return {type:"bigint",value:e};const n=t.length>=1?t.length-1:0;return parseFloat(e).toFixed(n)}(t,e),r=t):(Ki=r,r=s),r===s&&(r=Ki,(t=Wf())!==s&&(e=Vf())!==s?(Qi=r,t=function(r,t){return {type:"bigint",value:r+t}}(t,e),r=t):(Ki=r,r=s),r===s&&(r=Ki,(t=Wf())!==s&&(Qi=r,t=function(r){return lv(r)?{type:"bigint",value:r}:parseFloat(r)}(t)),r=t)));return r}())!==s&&(Qi=r,t=(e=t)&&"bigint"===e.type?e:{type:"number",value:e}),r=t}function Wf(){var t,e,n;return (t=Xf())===s&&(t=Kf())===s&&(t=Ki,45===r.charCodeAt(Ki)?(e="-",Ki++):(e=s,0===rc&&sc(xn)),e===s&&(43===r.charCodeAt(Ki)?(e="+",Ki++):(e=s,0===rc&&sc(Rn))),e!==s&&(n=Xf())!==s?(Qi=t,t=e=e+n):(Ki=t,t=s),t===s&&(t=Ki,45===r.charCodeAt(Ki)?(e="-",Ki++):(e=s,0===rc&&sc(xn)),e===s&&(43===r.charCodeAt(Ki)?(e="+",Ki++):(e=s,0===rc&&sc(Rn))),e!==s&&(n=Kf())!==s?(Qi=t,t=e=function(r,t){return r+t}(e,n)):(Ki=t,t=s))),t}function qf(){var t,e,n,o;return t=Ki,46===r.charCodeAt(Ki)?(e=".",Ki++):(e=s,0===rc&&sc(Ys)),e!==s?((n=Xf())===s&&(n=null),n!==s?(Qi=t,t=e=(o=n)?"."+o:""):(Ki=t,t=s)):(Ki=t,t=s),t}function Vf(){var t,e,n;return t=Ki,(e=function(){var t,e,n;t=Ki,Ws.test(r.charAt(Ki))?(e=r.charAt(Ki),Ki++):(e=s,0===rc&&sc(qs));e!==s?(Vs.test(r.charAt(Ki))?(n=r.charAt(Ki),Ki++):(n=s,0===rc&&sc(Xs)),n===s&&(n=null),n!==s?(Qi=t,t=e=e+(null!==(o=n)?o:"")):(Ki=t,t=s)):(Ki=t,t=s);var o;return t}())!==s&&(n=Xf())!==s?(Qi=t,t=e=e+n):(Ki=t,t=s),t}function Xf(){var r,t,e;if(r=Ki,t=[],(e=Kf())!==s)for(;e!==s;)t.push(e),e=Kf();else t=s;return t!==s&&(Qi=r,t=t.join("")),r=t}function Kf(){var t;return We.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(qe)),t}function Qf(){var t;return Bs.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc($s)),t}function zf(){var t,e,n,o;return t=Ki,"default"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(k)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Zf(){var t,e,n,o;return t=Ki,"to"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(Zs)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Jf(){var t,e,n,o;return t=Ki,"show"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ru)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function rb(){var t,e,n,o;return t=Ki,"drop"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Dr)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DROP"):(Ki=t,t=s)):(Ki=t,t=s),t}function tb(){var t,e,n,o;return t=Ki,"alter"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(eu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function eb(){var t,e,n,o;return t=Ki,"select"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(nu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function nb(){var t,e,n,o;return t=Ki,"update"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(ou)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function ob(){var t,e,n,o;return t=Ki,"create"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(su)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function sb(){var t,e,n,o;return t=Ki,"temporary"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(uu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function ub(){var t,e,n,o;return t=Ki,"delete"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(au)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function ab(){var t,e,n,o;return t=Ki,"insert"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(iu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function ib(){var t,e,n,o;return t=Ki,"replace"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(lu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function cb(){var t,e,n,o;return t=Ki,"rename"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(fu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function lb(){var t,e,n,o;return t=Ki,"ignore"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(bu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function fb(){var t,e,n,o;return t=Ki,"partition"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(vu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="PARTITION"):(Ki=t,t=s)):(Ki=t,t=s),t}function bb(){var t,e,n,o;return t=Ki,"into"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Re)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function pb(){var t,e,n,o;return t=Ki,"from"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(du)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function vb(){var t,e,n,o;return t=Ki,"set"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(ft)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SET"):(Ki=t,t=s)):(Ki=t,t=s),t}function db(){var t,e,n,o;return t=Ki,"as"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(L)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function yb(){var t,e,n,o;return t=Ki,"table"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(xe)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TABLE"):(Ki=t,t=s)):(Ki=t,t=s),t}function wb(){var t,e,n,o;return t=Ki,"trigger"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(yu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TRIGGER"):(Ki=t,t=s)):(Ki=t,t=s),t}function Lb(){var t,e,n,o;return t=Ki,"tables"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(wu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TABLES"):(Ki=t,t=s)):(Ki=t,t=s),t}function Cb(){var t,e,n,o;return t=Ki,"database"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Lu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DATABASE"):(Ki=t,t=s)):(Ki=t,t=s),t}function hb(){var t,e,n,o;return t=Ki,"schema"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Cu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SCHEMA"):(Ki=t,t=s)):(Ki=t,t=s),t}function mb(){var t,e,n,o;return t=Ki,"on"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(hu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Eb(){var t,e,n,o;return t=Ki,"join"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(gu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Ab(){var t,e,n,o;return t=Ki,"outer"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Iu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Tb(){var t,e,n,o;return t=Ki,"values"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(xu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function _b(){var t,e,n,o;return t=Ki,"using"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(ju)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function gb(){var t,e,n,o;return t=Ki,"with"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(v)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Ib(){var t,e,n,o;return t=Ki,"go"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(Uu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="GO"):(Ki=t,t=s)):(Ki=t,t=s),t}function Sb(){var t,e,n,o;return t=Ki,"by"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(d)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Nb(){var t,e,n,o;return t=Ki,"asc"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Hu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="ASC"):(Ki=t,t=s)):(Ki=t,t=s),t}function Ob(){var t,e,n,o;return t=Ki,"desc"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Yu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DESC"):(Ki=t,t=s)):(Ki=t,t=s),t}function Rb(){var t,e,n,o;return t=Ki,"all"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc($u)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="ALL"):(Ki=t,t=s)):(Ki=t,t=s),t}function xb(){var t,e,n,o;return t=Ki,"distinct"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Wu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DISTINCT"):(Ki=t,t=s)):(Ki=t,t=s),t}function jb(){var t,e,n,o;return t=Ki,"between"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(qu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="BETWEEN"):(Ki=t,t=s)):(Ki=t,t=s),t}function kb(){var t,e,n,o;return t=Ki,"in"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(Ve)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="IN"):(Ki=t,t=s)):(Ki=t,t=s),t}function Ub(){var t,e,n,o;return t=Ki,"is"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(Vu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="IS"):(Ki=t,t=s)):(Ki=t,t=s),t}function Db(){var t,e,n,o;return t=Ki,"like"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Xu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="LIKE"):(Ki=t,t=s)):(Ki=t,t=s),t}function Mb(){var t,e,n,o;return t=Ki,"exists"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(zu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="EXISTS"):(Ki=t,t=s)):(Ki=t,t=s),t}function Pb(){var t,e,n,o;return t=Ki,"not"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Zr)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="NOT"):(Ki=t,t=s)):(Ki=t,t=s),t}function Gb(){var t,e,n,o;return t=Ki,"and"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Zu)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="AND"):(Ki=t,t=s)):(Ki=t,t=s),t}function Fb(){var t,e,n,o;return t=Ki,"or"===r.substr(Ki,2).toLowerCase()?(e=r.substr(Ki,2),Ki+=2):(e=s,0===rc&&sc(Ju)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="OR"):(Ki=t,t=s)):(Ki=t,t=s),t}function Hb(){var t,e,n,o;return t=Ki,"extract"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(ua)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="EXTRACT"):(Ki=t,t=s)):(Ki=t,t=s),t}function Yb(){var t,e,n,o;return t=Ki,"case"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ia)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function Bb(){var t,e,n,o;return t=Ki,"end"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(ba)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?t=e=[e,n]:(Ki=t,t=s)):(Ki=t,t=s),t}function $b(){var t,e,n,o;return t=Ki,"cast"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(pa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CAST"):(Ki=t,t=s)):(Ki=t,t=s),t}function Wb(){var t,e,n,o;return t=Ki,"bit"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(da)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="BIT"):(Ki=t,t=s)):(Ki=t,t=s),t}function qb(){var t,e,n,o;return t=Ki,"numeric"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(La)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="NUMERIC"):(Ki=t,t=s)):(Ki=t,t=s),t}function Vb(){var t,e,n,o;return t=Ki,"decimal"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Ca)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DECIMAL"):(Ki=t,t=s)):(Ki=t,t=s),t}function Xb(){var t,e,n,o;return t=Ki,"int"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Ea)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="INT"):(Ki=t,t=s)):(Ki=t,t=s),t}function Kb(){var t,e,n,o;return t=Ki,"integer"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Ta)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="INTEGER"):(Ki=t,t=s)):(Ki=t,t=s),t}function Qb(){var t,e,n,o;return t=Ki,"smallint"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(ga)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SMALLINT"):(Ki=t,t=s)):(Ki=t,t=s),t}function zb(){var t,e,n,o;return t=Ki,"mediumint"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(Ia)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MEDIUMINT"):(Ki=t,t=s)):(Ki=t,t=s),t}function Zb(){var t,e,n,o;return t=Ki,"tinyint"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Sa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TINYINT"):(Ki=t,t=s)):(Ki=t,t=s),t}function Jb(){var t,e,n,o;return t=Ki,"bigint"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(ja)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="BIGINT"):(Ki=t,t=s)):(Ki=t,t=s),t}function rp(){var t,e,n,o;return t=Ki,"float"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Ua)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="FLOAT"):(Ki=t,t=s)):(Ki=t,t=s),t}function tp(){var t,e,n,o;return t=Ki,"double"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Da)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DOUBLE"):(Ki=t,t=s)):(Ki=t,t=s),t}function ep(){var t,e,n,o;return t=Ki,"date"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Po)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DATE"):(Ki=t,t=s)):(Ki=t,t=s),t}function np(){var t,e,n,o;return t=Ki,"datetime"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Ma)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="DATETIME"):(Ki=t,t=s)):(Ki=t,t=s),t}function op(){var t,e,n,o;return t=Ki,"rows"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(je)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="ROWS"):(Ki=t,t=s)):(Ki=t,t=s),t}function sp(){var t,e,n,o;return t=Ki,"time"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(rs)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TIME"):(Ki=t,t=s)):(Ki=t,t=s),t}function up(){var t,e,n,o;return t=Ki,"timestamp"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(Pa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TIMESTAMP"):(Ki=t,t=s)):(Ki=t,t=s),t}function ap(){var t,e,n,o;return t=Ki,"user"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Ga)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="USER"):(Ki=t,t=s)):(Ki=t,t=s),t}function ip(){var t,e,n,o;return t=Ki,"interval"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Ha)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="INTERVAL"):(Ki=t,t=s)):(Ki=t,t=s),t}function cp(){var t,e,n,o;return t=Ki,"current_timestamp"===r.substr(Ki,17).toLowerCase()?(e=r.substr(Ki,17),Ki+=17):(e=s,0===rc&&sc($a)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CURRENT_TIMESTAMP"):(Ki=t,t=s)):(Ki=t,t=s),t}function lp(){var t,e,n,o;return t=Ki,"current_user"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(Wa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CURRENT_USER"):(Ki=t,t=s)):(Ki=t,t=s),t}function fp(){var t,e,n,o;return t=Ki,"view"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ke)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="VIEW"):(Ki=t,t=s)):(Ki=t,t=s),t}function bp(){var t;return 64===r.charCodeAt(Ki)?(t="@",Ki++):(t=s,0===rc&&sc(lr)),t}function pp(){var t;return (t=function(){var t;return "@@"===r.substr(Ki,2)?(t="@@",Ki+=2):(t=s,0===rc&&sc(ui)),t}())===s&&(t=bp())===s&&(t=function(){var t;return 36===r.charCodeAt(Ki)?(t="$",Ki++):(t=s,0===rc&&sc(ai)),t}()),t}function vp(){var t;return ":="===r.substr(Ki,2)?(t=":=",Ki+=2):(t=s,0===rc&&sc(ci)),t}function dp(){var t;return 61===r.charCodeAt(Ki)?(t="=",Ki++):(t=s,0===rc&&sc(hn)),t}function yp(){var t,e,n,o;return t=Ki,"add"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(fi)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="ADD"):(Ki=t,t=s)):(Ki=t,t=s),t}function wp(){var t,e,n,o;return t=Ki,"column"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(bi)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="COLUMN"):(Ki=t,t=s)):(Ki=t,t=s),t}function Lp(){var t,e,n,o;return t=Ki,"index"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(It)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="INDEX"):(Ki=t,t=s)):(Ki=t,t=s),t}function Cp(){var t,e,n,o;return t=Ki,"key"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(ir)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="KEY"):(Ki=t,t=s)):(Ki=t,t=s),t}function hp(){var t,e,n,o;return t=Ki,"fulltext"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(vi)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="FULLTEXT"):(Ki=t,t=s)):(Ki=t,t=s),t}function mp(){var t,e,n,o;return t=Ki,"spatial"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(di)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="SPATIAL"):(Ki=t,t=s)):(Ki=t,t=s),t}function Ep(){var t,e,n,o;return t=Ki,"unique"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(ar)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="UNIQUE"):(Ki=t,t=s)):(Ki=t,t=s),t}function Ap(){var t,e,n,o;return t=Ki,"comment"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(yi)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="COMMENT"):(Ki=t,t=s)):(Ki=t,t=s),t}function Tp(){var t,e,n,o;return t=Ki,"constraint"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Qr)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CONSTRAINT"):(Ki=t,t=s)):(Ki=t,t=s),t}function _p(){var t,e,n,o;return t=Ki,"references"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(wi)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="REFERENCES"):(Ki=t,t=s)):(Ki=t,t=s),t}function gp(){var t;return 46===r.charCodeAt(Ki)?(t=".",Ki++):(t=s,0===rc&&sc(Ys)),t}function Ip(){var t;return 44===r.charCodeAt(Ki)?(t=",",Ki++):(t=s,0===rc&&sc(Ti)),t}function Sp(){var t;return 42===r.charCodeAt(Ki)?(t="*",Ki++):(t=s,0===rc&&sc(jn)),t}function Np(){var t;return 40===r.charCodeAt(Ki)?(t="(",Ki++):(t=s,0===rc&&sc(Be)),t}function Op(){var t;return 41===r.charCodeAt(Ki)?(t=")",Ki++):(t=s,0===rc&&sc($e)),t}function Rp(){var t;return 59===r.charCodeAt(Ki)?(t=";",Ki++):(t=s,0===rc&&sc(Ii)),t}function xp(){var t;return "->"===r.substr(Ki,2)?(t="->",Ki+=2):(t=s,0===rc&&sc(Si)),t}function jp(){var t;return "->>"===r.substr(Ki,3)?(t="->>",Ki+=3):(t=s,0===rc&&sc(Ni)),t}function kp(){var t;return (t=function(){var t;return "||"===r.substr(Ki,2)?(t="||",Ki+=2):(t=s,0===rc&&sc(Dn)),t}())===s&&(t=function(){var t;return "&&"===r.substr(Ki,2)?(t="&&",Ki+=2):(t=s,0===rc&&sc(Oi)),t}())===s&&(t=function(){var t,e,n,o;return t=Ki,"xor"===r.substr(Ki,3).toLowerCase()?(e=r.substr(Ki,3),Ki+=3):(e=s,0===rc&&sc(Ri)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="XOR"):(Ki=t,t=s)):(Ki=t,t=s),t}()),t}function Up(){var r,t;for(r=[],(t=Fp())===s&&(t=Mp());t!==s;)r.push(t),(t=Fp())===s&&(t=Mp());return r}function Dp(){var r,t;if(r=[],(t=Fp())===s&&(t=Mp()),t!==s)for(;t!==s;)r.push(t),(t=Fp())===s&&(t=Mp());else r=s;return r}function Mp(){var t;return (t=function(){var t,e,n,o,u,a;t=Ki,"/*"===r.substr(Ki,2)?(e="/*",Ki+=2):(e=s,0===rc&&sc(xi));if(e!==s){for(n=[],o=Ki,u=Ki,rc++,"*/"===r.substr(Ki,2)?(a="*/",Ki+=2):(a=s,0===rc&&sc(ji)),rc--,a===s?u=void 0:(Ki=u,u=s),u!==s&&(a=Gp())!==s?o=u=[u,a]:(Ki=o,o=s);o!==s;)n.push(o),o=Ki,u=Ki,rc++,"*/"===r.substr(Ki,2)?(a="*/",Ki+=2):(a=s,0===rc&&sc(ji)),rc--,a===s?u=void 0:(Ki=u,u=s),u!==s&&(a=Gp())!==s?o=u=[u,a]:(Ki=o,o=s);n!==s?("*/"===r.substr(Ki,2)?(o="*/",Ki+=2):(o=s,0===rc&&sc(ji)),o!==s?t=e=[e,n,o]:(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;return t}())===s&&(t=function(){var t,e,n,o,u,a;t=Ki,"--"===r.substr(Ki,2)?(e="--",Ki+=2):(e=s,0===rc&&sc(ki));if(e!==s){for(n=[],o=Ki,u=Ki,rc++,a=Hp(),rc--,a===s?u=void 0:(Ki=u,u=s),u!==s&&(a=Gp())!==s?o=u=[u,a]:(Ki=o,o=s);o!==s;)n.push(o),o=Ki,u=Ki,rc++,a=Hp(),rc--,a===s?u=void 0:(Ki=u,u=s),u!==s&&(a=Gp())!==s?o=u=[u,a]:(Ki=o,o=s);n!==s?t=e=[e,n]:(Ki=t,t=s);}else Ki=t,t=s;return t}())===s&&(t=function(){var t,e,n,o,u,a;t=Ki,35===r.charCodeAt(Ki)?(e="#",Ki++):(e=s,0===rc&&sc(Ui));if(e!==s){for(n=[],o=Ki,u=Ki,rc++,a=Hp(),rc--,a===s?u=void 0:(Ki=u,u=s),u!==s&&(a=Gp())!==s?o=u=[u,a]:(Ki=o,o=s);o!==s;)n.push(o),o=Ki,u=Ki,rc++,a=Hp(),rc--,a===s?u=void 0:(Ki=u,u=s),u!==s&&(a=Gp())!==s?o=u=[u,a]:(Ki=o,o=s);n!==s?t=e=[e,n]:(Ki=t,t=s);}else Ki=t,t=s;return t}()),t}function Pp(){var r,t,e,n,o,u,a;return r=Ki,(t=Ap())!==s&&Up()!==s?((e=dp())===s&&(e=null),e!==s&&Up()!==s&&(n=Ff())!==s?(Qi=r,u=e,a=n,r=t={type:(o=t).toLowerCase(),keyword:o.toLowerCase(),symbol:u,value:a}):(Ki=r,r=s)):(Ki=r,r=s),r}function Gp(){var t;return r.length>Ki?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(Di)),t}function Fp(){var t;return Mi.test(r.charAt(Ki))?(t=r.charAt(Ki),Ki++):(t=s,0===rc&&sc(Pi)),t}function Hp(){var t,e;if((t=function(){var t,e;t=Ki,rc++,r.length>Ki?(e=r.charAt(Ki),Ki++):(e=s,0===rc&&sc(Di));rc--,e===s?t=void 0:(Ki=t,t=s);return t}())===s)if(t=[],Fs.test(r.charAt(Ki))?(e=r.charAt(Ki),Ki++):(e=s,0===rc&&sc(Hs)),e!==s)for(;e!==s;)t.push(e),Fs.test(r.charAt(Ki))?(e=r.charAt(Ki),Ki++):(e=s,0===rc&&sc(Hs));else t=s;return t}function Yp(){var t,e;return t=Ki,Qi=Ki,yv=[],(void 0)!==s&&Up()!==s?((e=Bp())===s&&(e=function(){var t,e;t=Ki,function(){var t;return "return"===r.substr(Ki,6).toLowerCase()?(t=r.substr(Ki,6),Ki+=6):(t=s,0===rc&&sc(ii)),t}()!==s&&Up()!==s&&(e=$p())!==s?(Qi=t,t={type:"return",expr:e}):(Ki=t,t=s);return t}()),e!==s?(Qi=t,t={stmt:e,vars:yv}):(Ki=t,t=s)):(Ki=t,t=s),t}function Bp(){var r,t,e,n;return r=Ki,(t=Zp())===s&&(t=Jp()),t!==s&&Up()!==s?((e=vp())===s&&(e=dp()),e!==s&&Up()!==s&&(n=$p())!==s?(Qi=r,r=t=Gi(t,e,n)):(Ki=r,r=s)):(Ki=r,r=s),r}function $p(){var t;return (t=Kc())===s&&(t=function(){var r,t,e,n,o;r=Ki,(t=Zp())!==s&&Up()!==s&&(e=wl())!==s&&Up()!==s&&(n=Zp())!==s&&Up()!==s&&(o=Cl())!==s?(Qi=r,r=t={type:"join",ltable:t,rtable:n,op:e,on:o}):(Ki=r,r=s);return r}())===s&&(t=Wp())===s&&(t=function(){var t,e;t=Ki,function(){var t;return 91===r.charCodeAt(Ki)?(t="[",Ki++):(t=s,0===rc&&sc(_i)),t}()!==s&&Up()!==s&&(e=zp())!==s&&Up()!==s&&function(){var t;return 93===r.charCodeAt(Ki)?(t="]",Ki++):(t=s,0===rc&&sc(gi)),t}()!==s?(Qi=t,t={type:"array",value:e}):(Ki=t,t=s);return t}()),t}function Wp(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=qp())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=zl())!==s&&(a=Up())!==s&&(i=qp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=zl())!==s&&(a=Up())!==s&&(i=qp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=En(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function qp(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Vp())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Jl())!==s&&(a=Up())!==s&&(i=Vp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Jl())!==s&&(a=Up())!==s&&(i=Vp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=En(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Vp(){var r,t,e;return (r=Kp())===s&&(r=Pf())===s&&(r=Zp())===s&&(r=ef())===s&&(r=Qp())===s&&(r=mf())===s&&(r=Ki,Np()!==s&&Up()!==s&&(t=Wp())!==s&&Up()!==s&&Op()!==s?(Qi=r,(e=t).parentheses=true,r=e):(Ki=r,r=s)),r}function Xp(){var r,t,e,n,o,u,a;return r=Ki,(t=of())===s&&(t=pf()),t!==s?(e=Ki,(n=Up())!==s&&(o=gp())!==s&&(u=Up())!==s?((a=of())===s&&(a=pf()),a!==s?e=n=[n,o,u,a]:(Ki=e,e=s)):(Ki=e,e=s),e===s&&(e=null),e!==s?(Qi=r,r=t=function(r,t){const e={name:[r]};return null!==t&&(e.schema=r,e.name=[t[3]]),e}(t,e)):(Ki=r,r=s)):(Ki=r,r=s),r}function Kp(){var r,t,e;return r=Ki,(t=Xp())!==s&&Up()!==s&&Np()!==s&&Up()!==s?((e=zp())===s&&(e=null),e!==s&&Up()!==s&&Op()!==s?(Qi=r,r=t={type:"function",name:t,args:{type:"expr_list",value:e},...av()}):(Ki=r,r=s)):(Ki=r,r=s),r}function Qp(){var r,t;return r=Ki,(t=Xp())!==s&&(Qi=r,t={type:"function",name:t,args:null,...av()}),r=t}function zp(){var r,t,e,n,o,u,a,i;if(r=Ki,(t=Vp())!==s){for(e=[],n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Vp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);n!==s;)e.push(n),n=Ki,(o=Up())!==s&&(u=Ip())!==s&&(a=Up())!==s&&(i=Vp())!==s?n=o=[o,u,a,i]:(Ki=n,n=s);e!==s?(Qi=r,r=t=sr(t,e)):(Ki=r,r=s);}else Ki=r,r=s;return r}function Zp(){var r,t,e,n,o;return r=Ki,(t=pp())!==s&&(e=Jp())!==s?(Qi=r,n=t,o=e,r=t={type:"var",...o,prefix:n}):(Ki=r,r=s),r}function Jp(){var t,e,n,o,u;return t=Ki,(e=wf())!==s&&(n=function(){var t,e,n,o,u;t=Ki,e=[],n=Ki,46===r.charCodeAt(Ki)?(o=".",Ki++):(o=s,0===rc&&sc(Ys));o!==s&&(u=wf())!==s?n=o=[o,u]:(Ki=n,n=s);for(;n!==s;)e.push(n),n=Ki,46===r.charCodeAt(Ki)?(o=".",Ki++):(o=s,0===rc&&sc(Ys)),o!==s&&(u=wf())!==s?n=o=[o,u]:(Ki=n,n=s);e!==s&&(Qi=t,e=function(r){const t=[];for(let e=0;e<r.length;e++)t.push(r[e][1]);return t}(e));return t=e}())!==s?(Qi=t,o=e,u=n,yv.push(o),t=e={type:"var",name:o,members:u,prefix:null}):(Ki=t,t=s),t===s&&(t=Ki,(e=$f())!==s&&(Qi=t,e={type:"var",name:e.value,members:[],quoted:null,prefix:null}),t=e),t}function rv(){var t;return (t=ev())===s&&(t=function(){var t,e,n,o,u,a,i,c,l,f,b,p;t=Ki,(e=qb())===s&&(e=Vb())===s&&(e=Xb())===s&&(e=Kb())===s&&(e=Qb())===s&&(e=zb())===s&&(e=Zb())===s&&(e=Jb())===s&&(e=rp())===s&&(e=tp())===s&&(e=Wb());if(e!==s)if((n=Up())!==s)if((o=Np())!==s)if((u=Up())!==s){if(a=[],We.test(r.charAt(Ki))?(i=r.charAt(Ki),Ki++):(i=s,0===rc&&sc(qe)),i!==s)for(;i!==s;)a.push(i),We.test(r.charAt(Ki))?(i=r.charAt(Ki),Ki++):(i=s,0===rc&&sc(qe));else a=s;if(a!==s)if((i=Up())!==s){if(c=Ki,(l=Ip())!==s)if((f=Up())!==s){if(b=[],We.test(r.charAt(Ki))?(p=r.charAt(Ki),Ki++):(p=s,0===rc&&sc(qe)),p!==s)for(;p!==s;)b.push(p),We.test(r.charAt(Ki))?(p=r.charAt(Ki),Ki++):(p=s,0===rc&&sc(qe));else b=s;b!==s?c=l=[l,f,b]:(Ki=c,c=s);}else Ki=c,c=s;else Ki=c,c=s;c===s&&(c=null),c!==s&&(l=Up())!==s&&(f=Op())!==s&&(b=Up())!==s?((p=nv())===s&&(p=null),p!==s?(Qi=t,v=c,d=p,e={dataType:e,length:parseInt(a.join(""),10),scale:v&&parseInt(v[2].join(""),10),parentheses:true,suffix:d},t=e):(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;}else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;else Ki=t,t=s;var v,d;if(t===s){if(t=Ki,(e=qb())===s&&(e=Vb())===s&&(e=Xb())===s&&(e=Kb())===s&&(e=Qb())===s&&(e=zb())===s&&(e=Zb())===s&&(e=Jb())===s&&(e=rp())===s&&(e=tp())===s&&(e=Wb()),e!==s){if(n=[],We.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(qe)),o!==s)for(;o!==s;)n.push(o),We.test(r.charAt(Ki))?(o=r.charAt(Ki),Ki++):(o=s,0===rc&&sc(qe));else n=s;n!==s&&(o=Up())!==s?((u=nv())===s&&(u=null),u!==s?(Qi=t,e=function(r,t,e){return {dataType:r,length:parseInt(t.join(""),10),suffix:e}}(e,n,u),t=e):(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;t===s&&(t=Ki,(e=qb())===s&&(e=Vb())===s&&(e=Xb())===s&&(e=Kb())===s&&(e=Qb())===s&&(e=zb())===s&&(e=Zb())===s&&(e=Jb())===s&&(e=rp())===s&&(e=tp())===s&&(e=Wb()),e!==s&&(n=Up())!==s?((o=nv())===s&&(o=null),o!==s&&(u=Up())!==s?(Qi=t,e=function(r,t){return {dataType:r,suffix:t}}(e,o),t=e):(Ki=t,t=s)):(Ki=t,t=s));}return t}())===s&&(t=ov())===s&&(t=function(){var t,e;t=Ki,(e=function(){var t,e,n,o;return t=Ki,"json"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(_a)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="JSON"):(Ki=t,t=s)):(Ki=t,t=s),t}())!==s&&(Qi=t,e={dataType:e});return t=e}())===s&&(t=function(){var t,e,n;t=Ki,(e=function(){var t,e,n,o;return t=Ki,"tinytext"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Na)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TINYTEXT"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"text"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Oa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="TEXT"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"mediumtext"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Ra)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MEDIUMTEXT"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"longtext"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(xa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="LONGTEXT"):(Ki=t,t=s)):(Ki=t,t=s),t}());e!==s?((n=tv())===s&&(n=null),n!==s?(Qi=t,e=Wi(e,n),t=e):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e,n;t=Ki,(e=function(){var t,e,n,o;return t=Ki,"enum"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ka)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="ENUM"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=vb());e!==s&&Up()!==s&&(n=kl())!==s?(Qi=t,o=e,(u=n).parentheses=true,t=e={dataType:o,expr:u}):(Ki=t,t=s);var o,u;return t}())===s&&(t=function(){var t,e;t=Ki,"boolean"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(Fi));e!==s&&(Qi=t,e={dataType:"BOOLEAN"});return t=e}())===s&&(t=function(){var t,e,n;t=Ki,(e=function(){var t,e,n,o;return t=Ki,"binary"===r.substr(Ki,6).toLowerCase()?(e=r.substr(Ki,6),Ki+=6):(e=s,0===rc&&sc(Bt)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="BINARY"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"varbinary"===r.substr(Ki,9).toLowerCase()?(e=r.substr(Ki,9),Ki+=9):(e=s,0===rc&&sc(va)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="VARBINARY"):(Ki=t,t=s)):(Ki=t,t=s),t}());e!==s&&Up()!==s?((n=tv())===s&&(n=null),n!==s?(Qi=t,e=Wi(e,n),t=e):(Ki=t,t=s)):(Ki=t,t=s);return t}())===s&&(t=function(){var t,e;t=Ki,"blob"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(Hi));e===s&&("tinyblob"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Yi)),e===s&&("mediumblob"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(Bi)),e===s&&("longblob"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc($i)))));e!==s&&(Qi=t,e={dataType:e.toUpperCase()});return t=e}())===s&&(t=function(){var t,e;t=Ki,(e=function(){var t,e,n,o;return t=Ki,"geometry"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Za)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="GEOMETRY"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"point"===r.substr(Ki,5).toLowerCase()?(e=r.substr(Ki,5),Ki+=5):(e=s,0===rc&&sc(Ja)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="POINT"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"linestring"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(ri)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="LINESTRING"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"polygon"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(ti)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="POLYGON"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"multipoint"===r.substr(Ki,10).toLowerCase()?(e=r.substr(Ki,10),Ki+=10):(e=s,0===rc&&sc(ei)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MULTIPOINT"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"multilinestring"===r.substr(Ki,15).toLowerCase()?(e=r.substr(Ki,15),Ki+=15):(e=s,0===rc&&sc(ni)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MULTILINESTRING"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"multipolygon"===r.substr(Ki,12).toLowerCase()?(e=r.substr(Ki,12),Ki+=12):(e=s,0===rc&&sc(oi)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="MULTIPOLYGON"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"geometrycollection"===r.substr(Ki,18).toLowerCase()?(e=r.substr(Ki,18),Ki+=18):(e=s,0===rc&&sc(si)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="GEOMETRYCOLLECTION"):(Ki=t,t=s)):(Ki=t,t=s),t}());e!==s&&(Qi=t,e={dataType:e});return t=e}()),t}function tv(){var t,e,n,o,u;if(t=Ki,Np()!==s)if(Up()!==s){if(e=[],We.test(r.charAt(Ki))?(n=r.charAt(Ki),Ki++):(n=s,0===rc&&sc(qe)),n!==s)for(;n!==s;)e.push(n),We.test(r.charAt(Ki))?(n=r.charAt(Ki),Ki++):(n=s,0===rc&&sc(qe));else e=s;e!==s&&(n=Up())!==s&&Op()!==s&&Up()!==s?((o=nv())===s&&(o=null),o!==s?(Qi=t,u=o,t={length:parseInt(e.join(""),10),parentheses:true,suffix:u}):(Ki=t,t=s)):(Ki=t,t=s);}else Ki=t,t=s;else Ki=t,t=s;return t}function ev(){var t,e,n,o,u,a,i,c,l,f,b;if(t=Ki,(e=function(){var t,e,n,o;return t=Ki,"char"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ya)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="CHAR"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(e=function(){var t,e,n,o;return t=Ki,"varchar"===r.substr(Ki,7).toLowerCase()?(e=r.substr(Ki,7),Ki+=7):(e=s,0===rc&&sc(wa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="VARCHAR"):(Ki=t,t=s)):(Ki=t,t=s),t}()),e!==s){if(n=Ki,(o=Up())!==s)if((u=Np())!==s)if((a=Up())!==s){if(i=[],We.test(r.charAt(Ki))?(c=r.charAt(Ki),Ki++):(c=s,0===rc&&sc(qe)),c!==s)for(;c!==s;)i.push(c),We.test(r.charAt(Ki))?(c=r.charAt(Ki),Ki++):(c=s,0===rc&&sc(qe));else i=s;i!==s&&(c=Up())!==s&&(l=Op())!==s&&(f=Up())!==s?("array"===r.substr(Ki,5).toLowerCase()?(b=r.substr(Ki,5),Ki+=5):(b=s,0===rc&&sc(qi)),b===s&&(b=null),b!==s?n=o=[o,u,a,i,c,l,f,b]:(Ki=n,n=s)):(Ki=n,n=s);}else Ki=n,n=s;else Ki=n,n=s;else Ki=n,n=s;n===s&&(n=null),n!==s?(Qi=t,t=e=function(r,t){const e={dataType:r};return t&&(e.length=parseInt(t[3].join(""),10),e.parentheses=true,e.suffix=t[7]&&["ARRAY"]),e}(e,n)):(Ki=t,t=s);}else Ki=t,t=s;return t}function nv(){var t,e,n;return t=Ki,(e=Df())===s&&(e=null),e!==s&&Up()!==s?((n=function(){var t,e,n,o;return t=Ki,"zerofill"===r.substr(Ki,8).toLowerCase()?(e=r.substr(Ki,8),Ki+=8):(e=s,0===rc&&sc(Aa)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="ZEROFILL"):(Ki=t,t=s)):(Ki=t,t=s),t}())===s&&(n=null),n!==s?(Qi=t,t=e=function(r,t){const e=[];return r&&e.push(r),t&&e.push(t),e}(e,n)):(Ki=t,t=s)):(Ki=t,t=s),t}function ov(){var t,e,n,o,u,a,i,c,l,f,b;return t=Ki,(e=ep())===s&&(e=np())===s&&(e=sp())===s&&(e=up())===s&&(e=function(){var t,e,n,o;return t=Ki,"year"===r.substr(Ki,4).toLowerCase()?(e=r.substr(Ki,4),Ki+=4):(e=s,0===rc&&sc(ns)),e!==s?(n=Ki,rc++,o=Lf(),rc--,o===s?n=void 0:(Ki=n,n=s),n!==s?(Qi=t,t=e="YEAR"):(Ki=t,t=s)):(Ki=t,t=s),t}()),e!==s?(n=Ki,(o=Up())!==s&&(u=Np())!==s&&(a=Up())!==s?(Vi.test(r.charAt(Ki))?(i=r.charAt(Ki),Ki++):(i=s,0===rc&&sc(Xi)),i!==s&&(c=Up())!==s&&(l=Op())!==s&&(f=Up())!==s?((b=nv())===s&&(b=null),b!==s?n=o=[o,u,a,i,c,l,f,b]:(Ki=n,n=s)):(Ki=n,n=s)):(Ki=n,n=s),n===s&&(n=null),n!==s?(Qi=t,t=e=function(r,t){const e={dataType:r};return t&&(e.length=parseInt(t[3],10),e.parentheses=true,e.suffix=t[7]),e}(e,n)):(Ki=t,t=s)):(Ki=t,t=s),t}const sv={ALTER:true,ALL:true,ADD:true,AND:true,AS:true,ASC:true,ANALYZE:true,ACCESSIBLE:true,BEFORE:true,BETWEEN:true,BIGINT:true,BLOB:true,BOTH:true,BY:true,BOOLEAN:true,CALL:true,CASCADE:true,CASE:true,CHAR:true,CHECK:true,COLLATE:true,CONDITION:true,CONSTRAINT:true,CONTINUE:true,CONVERT:true,CREATE:true,CROSS:true,CURRENT_DATE:true,CURRENT_TIME:true,CURRENT_TIMESTAMP:true,CURRENT_USER:true,CURSOR:true,DATABASE:true,DATABASES:true,DAY_HOUR:true,DAY_MICROSECOND:true,DAY_MINUTE:true,DAY_SECOND:true,DEC:true,DECIMAL:true,DECLARE:true,DEFAULT:true,DELAYED:true,DELETE:true,DESC:true,DESCRIBE:true,DETERMINISTIC:true,DISTINCT:true,DISTINCTROW:true,DIV:true,DROP:true,DOUBLE:true,DUAL:true,ELSE:true,EACH:true,ELSEIF:true,ENCLOSED:true,ESCAPED:true,EXCEPT:true,EXISTS:true,EXIT:true,EXPLAIN:true,FALSE:true,FULL:true,FROM:true,FETCH:true,FLOAT:true,FLOAT4:true,FLOAT8:true,FOR:true,FORCE:true,FOREIGN:true,FULLTEXT:true,FUNCTION:true,GENERATED:true,GET:true,GO:true,GRANT:true,GROUP:true,GROUPING:true,GROUPS:true,HAVING:true,HIGH_PRIORITY:true,HOUR_MICROSECOND:true,HOUR_MINUTE:true,HOUR_SECOND:true,IGNORE:true,IN:true,INNER:true,INFILE:true,INOUT:true,INSENSITIVE:true,INSERT:true,INTERSECT:true,INT:true,INT1:true,INT2:true,INT3:true,INT4:true,INT8:true,INTEGER:true,INTERVAL:true,INTO:true,IO_AFTER_GTIDS:true,IO_BEFORE_GTIDS:true,IS:true,ITERATE:true,JOIN:true,JSON_TABLE:true,KEY:true,KEYS:true,KILL:true,LAG:true,LAST_VALUE:true,LATERAL:true,LEAD:true,LEADING:true,LEAVE:true,LEFT:true,LIKE:true,LIMIT:true,LINEAR:true,LINES:true,LOAD:true,LOCALTIME:true,LOCALTIMESTAMP:true,LOCK:true,LONG:true,LONGBLOB:true,LONGTEXT:true,LOOP:true,LOW_PRIORITY:true,MASTER_BIND:true,MATCH:true,MAXVALUE:true,MEDIUMBLOB:true,MEDIUMINT:true,MEDIUMTEXT:true,MIDDLEINT:true,MINUTE_MICROSECOND:true,MINUTE_SECOND:true,MINUS:true,MOD:true,MODIFIES:true,NATURAL:true,NOT:true,NO_WRITE_TO_BINLOG:true,NTH_VALUE:true,NTILE:true,NULL:true,NUMERIC:true,OF:true,ON:true,OPTIMIZE:true,OPTIMIZER_COSTS:true,OPTION:true,OPTIONALLY:true,OR:true,ORDER:true,OUT:true,OUTER:true,OUTFILE:true,OVER:true,PARTITION:true,PERCENT_RANK:true,PRECISION:true,PRIMARY:true,PROCEDURE:true,PURGE:true,RANGE:true,RANK:true,READ:true,READS:true,READ_WRITE:true,REAL:true,RECURSIVE:true,REFERENCES:true,REGEXP:true,RELEASE:true,RENAME:true,REPEAT:true,REPLACE:true,REQUIRE:true,RESIGNAL:true,RESTRICT:true,RETURN:true,REVOKE:true,RIGHT:true,RLIKE:true,ROW:true,ROWS:true,ROW_NUMBER:true,SCHEMA:true,SCHEMAS:true,SELECT:true,SENSITIVE:true,SEPARATOR:true,SET:true,SHOW:true,SIGNAL:true,SMALLINT:true,SPATIAL:true,SPECIFIC:true,SQL:true,SQLEXCEPTION:true,SQLSTATE:true,SQLWARNING:true,SQL_BIG_RESULT:true,SSL:true,STARTING:true,STORED:true,STRAIGHT_JOIN:true,TABLE:true,TERMINATED:true,THEN:true,TINYBLOB:true,TINYINT:true,TINYTEXT:true,TO:true,TRAILING:true,TRIGGER:true,TRUE:true,UNION:true,UNIQUE:true,UNLOCK:true,UNSIGNED:true,UPDATE:true,USAGE:true,USE:true,USING:true,UTC_DATE:true,UTC_TIME:true,UTC_TIMESTAMP:true,VALUES:true,VARBINARY:true,VARCHAR:true,VARCHARACTER:true,VARYING:true,VIRTUAL:true,WHEN:true,WHERE:true,WHILE:true,WINDOW:true,WITH:true,WRITE:true,XOR:true,YEAR_MONTH:true,ZEROFILL:true},uv={avg:true,sum:true,count:true,convert:true,max:true,min:true,group_concat:true,std:true,variance:true,current_date:true,current_time:true,current_timestamp:true,current_user:true,user:true,session_user:true,system_user:true};function av(){return t.includeLocations?{loc:oc(Qi,Ki)}:{}}function iv(r,t){return {type:"unary_expr",operator:r,expr:t}}function cv(r,t,e){return {type:"binary_expr",operator:r,left:t,right:e,...av()}}function lv(r){const t=n(Number.MAX_SAFE_INTEGER);return !(n(r)<t)}function fv(r,t,e=3){const n=[r];for(let r=0;r<t.length;r++)delete t[r][e].tableList,delete t[r][e].columnList,n.push(t[r][e]);return n}function bv(r,t){let e=r;for(let r=0;r<t.length;r++)e=cv(t[r][1],e,t[r][3]);return e}function pv(r){const t=Cv[r];return t||(r||null)}function vv(r){const t=new Set;for(let e of r.keys()){const r=e.split("::");if(!r){t.add(e);break}r&&r[1]&&(r[1]=pv(r[1])),t.add(r.join("::"));}return Array.from(t)}function dv(r){const t=vv(r);r.clear(),t.forEach(t=>r.add(t));}let yv=[];const wv=new Set,Lv=new Set,Cv={};if((e=a())!==s&&Ki===r.length)return e;throw e!==s&&Ki<r.length&&sc({type:"end"}),uc(Ji,Zi<r.length?r.charAt(Zi):null,Zi<r.length?oc(Zi,Zi+1):oc(Zi,Zi))}};},function(r,t,e){r.exports=e(3);},function(r,t){r.exports=require$$0;},function(r,t,e){e.r(t),e.d(t,"Parser",(function(){return Ft})),e.d(t,"util",(function(){return n}));var n={};function o(r){return (o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}e.r(n),e.d(n,"arrayStructTypeToSQL",(function(){return T})),e.d(n,"autoIncrementToSQL",(function(){return N})),e.d(n,"columnOrderListToSQL",(function(){return O})),e.d(n,"commonKeywordArgsToSQL",(function(){return S})),e.d(n,"commonOptionConnector",(function(){return a})),e.d(n,"connector",(function(){return i})),e.d(n,"commonTypeValue",(function(){return h})),e.d(n,"commentToSQL",(function(){return _})),e.d(n,"createBinaryExpr",(function(){return l})),e.d(n,"createValueExpr",(function(){return c})),e.d(n,"dataTypeToSQL",(function(){return A})),e.d(n,"DEFAULT_OPT",(function(){return s})),e.d(n,"escape",(function(){return f})),e.d(n,"literalToSQL",(function(){return C})),e.d(n,"columnIdentifierToSql",(function(){return d})),e.d(n,"getParserOpt",(function(){return b})),e.d(n,"identifierToSql",(function(){return y})),e.d(n,"onPartitionsToSQL",(function(){return E})),e.d(n,"replaceParams",(function(){return m})),e.d(n,"returningToSQL",(function(){return I})),e.d(n,"hasVal",(function(){return L})),e.d(n,"setParserOpt",(function(){return p})),e.d(n,"toUpper",(function(){return w})),e.d(n,"topToSQL",(function(){return v})),e.d(n,"triggerEventToSQL",(function(){return g}));var s={database:"mysql",type:"table",trimQuery:true,parseOptions:{includeLocations:false}},u=s;function a(r,t,e){if(e)return r?"".concat(r.toUpperCase()," ").concat(t(e)):t(e)}function i(r,t){if(t)return "".concat(r.toUpperCase()," ").concat(t)}function c(r){var t=o(r);if(Array.isArray(r))return {type:"expr_list",value:r.map(c)};if(null===r)return {type:"null",value:null};switch(t){case "boolean":return {type:"bool",value:r};case "string":return {type:"string",value:r};case "number":return {type:"number",value:r};default:throw new Error('Cannot convert value "'.concat(t,'" to SQL'))}}function l(r,t,e){var n={operator:r,type:"binary_expr"};return n.left=t.type?t:c(t),"BETWEEN"===r||"NOT BETWEEN"===r?(n.right={type:"expr_list",value:[c(e[0]),c(e[1])]},n):(n.right=e.type?e:c(e),n)}function f(r){return r}function b(){return u}function p(r){u=r;}function v(r){if(r){var t=r.value,e=r.percent,n=r.parentheses?"(".concat(t,")"):t,o="TOP ".concat(n);return e?"".concat(o," ").concat(e.toUpperCase()):o}}function d(r){var t=b().database;if(r)switch(t&&t.toLowerCase()){case "athena":case "db2":case "postgresql":case "redshift":case "snowflake":case "noql":case "trino":case "sqlite":return '"'.concat(r,'"');case "transactsql":return "[".concat(r,"]");case "mysql":case "mariadb":case "bigquery":default:return "`".concat(r,"`")}}function y(r,t,e){if(true===t)return "'".concat(r,"'");if(r){if("*"===r)return r;if(e)return "".concat(e).concat(r).concat(e);var n=b().database;switch(n&&n.toLowerCase()){case "mysql":case "mariadb":return "`".concat(r,"`");case "athena":case "postgresql":case "redshift":case "snowflake":case "trino":case "noql":case "sqlite":return '"'.concat(r,'"');case "transactsql":return "[".concat(r,"]");case "bigquery":case "db2":return r;default:return "`".concat(r,"`")}}}function w(r){if(r)return r.toUpperCase()}function L(r){return r}function C(r){if(r){var t=r.prefix,e=r.type,n=r.parentheses,s=r.suffix,u=r.value,a="object"===o(r)?u:r;switch(e){case "backticks_quote_string":a="`".concat(u,"`");break;case "string":a="'".concat(u,"'");break;case "regex_string":a='r"'.concat(u,'"');break;case "hex_string":a="X'".concat(u,"'");break;case "full_hex_string":a="0x".concat(u);break;case "natural_string":a="N'".concat(u,"'");break;case "bit_string":a="b'".concat(u,"'");break;case "double_quote_string":a='"'.concat(u,'"');break;case "single_quote_string":a="'".concat(u,"'");break;case "boolean":case "bool":a=u?"TRUE":"FALSE";break;case "null":a="NULL";break;case "star":a="*";break;case "param":a="".concat(t||":").concat(u),t=null;break;case "origin":a=u.toUpperCase();break;case "date":case "datetime":case "time":case "timestamp":a="".concat(e.toUpperCase()," '").concat(u,"'");break;case "var_string":a="N'".concat(u,"'");break;case "unicode_string":a="U&'".concat(u,"'");}var i=[];return t&&i.push(w(t)),i.push(a),s&&("string"==typeof s&&i.push(s),"object"===o(s)&&(s.collate?i.push(bt(s.collate)):i.push(C(s)))),a=i.join(" "),n?"(".concat(a,")"):a}}function h(r){if(!r)return [];var t=r.type,e=r.symbol,n=r.value;return [t.toUpperCase(),e,"string"==typeof n?n.toUpperCase():C(n)].filter(L)}function m(r,t){return function r(t,e){return Object.keys(t).filter((function(r){var e=t[r];return Array.isArray(e)||"object"===o(e)&&null!==e})).forEach((function(n){var s=t[n];if("object"!==o(s)||"param"!==s.type)return r(s,e);if(void 0===e[s.value])throw new Error("no value for parameter :".concat(s.value," found"));return t[n]=c(e[s.value]),null})),t}(JSON.parse(JSON.stringify(r)),t)}function E(r){var t=r.type,e=r.partitions;return [w(t),"(".concat(e.map((function(r){if("range"!==r.type)return C(r);var t=r.start,e=r.end,n=r.symbol;return "".concat(C(t)," ").concat(w(n)," ").concat(C(e))})).join(", "),")")].join(" ")}function A(r){var t=r.schema,e=r.dataType,n=r.length,o=r.parentheses,s=r.scale,u=r.suffix,a="";null!=n&&(a=s?"".concat(n,", ").concat(s):n),o&&(a="(".concat(a,")")),u&&u.length&&(a+=" ".concat(u.join(" ")));var i=t?"".concat(t,"."):"";return "".concat(i).concat(e).concat(a)}function T(r){if(r){var t=r.dataType,e=r.definition,n=r.anglebracket,o=w(t);if("ARRAY"!==o&&"STRUCT"!==o)return o;var s=e&&e.map((function(r){return [r.field_name,T(r.field_type)].filter(L).join(" ")})).join(", ");return n?"".concat(o,"<").concat(s,">"):"".concat(o," ").concat(s)}}function _(r){if(r){var t=[],e=r.keyword,n=r.symbol,o=r.value;return t.push(e.toUpperCase()),n&&t.push(n),t.push(C(o)),t.join(" ")}}function g(r){return r.map((function(r){var t=r.keyword,e=r.args,n=[w(t)];if(e){var o=e.keyword,s=e.columns;n.push(w(o),s.map(Ct).join(", "));}return n.join(" ")})).join(" OR ")}function I(r){return r?["RETURNING",r.columns.map(gt).filter(L).join(", ")].join(" "):""}function S(r){return r?[w(r.keyword),w(r.args)]:[]}function N(r){if(r){if("string"==typeof r){var t=b().database;switch(t&&t.toLowerCase()){case "sqlite":return "AUTOINCREMENT";default:return "AUTO_INCREMENT"}}var e=r.keyword,n=r.seed,o=r.increment,s=r.parentheses,u=w(e);return s&&(u+="(".concat(C(n),", ").concat(C(o),")")),u}}function O(r){if(r)return r.map(At).filter(L).join(", ")}function R(r){return function(r){if(Array.isArray(r))return x(r)}(r)||function(r){if("undefined"!=typeof Symbol&&null!=r[Symbol.iterator]||null!=r["@@iterator"])return Array.from(r)}(r)||function(r,t){if(r){if("string"==typeof r)return x(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?x(r,t):void 0}}(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function x(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function j(r){if(!r)return [];var t=r.keyword,e=r.type;return [t.toUpperCase(),w(e)]}function k(r){if(r){var t=r.type,e=r.expr,n=r.symbol,o=t.toUpperCase(),s=[];switch(s.push(o),o){case "KEY_BLOCK_SIZE":n&&s.push(n),s.push(C(e));break;case "BTREE":case "HASH":s.length=0,s.push.apply(s,R(j(r)));break;case "WITH PARSER":s.push(e);break;case "VISIBLE":case "INVISIBLE":break;case "COMMENT":s.shift(),s.push(_(r));break;case "DATA_COMPRESSION":s.push(n,w(e.value),E(e.on));break;default:s.push(n,C(e));}return s.filter(L).join(" ")}}function U(r){return r?r.map(k):[]}function D(r){var t=r.constraint_type,e=r.index_type,n=r.index_options,o=void 0===n?[]:n,s=r.definition,u=r.on,a=r.with,i=[];if(i.push.apply(i,R(j(e))),s&&s.length){var c="CHECK"===w(t)?"(".concat(ct(s[0]),")"):"(".concat(s.map((function(r){return ct(r)})).join(", "),")");i.push(c);}return i.push(U(o).join(" ")),a&&i.push("WITH (".concat(U(a).join(", "),")")),u&&i.push("ON [".concat(u,"]")),i}function M(r){var t=r.operator||r.op,e=ct(r.right),n=false;if(Array.isArray(e)){switch(t){case "=":t="IN";break;case "!=":t="NOT IN";break;case "BETWEEN":case "NOT BETWEEN":n=true,e="".concat(e[0]," AND ").concat(e[1]);}n||(e="(".concat(e.join(", "),")"));}var o=r.right.escape||{},s=[Array.isArray(r.left)?r.left.map(ct).join(", "):ct(r.left),t,e,w(o.type),ct(o.value)].filter(L).join("."===t?"":" ");return [r.parentheses?"(".concat(s,")"):s].join(" ")}function P(r){var t=r.name,e=r.type;switch(e){case "table":case "view":var n=[y(t.db),y(t.table)].filter(L).join(".");return "".concat(w(e)," ").concat(n);case "column":return "COLUMN ".concat(Ct(t));default:return "".concat(w(e)," ").concat(C(t))}}function G(r){var t=r.keyword,e=r.expr;return [w(t),C(e)].filter(L).join(" ")}function F(r){return function(r){if(Array.isArray(r))return H(r)}(r)||function(r){if("undefined"!=typeof Symbol&&null!=r[Symbol.iterator]||null!=r["@@iterator"])return Array.from(r)}(r)||function(r,t){if(r){if("string"==typeof r)return H(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?H(r,t):void 0}}(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function H(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function Y(r){return r?[r.prefix.map(C).join(" "),ct(r.value),r.suffix.map(C).join(" ")]:[]}function B(r){return r?r.fetch||r.offset?(e=(t=r).fetch,n=t.offset,[].concat(F(Y(n)),F(Y(e))).filter(L).join(" ")):function(r){var t=r.seperator,e=r.value;return 1===e.length&&"offset"===t?i("OFFSET",ct(e[0])):i("LIMIT",e.map(ct).join("".concat("offset"===t?" ":"").concat(w(t)," ")))}(r):"";var t,e,n;}function $(r){if(r&&0!==r.length){var t=r[0].recursive?"RECURSIVE ":"",e=r.map((function(r){var t=r.name,e=r.stmt,n=r.columns,o=Array.isArray(n)?"(".concat(n.map(Ct).join(", "),")"):"",s=a("values"===e.type?"VALUES":"",ct,e);return "".concat("default"===t.type?y(t.value):C(t)).concat(o," AS (").concat(s,")")})).join(", ");return "WITH ".concat(t).concat(e)}}function W(r){if(r&&r.position){var t=r.keyword,e=r.expr,n=[],o=w(t);switch(o){case "VAR":n.push(e.map(it).join(", "));break;default:n.push(o,"string"==typeof e?y(e):ct(e));}return n.filter(L).join(" ")}}function q(r){var t=r.as_struct_val,e=r.columns,n=r.collate,o=r.distinct,s=r.for,u=r.from,c=r.for_sys_time_as_of,l=void 0===c?{}:c,f=r.locking_read,b=r.groupby,p=r.having,d=r.into,y=void 0===d?{}:d,h=r.isolation,m=r.limit,E=r.options,A=r.orderby,T=r.parentheses_symbol,_=r.qualify,g=r.top,I=r.window,S=r.with,N=r.where,O=[$(S),"SELECT",w(t)];Array.isArray(E)&&O.push(E.join(" ")),O.push(function(r){if(r){if("string"==typeof r)return r;var t=r.type,e=r.columns,n=[w(t)];return e&&n.push("(".concat(e.map(ct).join(", "),")")),n.filter(L).join(" ")}}(o),v(g),St(e,u));var R=y.position,x="";R&&(x=a("INTO",W,y)),"column"===R&&O.push(x),O.push(a("FROM",mr,u)),"from"===R&&O.push(x);var j=l||{},k=j.keyword,U=j.expr;O.push(a(k,ct,U)),O.push(a("WHERE",ct,N)),b&&(O.push(i("GROUP BY",lt(b.columns).join(", "))),O.push(lt(b.modifiers).join(", "))),O.push(a("HAVING",ct,p)),O.push(a("QUALIFY",ct,_)),O.push(a("WINDOW",ct,I)),O.push(ft(A,"order by")),O.push(bt(n)),O.push(B(m)),h&&O.push(a(h.keyword,C,h.expr)),O.push(w(f)),"end"===R&&O.push(x),O.push(function(r){if(r){var t=r.expr,e=r.keyword,n=[w(r.type),w(e)];return t?"".concat(n.join(" "),"(").concat(ct(t),")"):n.join(" ")}}(s));var D=O.filter(L).join(" ");return T?"(".concat(D,")"):D}function V(r,t){var e="undefined"!=typeof Symbol&&r[Symbol.iterator]||r["@@iterator"];if(!e){if(Array.isArray(r)||(e=function(r,t){if(r){if("string"==typeof r)return X(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?X(r,t):void 0}}(r))||t){e&&(r=e);var n=0,o=function(){};return {s:o,n:function(){return n>=r.length?{done:true}:{done:false,value:r[n++]}},e:function(r){throw r},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,u=true,a=false;return {s:function(){e=e.call(r);},n:function(){var r=e.next();return u=r.done,r},e:function(r){a=true,s=r;},f:function(){try{u||null==e.return||e.return();}finally{if(a)throw s}}}}function X(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function K(r){if(!r||0===r.length)return "";var t,e=[],n=V(r);try{for(n.s();!(t=n.n()).done;){var o=t.value,s={},u=o.value;for(var a in o)"value"!==a&&"keyword"!==a&&(s[a]=o[a]);var i=[Ct(s)],c="";u&&(c=ct(u),i.push("=",c)),e.push(i.filter(L).join(" "));}}catch(r){n.e(r);}finally{n.f();}return e.join(", ")}function Q(r){var t=r.name,e=r.value;return ["@".concat(t),"=",ct(e)].filter(L).join(" ")}function z(r){if(!r)return "";var t=r.keyword,e=r.terminated,n=r.enclosed,o=r.escaped;return [w(t),C(e),C(n),C(o)].filter(L).join(" ")}function Z(r){if(!r)return "";var t=r.keyword,e=r.starting,n=r.terminated;return [w(t),C(e),C(n)].filter(L).join(" ")}function J(r){if(!r)return "";var t=r.count,e=r.suffix;return ["IGNORE",C(t),e].filter(L).join(" ")}function rr(r){if(!r)return "";var t=r.mode,e=r.local,n=r.file,o=r.replace_ignore,s=r.table,u=r.partition,i=r.character_set,c=r.column,l=r.fields,f=r.lines,b=r.set,p=r.ignore;return ["LOAD DATA",w(t),w(e),"INFILE",C(n),w(o),"INTO TABLE",hr(s),ar(u),a("CHARACTER SET",C,i),z(l),Z(f),J(p),St(c),a("SET",K,b)].filter(L).join(" ")}function tr(r){var t=r.left,e=r.right,n=r.symbol,o=r.keyword;t.keyword=o;var s=ct(t),u=ct(e);return [s,w(n),u].filter(L).join(" ")}function er(r){var t,e,n,o,s=r.keyword,u=r.suffix,i="";switch(w(s)){case "BINLOG":e=(t=r).in,n=t.from,o=t.limit,i=[a("IN",C,e&&e.right),a("FROM",mr,n),B(o)].filter(L).join(" ");break;case "CHARACTER":case "COLLATION":i=function(r){var t=r.expr;if(t)return "LIKE"===w(t.op)?a("LIKE",C,t.right):a("WHERE",ct,t)}(r);break;case "COLUMNS":case "INDEXES":case "INDEX":i=a("FROM",mr,r.from);break;case "GRANTS":i=function(r){var t=r.for;if(t){var e=t.user,n=t.host,o=t.role_list,s="'".concat(e,"'");return n&&(s+="@'".concat(n,"'")),["FOR",s,o&&"USING",o&&o.map((function(r){return "'".concat(r,"'")})).join(", ")].filter(L).join(" ")}}(r);break;case "CREATE":i=a("",hr,r[u]);break;case "VAR":i=it(r.var),s="";}return ["SHOW",w(s),w(u),i].filter(L).join(" ")}var nr={alter:function(r){var t=r.keyword;switch(void 0===t?"table":t){case "aggregate":return function(r){var t=r.args,e=r.expr,n=r.keyword,o=r.name,s=r.type,u=t.expr,a=t.orderby;return [w(s),w(n),[[y(o.schema),y(o.name)].filter(L).join("."),"(".concat(u.map(et).join(", ")).concat(a?[" ORDER","BY",a.map(et).join(", ")].join(" "):"",")")].filter(L).join(""),tt(e)].filter(L).join(" ")}(r);case "table":return function(r){var t=r.type,e=r.table,n=r.if_exists,o=r.prefix,s=r.expr,u=void 0===s?[]:s,a=w(t),i=mr(e),c=u.map(ct);return [a,"TABLE",w(n),C(o),i,c.join(", ")].filter(L).join(" ")}(r);case "schema":return function(r){var t=r.expr,e=r.keyword,n=r.schema;return [w(r.type),w(e),y(n),tt(t)].filter(L).join(" ")}(r);case "sequence":return function(r){var t=r.type,e=r.keyword,n=r.sequence,o=r.if_exists,s=r.expr,u=void 0===s?[]:s,a=w(t),i=mr(n),c=u.map(Xr);return [a,w(e),w(o),i,c.join(", ")].filter(L).join(" ")}(r);case "domain":case "type":return function(r){var t=r.expr,e=r.keyword,n=r.name;return [w(r.type),w(e),[y(n.schema),y(n.name)].filter(L).join("."),tt(t)].filter(L).join(" ")}(r);case "function":return function(r){var t=r.args,e=r.expr,n=r.keyword,o=r.name;return [w(r.type),w(n),[[y(o.schema),y(o.name)].filter(L).join("."),t&&"(".concat(t.expr?t.expr.map(et).join(", "):"",")")].filter(L).join(""),tt(e)].filter(L).join(" ")}(r);case "view":return function(r){var t=r.type,e=r.columns,n=r.attributes,o=r.select,s=r.view,u=r.with,a=w(t),i=hr(s),c=[a,"VIEW",i];e&&c.push("(".concat(e.map(Ct).join(", "),")"));n&&c.push("WITH ".concat(n.map(w).join(", ")));c.push("AS",q(o)),u&&c.push(w(u));return c.filter(L).join(" ")}(r)}},analyze:function(r){var t=r.type,e=r.table;return [w(t),hr(e)].join(" ")},attach:function(r){var t=r.type,e=r.database,n=r.expr,o=r.as,s=r.schema;return [w(t),w(e),ct(n),w(o),y(s)].filter(L).join(" ")},create:function(r){var t=r.keyword,e="";switch(t.toLowerCase()){case "aggregate":e=function(r){var t=r.type,e=r.replace,n=r.keyword,o=r.name,s=r.args,u=r.options,a=[w(t),w(e),w(n)],i=[y(o.schema),o.name].filter(L).join("."),c="".concat(s.expr.map(et).join(", ")).concat(s.orderby?[" ORDER","BY",s.orderby.map(et).join(", ")].join(" "):"");return a.push("".concat(i,"(").concat(c,")"),"(".concat(u.map(Jr).join(", "),")")),a.filter(L).join(" ")}(r);break;case "table":e=function(r){var t=r.type,e=r.keyword,n=r.table,o=r.like,s=r.as,u=r.temporary,a=r.if_not_exists,i=r.create_definitions,c=r.table_options,l=r.ignore_replace,f=r.replace,p=r.partition_of,v=r.query_expr,d=r.unlogged,y=r.with,h=[w(t),w(f),w(u),w(d),w(e),w(a),mr(n)];if(o){var m=o.type,E=mr(o.table);return h.push(w(m),E),h.filter(L).join(" ")}if(p)return h.concat([Qr(p)]).filter(L).join(" ");i&&h.push("(".concat(i.map(Xr).join(", "),")"));if(c){var A=b().database,T=A&&"sqlite"===A.toLowerCase()?", ":" ";h.push(c.map(Er).join(T));}if(y){var _=y.map((function(r){return [C(r.keyword),w(r.symbol),C(r.value)].join(" ")})).join(", ");h.push("WITH (".concat(_,")"));}h.push(w(l),w(s)),v&&h.push(or(v));return h.filter(L).join(" ")}(r);break;case "trigger":e="constraint"===r.resource?function(r){var t=r.constraint,e=r.constraint_kw,n=r.deferrable,o=r.events,s=r.execute,u=r.for_each,a=r.from,i=r.location,c=r.keyword,l=r.or,f=r.type,b=r.table,p=r.when,v=[w(f),w(l),w(e),w(c),y(t),w(i)],d=g(o);v.push(d,"ON",hr(b)),a&&v.push("FROM",hr(a));v.push.apply(v,Wr(S(n)).concat(Wr(S(u)))),p&&v.push(w(p.type),ct(p.cond));return v.push(w(s.keyword),$r(s.expr)),v.filter(L).join(" ")}(r):function(r){var t=r.definer,e=r.for_each,n=r.keyword,o=r.execute,s=r.type,u=r.table,i=r.if_not_exists,c=r.temporary,l=r.trigger,f=r.events,b=r.order,p=r.time,v=r.when,d=[w(s),w(c),ct(t),w(n),w(i),hr(l),w(p),f.map((function(r){var t=[w(r.keyword)],e=r.args;return e&&t.push(w(e.keyword),e.columns.map(Ct).join(", ")),t.join(" ")})),"ON",hr(u),w(e&&e.keyword),w(e&&e.args),b&&"".concat(w(b.keyword)," ").concat(y(b.trigger)),a("WHEN",ct,v),w(o.prefix)];switch(o.type){case "set":d.push(a("SET",K,o.expr));break;case "multiple":d.push(sr(o.expr.ast));}return d.push(w(o.suffix)),d.filter(L).join(" ")}(r);break;case "extension":e=function(r){var t=r.extension,e=r.from,n=r.if_not_exists,o=r.keyword,s=r.schema,u=r.type,i=r.with,c=r.version;return [w(u),w(o),w(n),C(t),w(i),a("SCHEMA",C,s),a("VERSION",C,c),a("FROM",C,e)].filter(L).join(" ")}(r);break;case "function":e=function(r){var t=r.type,e=r.replace,n=r.keyword,o=r.name,s=r.args,u=r.returns,a=r.options,i=r.last,c=[w(t),w(e),w(n)],l=[C(o.schema),o.name.map(C).join(".")].filter(L).join("."),f=s.map(et).filter(L).join(", ");return c.push("".concat(l,"(").concat(f,")"),function(r){var t=r.type,e=r.keyword,n=r.expr;return [w(t),w(e),Array.isArray(n)?"(".concat(n.map(Tt).join(", "),")"):zr(n)].filter(L).join(" ")}(u),a.map(Zr).join(" "),i),c.filter(L).join(" ")}(r);break;case "index":e=function(r){var t=r.concurrently,e=r.filestream_on,n=r.keyword,o=r.if_not_exists,s=r.include,u=r.index_columns,i=r.index_type,c=r.index_using,l=r.index,f=r.on,b=r.index_options,p=r.algorithm_option,v=r.lock_option,d=r.on_kw,h=r.table,m=r.tablespace,E=r.type,A=r.where,T=r.with,_=r.with_before_where,g=T&&"WITH (".concat(U(T).join(", "),")"),I=s&&"".concat(w(s.keyword)," (").concat(s.columns.map((function(r){return "string"==typeof r?y(r):ct(r)})).join(", "),")"),S=l;l&&(S="string"==typeof l?y(l):[y(l.schema),y(l.name)].filter(L).join("."));var N=[w(E),w(i),w(n),w(o),w(t),S,w(d),hr(h)].concat(Wr(j(c)),["(".concat(O(u),")"),I,U(b).join(" "),tt(p),tt(v),a("TABLESPACE",C,m)]);_?N.push(g,a("WHERE",ct,A)):N.push(a("WHERE",ct,A),g);return N.push(a("ON",ct,f),a("FILESTREAM_ON",C,e)),N.filter(L).join(" ")}(r);break;case "sequence":e=function(r){var t=r.type,e=r.keyword,n=r.sequence,o=r.temporary,s=r.if_not_exists,u=r.create_definitions,a=[w(t),w(o),w(e),w(s),mr(n)];u&&a.push(u.map(Xr).join(" "));return a.filter(L).join(" ")}(r);break;case "database":case "schema":e=function(r){var t=r.type,e=r.keyword,n=r.replace,o=r.if_not_exists,s=r.create_definitions,u=r[e],a=u.db,i=u.schema,c=[C(a),i.map(C).join(".")].filter(L).join("."),l=[w(t),w(n),w(e),w(o),c];s&&l.push(s.map(Er).join(" "));return l.filter(L).join(" ")}(r);break;case "view":e=function(r){var t=r.algorithm,e=r.columns,n=r.definer,o=r.if_not_exists,s=r.keyword,u=r.recursive,a=r.replace,i=r.select,c=r.sql_security,l=r.temporary,f=r.type,b=r.view,p=r.with,v=r.with_options,C=b.db,m=b.schema,E=b.view,A=[y(C),y(m),y(E)].filter(L).join(".");return [w(f),w(a),w(l),w(u),t&&"ALGORITHM = ".concat(w(t)),ct(n),c&&"SQL SECURITY ".concat(w(c)),w(s),w(o),A,e&&"(".concat(e.map(d).join(", "),")"),v&&["WITH","(".concat(v.map((function(r){return h(r).join(" ")})).join(", "),")")].join(" "),"AS",or(i),w(p)].filter(L).join(" ")}(r);break;case "domain":e=function(r){var t=r.as,e=r.domain,n=r.type,o=r.keyword,s=r.target,u=r.create_definitions,a=[w(n),w(o),[y(e.schema),y(e.name)].filter(L).join("."),w(t),A(s)];if(u&&u.length>0){var i,c=[],l=function(r,t){var e="undefined"!=typeof Symbol&&r[Symbol.iterator]||r["@@iterator"];if(!e){if(Array.isArray(r)||(e=qr(r))||t){e&&(r=e);var n=0,o=function(){};return {s:o,n:function(){return n>=r.length?{done:true}:{done:false,value:r[n++]}},e:function(r){throw r},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,u=true,a=false;return {s:function(){e=e.call(r);},n:function(){var r=e.next();return u=r.done,r},e:function(r){a=true,s=r;},f:function(){try{u||null==e.return||e.return();}finally{if(a)throw s}}}}(u);try{for(l.s();!(i=l.n()).done;){var f=i.value,b=f.type;switch(b){case "collate":c.push(ct(f));break;case "default":c.push(w(b),ct(f.value));break;case "constraint":c.push(Mr(f));}}}catch(r){l.e(r);}finally{l.f();}a.push(c.filter(L).join(" "));}return a.filter(L).join(" ")}(r);break;case "type":e=function(r){var t=r.as,e=r.create_definitions,n=r.keyword,o=r.name,s=r.resource,u=[w(r.type),w(n),[y(o.schema),y(o.name)].filter(L).join("."),w(t),w(s)];if(e){var a=[];switch(s){case "enum":case "range":a.push(ct(e));break;default:a.push("(".concat(e.map(Xr).join(", "),")"));}u.push(a.filter(L).join(" "));}return u.filter(L).join(" ")}(r);break;case "user":e=function(r){var t=r.attribute,e=r.comment,n=r.default_role,o=r.if_not_exists,s=r.keyword,u=r.lock_option,i=r.password_options,c=r.require,l=r.resource_options,f=r.type,b=r.user.map((function(r){var t=r.user,e=r.auth_option,n=[jr(t)];return e&&n.push(w(e.keyword),e.auth_plugin,C(e.value)),n.filter(L).join(" ")})).join(", "),p=[w(f),w(s),w(o),b];n&&p.push(w(n.keyword),n.value.map(jr).join(", "));p.push(a(c&&c.keyword,ct,c&&c.value)),l&&p.push(w(l.keyword),l.value.map((function(r){return ct(r)})).join(" "));i&&i.forEach((function(r){return p.push(a(r.keyword,ct,r.value))}));return p.push(C(u),_(e),C(t)),p.filter(L).join(" ")}(r);break;default:throw new Error("unknown create resource ".concat(t))}return e},comment:function(r){var t=r.expr,e=r.keyword,n=r.target;return [w(r.type),w(e),P(n),G(t)].filter(L).join(" ")},select:q,deallocate:function(r){var t=r.type,e=r.keyword,n=r.expr;return [w(t),w(e),ct(n)].filter(L).join(" ")},delete:function(r){var t=r.columns,e=r.from,n=r.table,o=r.where,s=r.orderby,u=r.with,i=r.limit,c=r.returning,l=[$(u),"DELETE"],f=St(t,e);return l.push(f),Array.isArray(n)&&(1===n.length&&true===n[0].addition||l.push(mr(n))),l.push(a("FROM",mr,e)),l.push(a("WHERE",ct,o)),l.push(ft(s,"order by")),l.push(B(i)),l.push(I(c)),l.filter(L).join(" ")},exec:function(r){var t=r.keyword,e=r.module,n=r.parameters;return [w(t),hr(e),(n||[]).map(Q).filter(L).join(", ")].filter(L).join(" ")},execute:function(r){var t=r.type,e=r.name,n=r.args,o=[w(t)],s=[e];n&&s.push("(".concat(ct(n).join(", "),")"));return o.push(s.join("")),o.filter(L).join(" ")},explain:function(r){var t=r.type,e=r.expr;return [w(t),q(e)].join(" ")},for:function(r){var t=r.type,e=r.label,n=r.target,o=r.query,s=r.stmts;return [e,w(t),n,"IN",sr([o]),"LOOP",sr(s),"END LOOP",e].filter(L).join(" ")},update:function(r){var t=r.from,e=r.table,n=r.set,o=r.where,s=r.orderby,u=r.with,i=r.limit,c=r.returning;return [$(u),"UPDATE",mr(e),a("SET",K,n),a("FROM",mr,t),a("WHERE",ct,o),ft(s,"order by"),B(i),I(c)].filter(L).join(" ")},if:function(r){var t=r.boolean_expr,e=r.else_expr,n=r.elseif_expr,o=r.if_expr,s=r.prefix,u=r.go,a=r.semicolons,i=r.suffix,c=[w(r.type),ct(t),C(s),"".concat(gr(o.ast||o)).concat(a[0]),w(u)];n&&c.push(n.map((function(r){return [w(r.type),ct(r.boolean_expr),"THEN",gr(r.then.ast||r.then),r.semicolon].filter(L).join(" ")})).join(" "));e&&c.push("ELSE","".concat(gr(e.ast||e)).concat(a[1]));return c.push(C(i)),c.filter(L).join(" ")},insert:fr,load_data:rr,drop:Rr,truncate:Rr,replace:fr,declare:function(r){var t=r.type,e=r.declare,n=r.symbol,o=[w(t)],s=e.map((function(r){var t=r.at,e=r.name,n=r.as,o=r.constant,s=r.datatype,u=r.not_null,a=r.prefix,i=r.definition,c=r.keyword,l=[[t,e].filter(L).join(""),w(n),w(o)];switch(c){case "variable":l.push(ht(s),ct(r.collate),w(u)),i&&l.push(w(i.keyword),ct(i.value));break;case "cursor":l.push(w(a));break;case "table":l.push(w(a),"(".concat(i.map(Xr).join(", "),")"));}return l.filter(L).join(" ")})).join("".concat(n," "));return o.push(s),o.join(" ")},use:function(r){var t=r.type,e=r.db,n=w(t),o=y(e);return "".concat(n," ").concat(o)},rename:function(r){var t=r.type,e=r.table,n=[],o="".concat(t&&t.toUpperCase()," TABLE");if(e){var s,u=Ir(e);try{for(u.s();!(s=u.n()).done;){var a=s.value.map(hr);n.push(a.join(" TO "));}}catch(r){u.e(r);}finally{u.f();}}return "".concat(o," ").concat(n.join(", "))},call:function(r){var t=ct(r.expr);return "".concat("CALL"," ").concat(t)},desc:function(r){var t=r.type,e=r.table,n=w(t);return "".concat(n," ").concat(y(e))},set:function(r){var t=r.type,e=r.expr,n=r.keyword,o=w(t),s=e.map(ct).join(", ");return [o,w(n),s].filter(L).join(" ")},lock:xr,unlock:xr,show:er,grant:kr,revoke:kr,proc:function(r){var t=r.stmt;switch(t.type){case "assign":return tr(t);case "return":return function(r){var t=r.type,e=r.expr;return [w(t),ct(e)].join(" ")}(t)}},raise:function(r){var t=r.type,e=r.level,n=r.raise,o=r.using,s=[w(t),w(e)];n&&s.push([C(n.keyword),"format"===n.type&&n.expr.length>0&&","].filter(L).join(""),n.expr.map((function(r){return ct(r)})).join(", "));o&&s.push(w(o.type),w(o.option),o.symbol,o.expr.map((function(r){return ct(r)})).join(", "));return s.filter(L).join(" ")},transaction:function(r){var t=r.expr,e=t.action,n=t.keyword,o=t.modes,s=[C(e),w(n)];return o&&s.push(o.map(C).join(", ")),s.filter(L).join(" ")}};function or(r){if(!r)return "";for(var t=nr[r.type],e=r,n=e._parentheses,o=e._orderby,s=e._limit,u=[n&&"(",t(r)];r._next;){var a=nr[r._next.type],i=w(r.set_op);u.push(i,a(r._next)),r=r._next;}return u.push(n&&")",ft(o,"order by"),B(s)),u.filter(L).join(" ")}function sr(r){for(var t=[],e=0,n=r.length;e<n;++e){var o=r[e]&&r[e].ast?r[e].ast:r[e],s=or(o);e===n-1&&"transaction"===o.type&&(s="".concat(s," ;")),t.push(s);}return t.join(" ; ")}function ur(r){var t=r.type;return "select"===t?or(r):("values"===t?r.values:r).map((function(r){var t=ct(r);return [w(r.prefix),"(".concat(t,")")].filter(L).join("")})).join(", ")}function ar(r){if(!r)return "";var t=["PARTITION","("];if(Array.isArray(r))t.push(r.map((function(r){return y(r)})).join(", "));else {var e=r.value;t.push(e.map(ct).join(", "));}return t.push(")"),t.filter(L).join("")}function ir(r){if(!r)return "";switch(r.type){case "column":return "(".concat(r.expr.map(Ct).join(", "),")")}}function cr(r){var t=r.expr,e=r.keyword,n=t.type,o=[w(e)];switch(n){case "origin":o.push(C(t));break;case "update":o.push("UPDATE",a("SET",K,t.set),a("WHERE",ct,t.where));}return o.filter(L).join(" ")}function lr(r){if(!r)return "";var t=r.action;return [ir(r.target),cr(t)].filter(L).join(" ")}function fr(r){var t=r.table,e=r.type,n=r.or,o=void 0===n?[]:n,s=r.prefix,u=void 0===s?"into":s,i=r.columns,c=r.conflict,l=r.values,f=r.where,b=r.on_duplicate_update,p=r.partition,v=r.returning,d=r.set,y=b||{},h=y.keyword,m=y.set,E=[w(e),o.map(C).join(" "),w(u),mr(t),ar(p)];return Array.isArray(i)&&E.push("(".concat(i.map(C).join(", "),")")),E.push(a(l&&"values"===l.type?"VALUES":"",ur,l)),E.push(a("ON CONFLICT",lr,c)),E.push(a("SET",K,d)),E.push(a("WHERE",ct,f)),E.push(a(h,K,m)),E.push(I(v)),E.filter(L).join(" ")}function br(r){var t=r.expr,e=r.unit,n=r.suffix;return ["INTERVAL",ct(t),w(e),ct(n)].filter(L).join(" ")}function pr(r){return function(r){if(Array.isArray(r))return vr(r)}(r)||function(r){if("undefined"!=typeof Symbol&&null!=r[Symbol.iterator]||null!=r["@@iterator"])return Array.from(r)}(r)||function(r,t){if(r){if("string"==typeof r)return vr(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?vr(r,t):void 0}}(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function vr(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function dr(r){var t=r.type,e=r.as,n=r.expr,o=r.with_offset;return ["".concat(w(t),"(").concat(n&&ct(n)||"",")"),a("AS","string"==typeof e?y:ct,e),a(w(o&&o.keyword),y,o&&o.as)].filter(L).join(" ")}function yr(r){if(r)switch(r.type){case "pivot":case "unpivot":return function(r){var t=r.as,e=r.column,n=r.expr,o=r.in_expr,s=r.type,u=[ct(n),"FOR",Ct(e),M(o)],a=["".concat(w(s),"(").concat(u.join(" "),")")];return t&&a.push("AS",y(t)),a.join(" ")}(r);default:return ""}}function wr(r){if(r){var t=r.keyword,e=r.expr,n=r.index,o=r.index_columns,s=r.parentheses,u=r.prefix,a=[];switch(t.toLowerCase()){case "forceseek":a.push(w(t),"(".concat(y(n)),"(".concat(o.map(ct).filter(L).join(", "),"))"));break;case "spatial_window_max_cells":a.push(w(t),"=",ct(e));break;case "index":a.push(w(u),w(t),s?"(".concat(e.map((function(r){return y(r)})).join(", "),")"):"= ".concat(y(e)));break;default:a.push(ct(e));}return a.filter(L).join(" ")}}function Lr(r,t){var e=r.name,n=r.symbol;return [w(e),n,t].filter(L).join(" ")}function Cr(r){var t=[];switch(r.keyword){case "as":t.push("AS","OF",ct(r.of));break;case "from_to":t.push("FROM",ct(r.from),"TO",ct(r.to));break;case "between_and":t.push("BETWEEN",ct(r.between),"AND",ct(r.and));break;case "contained":t.push("CONTAINED","IN",ct(r.in));}return t.filter(L).join(" ")}function hr(r){if("UNNEST"===w(r.type))return dr(r);var t,e,n,o,s=r.table,u=r.db,i=r.as,c=r.expr,l=r.operator,f=r.prefix,b=r.schema,p=r.server,v=r.suffix,d=r.tablesample,m=r.temporal_table,E=r.table_hint,A=r.surround,T=void 0===A?{}:A,_=y(p,false,T.server),g=y(u,false,T.db),I=y(b,false,T.schema),S=s&&y(s,false,T.table);if(c)switch(c.type){case "values":var N=c.parentheses,O=c.values,R=c.prefix,x=[N&&"(","",N&&")"],j=ur(O);R&&(j=j.split("(").slice(1).map((function(r){return "".concat(w(R),"(").concat(r)})).join("")),x[1]="VALUES ".concat(j),S=x.filter(L).join("");break;case "tumble":S=function(r){if(!r)return "";var t=r.data,e=r.timecol,n=r.offset,o=r.size,s=[y(t.expr.db),y(t.expr.schema),y(t.expr.table)].filter(L).join("."),u="DESCRIPTOR(".concat(Ct(e.expr),")"),a=["TABLE(TUMBLE(TABLE ".concat(Lr(t,s)),Lr(e,u)],i=Lr(o,br(o.expr));return n&&n.expr?a.push(i,"".concat(Lr(n,br(n.expr)),"))")):a.push("".concat(i,"))")),a.filter(L).join(", ")}(c);break;case "generator":e=(t=c).keyword,n=t.type,o=t.generators.map((function(r){return h(r).join(" ")})).join(", "),S="".concat(w(e),"(").concat(w(n),"(").concat(o,"))");break;default:S=ct(c);}var k=[[_,g,I,S=[w(f),S,w(v)].filter(L).join(" ")].filter(L).join(".")];if(d){var U=["TABLESAMPLE",ct(d.expr),C(d.repeatable)].filter(L).join(" ");k.push(U);}k.push(function(r){if(r){var t=r.keyword,e=r.expr;return [w(t),Cr(e)].filter(L).join(" ")}}(m),a("AS","string"==typeof i?y:ct,i),yr(l)),E&&k.push(w(E.keyword),"(".concat(E.expr.map(wr).filter(L).join(", "),")"));var D=k.filter(L).join(" ");return r.parentheses?"(".concat(D,")"):D}function mr(r){if(!r)return "";if(!Array.isArray(r)){var t=r.expr,e=r.parentheses,n=r.joins,o=mr(t);if(e){for(var s=[],u=[],i=true===e?1:e.length,c=0;c++<i;)s.push("("),u.push(")");var l=n&&n.length>0?mr([""].concat(pr(n))):"";return s.join("")+o+u.join("")+l}return o}var f=r[0],b=[];if("dual"===f.type)return "DUAL";b.push(hr(f));for(var p=1;p<r.length;++p){var v=r[p],d=v.on,y=v.using,h=v.join,m=[],E=Array.isArray(v)||Object.hasOwnProperty.call(v,"joins");m.push(h?" ".concat(w(h)):","),m.push(E?mr(v):hr(v)),m.push(a("ON",ct,d)),y&&m.push("USING (".concat(y.map(C).join(", "),")")),b.push(m.filter(L).join(" "));}return b.filter(L).join("")}function Er(r){var t=r.keyword,e=r.symbol,n=r.value,o=[t.toUpperCase()];e&&o.push(e);var s=C(n);switch(t){case "partition by":case "default collate":s=ct(n);break;case "options":s="(".concat(n.map((function(r){return [r.keyword,r.symbol,ct(r.value)].join(" ")})).join(", "),")");break;case "cluster by":s=n.map(ct).join(", ");}return o.push(s),o.filter(L).join(" ")}var Ar=["analyze","attach","select","deallocate","delete","exec","update","insert","drop","rename","truncate","call","desc","use","alter","set","create","lock","unlock","declare","show","replace","if","grant","revoke","proc","raise","execute","transaction","explain","comment","load_data"];function Tr(r){var t=r&&r.ast?r.ast:r;if(!Ar.includes(t.type))throw new Error("".concat(t.type," statements not supported at the moment"))}function _r(r){return Array.isArray(r)?(r.forEach(Tr),sr(r)):(Tr(r),or(r))}function gr(r){return "go"===r.go?function r(t){if(!t||0===t.length)return "";var e=[_r(t.ast)];return t.go_next&&e.push(t.go.toUpperCase(),r(t.go_next)),e.filter((function(r){return r})).join(" ")}(r):_r(r)}function Ir(r,t){var e="undefined"!=typeof Symbol&&r[Symbol.iterator]||r["@@iterator"];if(!e){if(Array.isArray(r)||(e=Nr(r))||t){e&&(r=e);var n=0,o=function(){};return {s:o,n:function(){return n>=r.length?{done:true}:{done:false,value:r[n++]}},e:function(r){throw r},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,u=true,a=false;return {s:function(){e=e.call(r);},n:function(){var r=e.next();return u=r.done,r},e:function(r){a=true,s=r;},f:function(){try{u||null==e.return||e.return();}finally{if(a)throw s}}}}function Sr(r){return function(r){if(Array.isArray(r))return Or(r)}(r)||function(r){if("undefined"!=typeof Symbol&&null!=r[Symbol.iterator]||null!=r["@@iterator"])return Array.from(r)}(r)||Nr(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Nr(r,t){if(r){if("string"==typeof r)return Or(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?Or(r,t):void 0}}function Or(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function Rr(r){var t=r.type,e=r.keyword,n=r.name,o=r.prefix,s=r.suffix,u=[w(t),w(e),w(o)];switch(e){case "table":u.push(mr(n));break;case "trigger":u.push([n[0].schema?"".concat(y(n[0].schema),"."):"",y(n[0].trigger)].filter(L).join(""));break;case "database":case "schema":case "procedure":u.push(y(n));break;case "view":u.push(mr(n),r.options&&r.options.map(ct).filter(L).join(" "));break;case "index":u.push.apply(u,[Ct(n)].concat(Sr(r.table?["ON",hr(r.table)]:[]),[r.options&&r.options.map(ct).filter(L).join(" ")]));break;case "type":u.push(n.map(Ct).join(", "),r.options&&r.options.map(ct).filter(L).join(" "));}return s&&u.push(s.map(ct).filter(L).join(" ")),u.filter(L).join(" ")}function xr(r){var t=r.type,e=r.keyword,n=r.tables,o=[t.toUpperCase(),w(e)];if("UNLOCK"===t.toUpperCase())return o.join(" ");var s,u=[],a=Ir(n);try{var i=function(){var r=s.value,t=r.table,e=r.lock_type,n=[hr(t)];if(e){n.push(["prefix","type","suffix"].map((function(r){return w(e[r])})).filter(L).join(" "));}u.push(n.join(" "));};for(a.s();!(s=a.n()).done;)i();}catch(r){a.e(r);}finally{a.f();}return o.push.apply(o,[u.join(", ")].concat(Sr(function(r){var t=r.lock_mode,e=r.nowait,n=[];if(t){var o=t.mode;n.push(o.toUpperCase());}return e&&n.push(e.toUpperCase()),n}(r)))),o.filter(L).join(" ")}function jr(r){var t=r.name,e=r.host,n=[C(t)];return e&&n.push("@",C(e)),n.join("")}function kr(r){var t=r.type,e=r.grant_option_for,n=r.keyword,o=r.objects,s=r.on,u=r.to_from,a=r.user_or_roles,i=r.with,c=[w(t),C(e)],l=o.map((function(r){var t=r.priv,e=r.columns,n=[ct(t)];return e&&n.push("(".concat(e.map(Ct).join(", "),")")),n.join(" ")})).join(", ");if(c.push(l),s)switch(c.push("ON"),n){case "priv":c.push(C(s.object_type),s.priv_level.map((function(r){return [y(r.prefix),y(r.name)].filter(L).join(".")})).join(", "));break;case "proxy":c.push(jr(s));}return c.push(w(u),a.map(jr).join(", ")),c.push(C(i)),c.filter(L).join(" ")}function Ur(r){return function(r){if(Array.isArray(r))return Dr(r)}(r)||function(r){if("undefined"!=typeof Symbol&&null!=r[Symbol.iterator]||null!=r["@@iterator"])return Array.from(r)}(r)||function(r,t){if(r){if("string"==typeof r)return Dr(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?Dr(r,t):void 0}}(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Dr(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function Mr(r){if(r){var t=r.constraint,e=r.constraint_type,n=r.enforced,o=r.index,s=r.keyword,u=r.reference_definition,i=r.for,c=r.with_values,l=[],f=b().database;l.push(w(s)),l.push(y(t));var p=w(e);return "sqlite"===f.toLowerCase()&&"UNIQUE KEY"===p&&(p="UNIQUE"),l.push(p),l.push("sqlite"!==f.toLowerCase()&&y(o)),l.push.apply(l,Ur(D(r))),l.push.apply(l,Ur(mt(u))),l.push(w(n)),l.push(a("FOR",y,i)),l.push(C(c)),l.filter(L).join(" ")}}function Pr(r){if(r){var t=r.type;return "rows"===t?[w(t),ct(r.expr)].filter(L).join(" "):ct(r)}}function Gr(r){if("string"==typeof r)return r;var t=r.window_specification;return "(".concat(function(r){var t=r.name,e=r.partitionby,n=r.orderby,o=r.window_frame_clause;return [t,ft(e,"partition by"),ft(n,"order by"),Pr(o)].filter(L).join(" ")}(t),")")}function Fr(r){var t=r.name,e=r.as_window_specification;return "".concat(t," AS ").concat(Gr(e))}function Hr(r){if(r){var t=r.as_window_specification,e=r.expr,n=r.keyword,o=r.type,s=r.parentheses,u=w(o);if("WINDOW"===u)return "OVER ".concat(Gr(t));if("ON UPDATE"===u){var a="".concat(w(o)," ").concat(w(n)),i=ct(e)||[];return s&&(a="".concat(a,"(").concat(i.join(", "),")")),a}if(r.partitionby)return ["OVER","(".concat(ft(r.partitionby,"partition by")),"".concat(ft(r.orderby,"order by"),")")].filter(L).join(" ");throw new Error("unknown over type")}}function Yr(r){if(!r||!r.array)return "";var t=r.array.keyword;if(t)return w(t);for(var e=r.array,n=e.dimension,o=e.length,s=[],u=0;u<n;u++)s.push("["),o&&o[u]&&s.push(C(o[u])),s.push("]");return s.join("")}function Br(r){for(var t=r.target,e=r.expr,n=r.keyword,o=r.symbol,s=r.as,u=r.offset,a=r.parentheses,i=wt({expr:e,offset:u}),c=[],l=0,f=t.length;l<f;++l){var b=t[l],p=b.angle_brackets,v=b.length,d=b.dataType,h=b.parentheses,m=b.quoted,E=b.scale,A=b.suffix,T=b.expr,_=T?ct(T):"";null!=v&&(_=E?"".concat(v,", ").concat(E):v),h&&(_="(".concat(_,")")),p&&(_="<".concat(_,">")),A&&A.length&&(_+=" ".concat(A.map(C).join(" ")));var g="::",I="",S=[];"as"===o&&(0===l&&(i="".concat(w(n),"(").concat(i)),I=")",g=" ".concat(o.toUpperCase()," ")),0===l&&S.push(i);var N=Yr(b);S.push(g,m,d,m,N,_,I),c.push(S.filter(L).join(""));}s&&c.push(" AS ".concat(y(s)));var O=c.filter(L).join("");return a?"(".concat(O,")"):O}function $r(r){var t=r.args,e=r.array_index,n=r.name,o=r.args_parentheses,s=r.parentheses,u=r.within_group,a=r.over,i=r.suffix,c=Hr(a),l=function(r){if(!r)return "";var t=r.type,e=r.keyword,n=r.orderby;return [w(t),w(e),"(".concat(ft(n,"order by"),")")].filter(L).join(" ")}(u),f=ct(i),b=[C(n.schema),n.name.map(C).join(".")].filter(L).join(".");if(!t)return [b,l,c].filter(L).join(" ");var p=r.separator||", ";"TRIM"===w(b)&&(p=" ");var v=[b];v.push(false===o?" ":"(");var d=ct(t);if(Array.isArray(p)){for(var y=d[0],h=1,m=d.length;h<m;++h)y=[y,d[h]].join(" ".concat(ct(p[h-1])," "));v.push(y);}else v.push(d.join(p));return  false!==o&&v.push(")"),v.push(Lt(e)),v=[v.join(""),f].filter(L).join(" "),[s?"(".concat(v,")"):v,l,c].filter(L).join(" ")}function Wr(r){return function(r){if(Array.isArray(r))return Vr(r)}(r)||function(r){if("undefined"!=typeof Symbol&&null!=r[Symbol.iterator]||null!=r["@@iterator"])return Array.from(r)}(r)||qr(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function qr(r,t){if(r){if("string"==typeof r)return Vr(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?Vr(r,t):void 0}}function Vr(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function Xr(r){if(!r)return [];var t,e,n,o,s=r.resource;switch(s){case "column":return Tt(r);case "index":return e=[],n=(t=r).keyword,o=t.index,e.push(w(n)),e.push(o),e.push.apply(e,R(D(t))),e.filter(L).join(" ");case "constraint":return Mr(r);case "sequence":return [w(r.prefix),ct(r.value)].filter(L).join(" ");default:throw new Error("unknown resource = ".concat(s," type"))}}function Kr(r){var t=[];switch(r.keyword){case "from":t.push("FROM","(".concat(C(r.from),")"),"TO","(".concat(C(r.to),")"));break;case "in":t.push("IN","(".concat(ct(r.in),")"));break;case "with":t.push("WITH","(MODULUS ".concat(C(r.modulus),", REMAINDER ").concat(C(r.remainder),")"));}return t.filter(L).join(" ")}function Qr(r){var t=r.keyword,e=r.table,n=r.for_values,o=r.tablespace,s=[w(t),hr(e),w(n.keyword),Kr(n.expr)];return o&&s.push("TABLESPACE",C(o)),s.filter(L).join(" ")}function zr(r){return r.dataType?A(r):[y(r.db),y(r.schema),y(r.table)].filter(L).join(".")}function Zr(r){var t=r.type;switch(t){case "as":return [w(t),r.symbol,or(r.declare),w(r.begin),sr(r.expr),w(r.end),r.symbol].filter(L).join(" ");case "set":return [w(t),r.parameter,w(r.value&&r.value.prefix),r.value&&r.value.expr.map(ct).join(", ")].filter(L).join(" ");case "return":return [w(t),ct(r.expr)].filter(L).join(" ");default:return ct(r)}}function Jr(r){var t=r.type,e=r.symbol,n=r.value,o=[w(t),e];switch(w(t)){case "SFUNC":o.push([y(n.schema),n.name].filter(L).join("."));break;case "STYPE":case "MSTYPE":o.push(A(n));break;default:o.push(ct(n));}return o.filter(L).join(" ")}function rt(r,t){switch(r){case "add":var e=t.map((function(r){var t=r.name,e=r.value;return ["PARTITION",C(t),"VALUES",w(e.type),"(".concat(C(e.expr),")")].join(" ")})).join(", ");return "(".concat(e,")");default:return St(t)}}function tt(r){if(!r)return "";var t=r.action,e=r.create_definitions,n=r.if_not_exists,o=r.keyword,s=r.if_exists,u=r.old_column,a=r.prefix,i=r.resource,c=r.symbol,l=r.suffix,f="",b=[];switch(i){case "column":b=[Tt(r)];break;case "index":b=D(r),f=r[i];break;case "table":case "schema":f=y(r[i]);break;case "aggregate":case "function":case "domain":case "type":f=y(r[i]);break;case "algorithm":case "lock":case "table-option":f=[c,w(r[i])].filter(L).join(" ");break;case "constraint":f=y(r[i]),b=[Xr(e)];break;case "partition":b=[rt(t,r.partitions)];break;case "key":f=y(r[i]);break;default:f=[c,r[i]].filter((function(r){return null!==r})).join(" ");}var p=[w(t),w(o),w(n),w(s),u&&Ct(u),w(a),f&&f.trim(),b.filter(L).join(" ")];return l&&p.push(w(l.keyword),l.expr&&Ct(l.expr)),p.filter(L).join(" ")}function et(r){var t=r.default&&[w(r.default.keyword),ct(r.default.value)].join(" ");return [w(r.mode),r.name,A(r.type),t].filter(L).join(" ")}function nt(r){return (nt="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}function ot(r){var t=r.expr_list;switch(w(r.type)){case "STRUCT":case "ROW":return "(".concat(St(t),")");case "ARRAY":return function(r){var t=r.array_path,e=r.brackets,n=r.expr_list,o=r.parentheses;if(!n)return "[".concat(St(t),"]");var s=Array.isArray(n)?n.map((function(r){return "(".concat(St(r),")")})).filter(L).join(", "):ct(n);return e?"[".concat(s,"]"):o?"(".concat(s,")"):s}(r);default:return ""}}function st(r){var t=r.definition,e=[w(r.keyword)];return t&&"object"===nt(t)&&(e.length=0,e.push(T(t))),e.push(ot(r)),e.filter(L).join("")}function ut(r){return (ut="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}var at={alter:tt,aggr_func:function(r){var t=r.args,e=r.filter,n=r.over,o=r.within_group_orderby,s=ct(t.expr);s=Array.isArray(s)?s.join(", "):s;var u=r.name,a=Hr(n);t.distinct&&(s=["DISTINCT",s].join(" ")),t.separator&&t.separator.delimiter&&(s=[s,C(t.separator.delimiter)].join("".concat(t.separator.symbol," "))),t.separator&&t.separator.expr&&(s=[s,ct(t.separator.expr)].join(" ")),t.orderby&&(s=[s,ft(t.orderby,"order by")].join(" ")),t.separator&&t.separator.value&&(s=[s,w(t.separator.keyword),C(t.separator.value)].filter(L).join(" "));var i=o?"WITHIN GROUP (".concat(ft(o,"order by"),")"):"",c=e?"FILTER (WHERE ".concat(ct(e.where),")"):"";return ["".concat(u,"(").concat(s,")"),i,a,c].filter(L).join(" ")},any_value:function(r){var t=r.args,e=r.type,n=r.over,o=t.expr,s=t.having,u="".concat(w(e),"(").concat(ct(o));return s&&(u="".concat(u," HAVING ").concat(w(s.prefix)," ").concat(ct(s.expr))),[u="".concat(u,")"),Hr(n)].filter(L).join(" ")},window_func:function(r){var t=r.over;return [function(r){var t=r.args,e=r.name,n=r.consider_nulls,o=void 0===n?"":n,s=r.separator,u=void 0===s?", ":s;return [e,"(",t?ct(t).join(u):"",")",o&&" ",o].filter(L).join("")}(r),Hr(t)].filter(L).join(" ")},array:st,assign:tr,binary_expr:M,case:function(r){var t=["CASE"],e=r.args,n=r.expr,o=r.parentheses;n&&t.push(ct(n));for(var s=0,u=e.length;s<u;++s)t.push(e[s].type.toUpperCase()),e[s].cond&&(t.push(ct(e[s].cond)),t.push("THEN")),t.push(ct(e[s].result));return t.push("END"),o?"(".concat(t.join(" "),")"):t.join(" ")},cast:Br,collate:bt,column_ref:Ct,column_definition:Tt,datatype:A,extract:function(r){var t=r.args,e=r.type,n=t.field,o=t.cast_type,s=t.source,u=["".concat(w(e),"(").concat(w(n)),"FROM",w(o),ct(s)];return "".concat(u.filter(L).join(" "),")")},flatten:function(r){var t=r.args,e=r.type,n=["input","path","outer","recursive","mode"].map((function(r){return function(r){if(!r)return "";var t=r.type,e=r.symbol,n=r.value;return [w(t),e,ct(n)].filter(L).join(" ")}(t[r])})).filter(L).join(", ");return "".concat(w(e),"(").concat(n,")")},fulltext_search:function(r){var t=r.against,e=r.as,n=r.columns,o=r.match,s=r.mode,u=[w(o),"(".concat(n.map((function(r){return Ct(r)})).join(", "),")")].join(" "),a=[w(t),["(",ct(r.expr),s&&" ".concat(C(s)),")"].filter(L).join("")].join(" ");return [u,a,_t(e)].filter(L).join(" ")},function:$r,lambda:function(r){var t=r.args,e=r.expr,n=t.value,o=t.parentheses,s=n.map(ct).join(", ");return [o?"(".concat(s,")"):s,"->",ct(e)].join(" ")},load_data:rr,insert:or,interval:br,json:function(r){var t=r.keyword,e=r.expr_list;return [w(t),e.map((function(r){return ct(r)})).join(", ")].join(" ")},json_object_arg:function(r){var t=r.expr,e=t.key,n=t.value,o=t.on,s=[ct(e),"VALUE",ct(n)];return o&&s.push("ON","NULL",ct(o)),s.filter(L).join(" ")},json_visitor:function(r){return [r.symbol,ct(r.expr)].join("")},func_arg:function(r){var t=r.value;return [t.name,t.symbol,ct(t.expr)].filter(L).join(" ")},show:er,struct:st,tablefunc:function(r){var t=r.as,e=r.name,n=r.args,o=[C(e.schema),e.name.map(C).join(".")].filter(L).join(".");return ["".concat(o,"(").concat(ct(n).join(", "),")"),"AS",$r(t)].join(" ")},tables:mr,unnest:dr,values:ur,window:function(r){return r.expr.map(Fr).join(", ")}};function it(r){var t=r.prefix,e=void 0===t?"@":t,n=r.name,o=r.members,s=r.quoted,u=r.suffix,a=[],i=o&&o.length>0?"".concat(n,".").concat(o.join(".")):n,c="".concat(e||"").concat(i);return u&&(c+=u),a.push(c),[s,a.join(" "),s].filter(L).join("")}function ct(r){if(r){var t=r;if(r.ast){var e=t.ast;Reflect.deleteProperty(t,e);for(var n=0,o=Object.keys(e);n<o.length;n++){var s=o[n];t[s]=e[s];}}var u=t.type;return "expr"===u?ct(t.expr):at[u]?at[u](t):C(t)}}function lt(r){return r?(Array.isArray(r)||(r=[r]),r.map(ct)):[]}function ft(r,t){if(!Array.isArray(r))return "";var e=[],n=w(t);switch(n){case "ORDER BY":e=r.map((function(r){return [ct(r.expr),r.type||"ASC",w(r.nulls)].filter(L).join(" ")}));break;case "PARTITION BY":default:e=r.map((function(r){return ct(r.expr)}));}return i(n,e.join(", "))}function bt(r){if(r){var t=r.keyword,e=r.collate,n=e.name,o=e.symbol,s=e.value,u=[w(t)];return s||u.push(o),u.push(Array.isArray(n)?n.map(C).join("."):C(n)),s&&u.push(o),u.push(ct(s)),u.filter(L).join(" ")}}function pt(r){return (pt="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}function vt(r){return function(r){if(Array.isArray(r))return yt(r)}(r)||function(r){if("undefined"!=typeof Symbol&&null!=r[Symbol.iterator]||null!=r["@@iterator"])return Array.from(r)}(r)||dt(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function dt(r,t){if(r){if("string"==typeof r)return yt(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?yt(r,t):void 0}}function yt(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function wt(r,t){if("string"==typeof r)return y(r,t);var e=r.expr,n=r.offset,o=r.suffix,s=n&&n.map((function(r){return ["[",r.name,"".concat(r.name?"(":""),C(r.value),"".concat(r.name?")":""),"]"].filter(L).join("")})).join("");return [ct(e),s,o].filter(L).join("")}function Lt(r){if(!r||0===r.length)return "";var t,e=[],n=function(r,t){var e="undefined"!=typeof Symbol&&r[Symbol.iterator]||r["@@iterator"];if(!e){if(Array.isArray(r)||(e=dt(r))||t){e&&(r=e);var n=0,o=function(){};return {s:o,n:function(){return n>=r.length?{done:true}:{done:false,value:r[n++]}},e:function(r){throw r},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,u=true,a=false;return {s:function(){e=e.call(r);},n:function(){var r=e.next();return u=r.done,r},e:function(r){a=true,s=r;},f:function(){try{u||null==e.return||e.return();}finally{if(a)throw s}}}}(r);try{for(n.s();!(t=n.n()).done;){var o=t.value,s=o.brackets?"[".concat(ct(o.index),"]"):"".concat(o.notation).concat(ct(o.index));o.property&&(s="".concat(s,".").concat(C(o.property))),e.push(s);}}catch(r){n.e(r);}finally{n.f();}return e.join("")}function Ct(r){var t=r.array_index,e=r.as,n=r.column,o=r.collate,s=r.db,u=r.isDual,i=r.notations,c=void 0===i?[]:i,l=r.options,f=r.schema,b=r.table,p=r.parentheses,v=r.suffix,d=r.order_by,C=r.subFields,h=void 0===C?[]:C,m="*"===n?"*":wt(n,u),E=[s,f,b].filter(L).map((function(r){return "".concat("string"==typeof r?y(r):ct(r))})),A=E[0];if(A){for(var T=1;T<E.length;++T)A="".concat(A).concat(c[T]||".").concat(E[T]);m="".concat(A).concat(c[T]||".").concat(m);}var _=[m=["".concat(m).concat(Lt(t))].concat(vt(h)).join("."),bt(o),ct(l),a("AS",ct,e)];_.push("string"==typeof v?w(v):ct(v)),_.push(w(d));var g=_.filter(L).join(" ");return p?"(".concat(g,")"):g}function ht(r){if(r){var t=r.schema,e=r.dataType,n=r.length,o=r.suffix,s=r.scale,u=r.expr,a=A({schema:t,dataType:e,length:n,suffix:o,scale:s,parentheses:null!=n});if(u&&(a+=ct(u)),r.array){var i=Yr(r);a+=[/^\[.*\]$/.test(i)?"":" ",i].join("");}return a}}function mt(r){var t=[];if(!r)return t;var e=r.definition,n=r.keyword,o=r.match,s=r.table,u=r.on_action;return t.push(w(n)),t.push(mr(s)),t.push(e&&"(".concat(e.map((function(r){return ct(r)})).join(", "),")")),t.push(w(o)),u.map((function(r){return t.push(w(r.type),ct(r.value))})),t.filter(L)}function Et(r){var t=[],e=r.nullable,n=r.character_set,o=r.check,s=r.comment,u=r.constraint,i=r.collate,c=r.storage,l=r.using,f=r.default_val,p=r.generated,v=r.auto_increment,d=r.unique,y=r.primary_key,m=r.column_format,E=r.reference_definition,A=r.generated_by_default,T=[w(e&&e.action),w(e&&e.value)].filter(L).join(" ");if(p||t.push(T),f){var g=f.type,I=f.value;t.push(g.toUpperCase(),ct(I));}var S=b().database;return u&&t.push(w(u.keyword),C(u.constraint)),t.push(Mr(o)),t.push(function(r){if(r)return [w(r.value),"(".concat(ct(r.expr),")"),w(r.storage_type)].filter(L).join(" ")}(p)),p&&t.push(T),t.push(N(v),w(y),w(d),C(A),_(s)),t.push.apply(t,vt(h(n))),"sqlite"!==S.toLowerCase()&&t.push(ct(i)),t.push.apply(t,vt(h(m))),t.push.apply(t,vt(h(c))),t.push.apply(t,vt(mt(E))),t.push(a("USING",ct,l)),t.filter(L).join(" ")}function At(r){var t=r.column,e=r.collate,n=r.nulls,o=r.opclass,s=r.order_by,u="string"==typeof t?{type:"column_ref",table:r.table,column:t}:r;return u.collate=null,[ct(u),ct(e),o,w(s),w(n)].filter(L).join(" ")}function Tt(r){var t=[],e=Ct(r.column),n=ht(r.definition);return t.push(e),t.push(n),t.push(Et(r)),t.filter(L).join(" ")}function _t(r){return r?"object"===pt(r)?["AS",ct(r)].join(" "):["AS",/^(`?)[a-z_][0-9a-z_]*(`?)$/i.test(r)?y(r):d(r)].join(" "):""}function gt(r,t){var e=r.expr,n=r.type;if("cast"===n)return Br(r);t&&(e.isDual=t);var o=ct(e),s=r.expr_list;if(s){var u=[o],a=s.map((function(r){return gt(r,t)})).join(", ");return u.push([w(n),n&&"(",a,n&&")"].filter(L).join("")),u.filter(L).join(" ")}return e.parentheses&&Reflect.has(e,"array_index")&&"cast"!==e.type&&(o="(".concat(o,")")),e.array_index&&"column_ref"!==e.type&&"function"!==e.type&&(o="".concat(o).concat(Lt(e.array_index))),[o,_t(r.as)].filter(L).join(" ")}function It(r){var t=Array.isArray(r)&&r[0];return !(!t||"dual"!==t.type)}function St(r,t){if(!r||"*"===r)return r;var e=It(t);return r.map((function(r){return gt(r,e)})).join(", ")}at.var=it,at.expr_list=function(r){var t=lt(r.value),e=r.parentheses,n=r.separator;if(!e&&!n)return t;var o=n||", ",s=t.join(o);return e?"(".concat(s,")"):s},at.select=function(r){var t="object"===ut(r._next)?or(r):q(r);return r.parentheses?"(".concat(t,")"):t},at.unary_expr=function(r){var t=r.operator,e=r.parentheses,n=r.expr,o="-"===t||"+"===t||"~"===t||"!"===t?"":" ",s="".concat(t).concat(o).concat(ct(n));return e?"(".concat(s,")"):s},at.map_object=function(r){var t=r.keyword,e=r.expr.map((function(r){return [C(r.key),C(r.value)].join(", ")})).join(", ");return [w(t),"[".concat(e,"]")].join("")};var Nt=e(0);function Ot(r){return (Ot="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}var Rt,xt,jt,kt=(Rt={},xt="mysql",jt=Nt.parse,(xt=function(r){var t=function(r,t){if("object"!=Ot(r)||!r)return r;var e=r[Symbol.toPrimitive];if(void 0!==e){var n=e.call(r,t);if("object"!=Ot(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return ("string"===t?String:Number)(r)}(r,"string");return "symbol"==Ot(t)?t:t+""}(xt))in Rt?Object.defineProperty(Rt,xt,{value:jt,enumerable:true,configurable:true,writable:true}):Rt[xt]=jt,Rt);function Ut(r){return (Ut="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}function Dt(r,t){var e="undefined"!=typeof Symbol&&r[Symbol.iterator]||r["@@iterator"];if(!e){if(Array.isArray(r)||(e=function(r,t){if(r){if("string"==typeof r)return Mt(r,t);var e={}.toString.call(r).slice(8,-1);return "Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?Mt(r,t):void 0}}(r))||t){e&&(r=e);var n=0,o=function(){};return {s:o,n:function(){return n>=r.length?{done:true}:{done:false,value:r[n++]}},e:function(r){throw r},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,u=true,a=false;return {s:function(){e=e.call(r);},n:function(){var r=e.next();return u=r.done,r},e:function(r){a=true,s=r;},f:function(){try{u||null==e.return||e.return();}finally{if(a)throw s}}}}function Mt(r,t){(null==t||t>r.length)&&(t=r.length);for(var e=0,n=Array(t);e<t;e++)n[e]=r[e];return n}function Pt(r,t){for(var e=0;e<t.length;e++){var n=t[e];n.enumerable=n.enumerable||false,n.configurable=true,"value"in n&&(n.writable=true),Object.defineProperty(r,Gt(n.key),n);}}function Gt(r){var t=function(r,t){if("object"!=Ut(r)||!r)return r;var e=r[Symbol.toPrimitive];if(void 0!==e){var n=e.call(r,t);if("object"!=Ut(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return (String)(r)}(r,"string");return "symbol"==Ut(t)?t:t+""}var Ft=function(){return function(r,t,e){return t&&Pt(r.prototype,t),Object.defineProperty(r,"prototype",{writable:false}),r}((function r(){!function(r,t){if(!(r instanceof t))throw new TypeError("Cannot call a class as a function")}(this,r);}),[{key:"astify",value:function(r){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:s,e=this.parse(r,t);return e&&e.ast}},{key:"sqlify",value:function(r){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:s;return p(t),gr(r)}},{key:"exprToSQL",value:function(r){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:s;return p(t),ct(r)}},{key:"columnsToSQL",value:function(r,t){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:s;if(p(e),!r||"*"===r)return [];var n=It(t);return r.map((function(r){return gt(r,n)}))}},{key:"parse",value:function(r){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:s,e=t.database,n=void 0===e?"mysql":e;p(t);var o=n.toLowerCase();if(kt[o])return kt[o](false===t.trimQuery?r:r.trim(),t.parseOptions||s.parseOptions);throw new Error("".concat(n," is not supported currently"))}},{key:"whiteListCheck",value:function(r,t){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:s;if(t&&0!==t.length){var n=e.type,o=void 0===n?"table":n;if(!this["".concat(o,"List")]||"function"!=typeof this["".concat(o,"List")])throw new Error("".concat(o," is not valid check mode"));var u,a=this["".concat(o,"List")].bind(this),i=a(r,e),c=true,l="",f=Dt(i);try{for(f.s();!(u=f.n()).done;){var b,p=u.value,v=!1,d=Dt(t);try{for(d.s();!(b=d.n()).done;){var y=b.value,w=new RegExp("^".concat(y,"$"),"i");if(w.test(p)){v=!0;break}}}catch(r){d.e(r);}finally{d.f();}if(!v){l=p,c=!1;break}}}catch(r){f.e(r);}finally{f.f();}if(!c)throw new Error("authority = '".concat(l,"' is required in ").concat(o," whiteList to execute SQL = '").concat(r,"'"))}}},{key:"tableList",value:function(r,t){var e=this.parse(r,t);return e&&e.tableList}},{key:"columnList",value:function(r,t){var e=this.parse(r,t);return e&&e.columnList}}])}();function Ht(r){return (Ht="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(r){return typeof r}:function(r){return r&&"function"==typeof Symbol&&r.constructor===Symbol&&r!==Symbol.prototype?"symbol":typeof r})(r)}"object"===("undefined"==typeof self?"undefined":Ht(self))&&self&&(self.NodeSQLParser={Parser:Ft,util:n}),"undefined"==typeof commonjsGlobal&&"object"===("undefined"==typeof window?"undefined":Ht(window))&&window&&(window.global=window),"object"===("undefined"==typeof commonjsGlobal?"undefined":Ht(commonjsGlobal))&&commonjsGlobal&&commonjsGlobal.window&&(commonjsGlobal.window.NodeSQLParser={Parser:Ft,util:n});}]));
		
	} (mysql));
	return mysql;
}

var mysqlExports = requireMysql();

const TYPE_MAP = {
    S: 'string',
    N: 'number',
    B: 'buffer',
};
const sleep$1 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getTableInfo$1(params) {
    const { dynamodb, table } = params;
    let data;
    try {
        data = await dynamodb.getTable(table);
    }
    catch (err) {
        shared.logger.error('getTableInfo: err:', err, table);
        throw err;
    }
    if (!data || !data.Table) {
        throw new Error('bad_data');
    }
    const column_list = data.Table.AttributeDefinitions.map((def) => ({
        name: def.AttributeName,
        type: TYPE_MAP[def.AttributeType],
    }));
    const primary_key = data.Table.KeySchema.map((key) => {
        const type = column_list.find((col) => col.name === key.AttributeName).type;
        return { name: key.AttributeName, type };
    });
    return { table, primary_key, column_list, is_open: true };
}
async function getTableList$2(params) {
    const { dynamodb } = params;
    try {
        return await dynamodb.getTableList();
    }
    catch (err) {
        shared.logger.error('raw_engine.getTableList: err:', err);
        throw err;
    }
}
async function createTable$2(params) {
    const { dynamodb, table, primary_key, ...other } = params;
    const column_list = params.column_list.filter((column) => primary_key.find((key) => key.name === column.name));
    const opts = { ...other, table, primary_key, column_list };
    try {
        await dynamodb.createTable(opts);
        await _waitForTable({ dynamodb, table });
    }
    catch (err) {
        if (err?.message === 'resource_in_use') {
            throw new SQLError('table_exists');
        }
        shared.logger.error('raw_engine.createTable: err:', err);
        throw err;
    }
}
async function dropTable$2(params) {
    const { dynamodb, table } = params;
    try {
        await dynamodb.deleteTable(table);
    }
    catch (delete_err) {
        if (delete_err?.code === 'ResourceNotFoundException') {
            throw new SQLError('table_not_found');
        }
        shared.logger.error('raw_engine.dropTable: deleteTable err:', delete_err);
        throw delete_err;
    }
    try {
        await _waitForTable({ dynamodb, table });
    }
    catch (wait_err) {
        if (wait_err?.message === 'resource_not_found') {
            return;
        }
        shared.logger.error('raw_engine.dropTable: waitForTable err:', wait_err);
        throw wait_err;
    }
}
async function addColumn$1(_params) { }
async function createIndex$1(params) {
    const { dynamodb, table, index_name, key_list } = params;
    const opts = { table, index_name, key_list };
    try {
        await dynamodb.createIndex(opts);
        await _waitForTable({ dynamodb, table, index_name });
    }
    catch (err) {
        if (err?.message === 'resource_in_use' ||
            err?.message?.indexOf?.('already exists') >= 0) {
            throw new Error('index_exists');
        }
        shared.logger.error('raw_engine.createIndex: err:', err);
        throw err;
    }
}
async function deleteIndex$1(params) {
    const { dynamodb, table, index_name } = params;
    try {
        await dynamodb.deleteIndex({ table, index_name });
        await _waitForTable({ dynamodb, table, index_name });
    }
    catch (err) {
        if (err?.message === 'resource_not_found') {
            throw new Error('index_not_found');
        }
        shared.logger.error('raw_engine.deleteIndex: err:', err);
        throw err;
    }
}
async function _waitForTable(params) {
    const { dynamodb, table, index_name } = params;
    const LOOP_MS = 500;
    while (true) {
        const result = await dynamodb.getTable(table);
        const status = result?.Table?.TableStatus;
        if (status === 'CREATING' ||
            status === 'UPDATING' ||
            status === 'DELETING') {
            await sleep$1(LOOP_MS);
            continue;
        }
        if (index_name) {
            const index = result?.Table?.GlobalSecondaryIndexes?.find?.((item) => item.IndexName === index_name);
            if (index && index.IndexStatus !== 'ACTIVE') {
                await sleep$1(LOOP_MS);
                continue;
            }
        }
        return;
    }
}

const YEAR_MULT = 10000;
const MONTH_MULT = 100;
const DAY_MULT = 1;
const HOUR_MULT = 10000;
const MINUTE_MULT = 100;
const DATE_TIME_MULT = 10000;
class SQLDateTime {
    _time;
    _fraction = 0;
    _fractionText = '';
    _type;
    _decimals;
    _date = null;
    constructor(time_arg, type, decimals) {
        this._time = Math.floor(time_arg?.time ?? time_arg);
        if (time_arg?.fraction !== undefined) {
            this._fraction = time_arg.fraction;
        }
        else if (typeof time_arg === 'number') {
            this._fraction = parseFloat('0.' + (String(time_arg).split('.')[1] || '').slice(0, 6).padEnd(6, '0'));
        }
        else {
            this._fraction = 0;
        }
        this._type = type || 'datetime';
        if (type === 'date') {
            this._decimals = 0;
            this._time -= this._time % (24 * 60 * 60);
            this._fraction = 0;
        }
        else {
            this._decimals = decimals ?? (this._fraction ? 6 : 0);
            this._fraction = parseFloat(this._fraction.toFixed(this._decimals));
            let fd = 0;
            if (this._fraction >= 1.0) {
                this._fraction = 0;
                this._time += this._time < 0 ? -1 : 1;
            }
            else {
                fd = this._fraction;
            }
            if (this._decimals > 0) {
                this._fractionText =
                    '.' + fd.toFixed(this._decimals).slice(-this._decimals);
            }
        }
    }
    _makeDate() {
        if (!this._date) {
            this._date = new Date(Math.floor(this._time * 1000));
        }
    }
    getType() {
        return this._type;
    }
    getTime() {
        return this._time;
    }
    getFraction() {
        return this._fraction;
    }
    getDecimals() {
        return this._decimals;
    }
    toString() {
        let ret;
        this._makeDate();
        if (isNaN(this._date)) {
            ret = '';
        }
        else {
            ret = this._date.toISOString().replace('T', ' ');
            if (this._type === 'date') {
                ret = ret.slice(0, 10);
            }
            else {
                ret = ret.replace(/\..*/, '');
                if (this._decimals > 0) {
                    ret = ret + this._fractionText;
                }
            }
        }
        return ret;
    }
    dateFormat(format) {
        let ret;
        this._makeDate();
        if (isNaN(this._date)) {
            ret = '';
        }
        else {
            ret = _dateFormat(this._date, format);
        }
        return ret;
    }
    toDate() {
        this._makeDate();
        return this._date;
    }
    toNumber() {
        let ret = 0;
        this._makeDate();
        ret += this._date.getUTCFullYear() * YEAR_MULT;
        ret += (this._date.getUTCMonth() + 1) * MONTH_MULT;
        ret += this._date.getUTCDate() * DAY_MULT;
        if (this._type === 'datetime') {
            ret = ret * DATE_TIME_MULT;
            ret += this._date.getUTCHours() * HOUR_MULT;
            ret += this._date.getUTCMinutes() * MINUTE_MULT;
            ret += this._date.getUTCSeconds();
            if (this._decimals > 0) {
                ret += this._fraction;
            }
        }
        return ret;
    }
}
function createSQLDateTime(arg, type, decimals) {
    let ret;
    if (arg instanceof SQLDateTime) {
        if (arg.getType() === type && arg.getDecimals() === decimals) {
            ret = arg;
        }
        else {
            const opts = { time: arg.getTime(), fraction: arg.getFraction() };
            ret = new SQLDateTime(opts, type ?? arg.getType(), decimals ?? arg.getDecimals());
        }
    }
    else {
        const time = arg?.time ?? arg;
        if (isNaN(time)) {
            ret = null;
        }
        else if (time >= 253402300800) {
            ret = null;
        }
        else if (time <= -62167219201) {
            ret = null;
        }
        else {
            ret = new SQLDateTime(arg, type, decimals);
        }
    }
    return ret;
}
function createDateTime(arg, type, decimals) {
    return createSQLDateTime(arg, type, decimals);
}
const FORMAT_LONG_NUMBER = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
});
const FORMAT_SHORT_NUMBER = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3,
    hour12: false,
});
const FORMAT_LONG_NUMBER_12H = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: true,
});
const FORMAT_SHORT_NUMBER_12H = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3,
    hour12: true,
});
const FORMAT_LONG_TEXT = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
});
const FORMAT_SHORT_TEXT = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
});
function _dateFormat(date, format) {
    const format_map = new Map();
    function _getPart(formatter, type) {
        let cached = format_map.get(formatter);
        if (!cached) {
            cached = formatter.formatToParts(date);
            format_map.set(formatter, cached);
        }
        const found = cached.find((part) => part.type === type);
        return found?.value || '';
    }
    function _time(formatter) {
        return (_getPart(formatter, 'hour') +
            ':' +
            _getPart(formatter, 'minute') +
            ':' +
            _getPart(formatter, 'second'));
    }
    return format.replace(/%(.)/g, (_ignore, part) => {
        let ret = part;
        let day;
        switch (part) {
            case '%':
                ret = '%';
                break;
            case 'a':
                ret = _getPart(FORMAT_SHORT_NUMBER, 'weekday');
                break;
            case 'b':
                ret = _getPart(FORMAT_SHORT_TEXT, 'month');
                break;
            case 'c':
                ret = _getPart(FORMAT_SHORT_NUMBER, 'month');
                break;
            case 'D':
                day = date.getDate();
                ret = day + _nthNumber(day);
                break;
            case 'd':
                ret = _getPart(FORMAT_LONG_NUMBER, 'day');
                break;
            case 'e':
                ret = _getPart(FORMAT_SHORT_NUMBER, 'day');
                break;
            case 'f':
                ret = _getPart(FORMAT_LONG_NUMBER, 'fractionalSecond');
                break;
            case 'H':
                ret = _getPart(FORMAT_LONG_NUMBER, 'hour');
                break;
            case 'h':
            case 'I':
                ret = _getPart(FORMAT_LONG_NUMBER_12H, 'hour');
                break;
            case 'i':
                ret = _getPart(FORMAT_LONG_NUMBER, 'minutes');
                break;
            case 'j':
                //ret = _getPart(, 'dayOfYear');
                break;
            case 'k':
                ret = _getPart(FORMAT_SHORT_NUMBER, 'hour');
                break;
            case 'l':
                ret = _getPart(FORMAT_SHORT_NUMBER_12H, 'hour');
                break;
            case 'M':
                ret = _getPart(FORMAT_LONG_TEXT, 'month');
                break;
            case 'm':
                ret = _getPart(FORMAT_LONG_NUMBER, 'month');
                break;
            case 'p':
                ret = _getPart(FORMAT_SHORT_NUMBER_12H, 'dayPeriod');
                break;
            case 'r':
                ret =
                    _time(FORMAT_LONG_NUMBER_12H) +
                        _getPart(FORMAT_LONG_NUMBER_12H, 'dayPeriod');
                break;
            case 'S':
                ret = _getPart(FORMAT_LONG_NUMBER, 'seconds');
                break;
            case 's':
                ret = _getPart(FORMAT_LONG_NUMBER, 'seconds');
                break;
            case 'T':
                ret = _time(FORMAT_LONG_NUMBER);
                break;
            case 'U':
                //ret = _getPart(, 'week');
                break;
            case 'u':
                //ret = _getPart(, 'week');
                break;
            case 'V':
                //ret = _getPart(, 'week');
                break;
            case 'v':
                //ret = _getPart(, 'week');
                break;
            case 'W':
                ret = _getPart(FORMAT_LONG_NUMBER, 'weekday');
                break;
            case 'w':
                ret = String(date.getDay());
                break;
            case 'X':
                ret = _getPart(FORMAT_LONG_NUMBER, 'year');
                break;
            case 'x':
                ret = _getPart(FORMAT_LONG_NUMBER, 'year');
                break;
            case 'Y':
                ret = _getPart(FORMAT_LONG_NUMBER, 'year');
                break;
            case 'y':
                ret = _getPart(FORMAT_SHORT_NUMBER, 'year');
                break;
        }
        return ret;
    });
}
function _nthNumber(number) {
    let ret = '';
    if (number > 3 && number < 21) {
        ret = 'th';
    }
    else {
        const temp = number % 10;
        if (temp === 1) {
            ret = 'st';
        }
        else if (temp === 2) {
            ret = 'nd';
        }
        else if (temp === 3) {
            ret = 'rd';
        }
        else {
            ret = 'th';
        }
    }
    return ret;
}

const MINUTE$1 = 60;
const HOUR$1 = MINUTE$1 * 60;
const DAY$2 = 24 * HOUR$1;
class SQLTime {
    _time;
    _decimals;
    constructor(time, decimals) {
        this._time = time;
        this._decimals = decimals || 0;
    }
    getType() {
        return 'time';
    }
    getTime() {
        return this._time;
    }
    getFraction() {
        return 0;
    }
    getDecimals() {
        return this._decimals;
    }
    toString() {
        let ret;
        if (isNaN(this._time)) {
            ret = '';
        }
        else {
            let seconds = this._time;
            const neg = seconds < 0 ? '-' : '';
            if (neg) {
                seconds = -seconds;
            }
            const hours = Math.floor(seconds / HOUR$1);
            seconds -= hours * HOUR$1;
            const minutes = Math.floor(seconds / MINUTE$1);
            seconds -= minutes * MINUTE$1;
            const ret_secs = (seconds < 10 ? '0' : '') + seconds.toFixed(this._decimals);
            ret = `${neg}${_pad(hours)}:${_pad(minutes)}:${ret_secs}`;
        }
        return ret;
    }
    toSQLDateTime(decimals) {
        const now = Date.now() / 1000;
        const time = now - (now % DAY$2) + this._time;
        return createDateTime(time, 'datetime', decimals ?? this._decimals);
    }
    toNumber() {
        let seconds = this._time;
        const hours = Math.floor(seconds / HOUR$1);
        seconds -= hours * HOUR$1;
        const minutes = Math.floor(seconds / MINUTE$1);
        seconds -= minutes * MINUTE$1;
        return hours * 10000 + minutes * 100 + seconds;
    }
}
function createSQLTime(time, decimals) {
    let ret;
    if (isNaN(time)) {
        ret = null;
    }
    else {
        ret = new SQLTime(time, decimals);
    }
    return ret;
}
function _pad(num) {
    return (num < 10 ? '0' : '') + num;
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY$1 = 24 * HOUR;
function convertNum(value) {
    let ret = value;
    if (value === null) {
        ret = null;
    }
    else if (value === '') {
        ret = 0;
    }
    else if (typeof value === 'string') {
        ret = parseFloat(value);
        if (isNaN(ret)) {
            ret = 0;
        }
    }
    else if (value?.toNumber) {
        ret = value.toNumber();
    }
    return ret;
}
function convertBooleanValue(value) {
    let ret;
    if (value === null) {
        ret = null;
    }
    else if (typeof value === 'number') {
        ret = value ? 1 : 0;
    }
    else {
        ret = convertNum(value) ? 1 : 0;
    }
    return ret;
}
const SEP = `[-^\\][!@#$%&*()_+={}\\|/\\\\<>,.:;"']+`;
const DATE_RS = `^([0-9]{1,4})${SEP}([0-2]?[0-9])${SEP}([0-3]?[0-9])`;
const DEC_RS = `(\\.[0-9]{1,6})?`;
const DIGIT_RS = `(${SEP}([0-5]?[0-9]))?`;
const DT_RS = `${DATE_RS}(\\s+|T)([0-2]?[0-9])${DIGIT_RS}${DIGIT_RS}${DEC_RS}`;
const DATE4_RS = `^([0-9]{4})([0-1][0-9])([0-3][0-9])`;
const DATETIME4_RS = `${DATE4_RS}([0-2][0-9])([0-5][0-9])(([0-5][0-9])${DEC_RS})?`;
const DATE2_RS = `^([0-9]{2})([0-1][0-9])([0-3][0-9])`;
const DATETIME2_RS = `${DATE2_RS}([0-2][0-9])([0-5][0-9])(([0-5][0-9])${DEC_RS})?`;
const DATE_REGEX = new RegExp(DATE_RS + '$');
const DATETIME_REGEX = new RegExp(DT_RS);
const DATE4_REGEX = new RegExp(DATE4_RS);
const DATETIME4_REGEX = new RegExp(DATETIME4_RS);
const DATE2_REGEX = new RegExp(DATE2_RS);
const DATETIME2_REGEX = new RegExp(DATETIME2_RS);
function convertDateTime(value, type, decimals) {
    let ret;
    if (value === null) {
        ret = null;
    }
    else if (value instanceof SQLDateTime) {
        ret = createSQLDateTime(value, type, decimals);
    }
    else if (value instanceof SQLTime) {
        ret = value.toSQLDateTime(decimals);
    }
    else if (typeof value === 'string') {
        let time = _stringToDateTime(value);
        if (time === undefined) {
            time = _stringToDate(value);
            if (!type) {
                type = 'date';
            }
        }
        if (time === undefined) {
            time = _numToDateTime(value);
        }
        if (time === undefined) {
            ret = null;
        }
        else {
            ret = createSQLDateTime(time, type ?? 'datetime', decimals);
        }
    }
    else if (typeof value === 'number') {
        const time = _numToDateTime(value);
        if (time === undefined) {
            ret = null;
        }
        else {
            ret = createSQLDateTime(time, type, decimals);
        }
    }
    return ret;
}
const DAY_TIME_REGEX = /^(-)?([0-9]+)\s+([0-9]*)(:([0-9]{1,2}))?(:([0-9]{1,2}))?(\.[0-9]+)?/;
const TIME_REGEX = /^(-)?([0-9]*):([0-9]{1,2})(:([0-9]{1,2}))?(\.[0-9]+)?/;
function convertTime(value, decimals) {
    let ret;
    if (value instanceof SQLTime) {
        ret = value;
    }
    else if (typeof value === 'string') {
        let time = _stringToTime(value);
        if (time === undefined) {
            const result = _stringToDateTime(value);
            if (result !== undefined) {
                time = (result.time % DAY$1) + (result.fraction || 0);
            }
        }
        if (time === undefined) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                time = _numToTime(num);
            }
        }
        if (time === undefined) {
            ret = null;
        }
        else {
            ret = createSQLTime(time, decimals);
        }
    }
    else if (typeof value === 'number') {
        const time = _numToTime(value);
        ret = createSQLTime(time, decimals);
    }
    return ret;
}
function _stringToTime(value) {
    let ret;
    value = value.trim();
    let match = value.match(DAY_TIME_REGEX);
    if (match) {
        const negative = match[1];
        const days = parseInt(match[2]);
        const hours = parseInt(match[3]);
        const mins = parseInt(match[5] || '0');
        const secs = parseInt(match[7] || '0');
        const fraction = parseFloat('0' + match[8]);
        ret = days * DAY$1 + hours * HOUR + mins * MINUTE + secs + fraction;
        if (negative) {
            ret = -ret;
        }
    }
    if (ret === undefined) {
        match = value.match(TIME_REGEX);
        if (match) {
            const negative = match[1];
            const hours = parseInt(match[2]);
            const mins = parseInt(match[3] || '0');
            const secs = parseInt(match[5] || '0');
            const fraction = parseFloat('0' + match[6]);
            ret = hours * HOUR + mins * MINUTE + secs + fraction;
            if (negative) {
                ret = -ret;
            }
        }
    }
    return ret;
}
function _stringToDate(value) {
    let ret;
    const match = value.trim().match(DATE_REGEX);
    if (match) {
        const year = _fix2year(match[1]);
        const month = match[2];
        const day = match[3];
        ret = _partsToTime(year, month, day, 0, 0, 0);
    }
    return ret;
}
function _stringToDateTime(value) {
    let ret;
    const match = value.trim().match(DATETIME_REGEX);
    if (match) {
        const year = _fix2year(match[1]);
        const month = match[2];
        const day = match[3];
        const hour = match[5];
        const min = match[7] || '0';
        const sec = match[9] || '0';
        const fraction = parseFloat('0' + match[10]);
        ret = _partsToTime(year, month, day, hour, min, sec, fraction);
    }
    return ret;
}
function _numToDateTime(number) {
    let ret;
    const s = String(number);
    let match = s.match(DATETIME4_REGEX);
    if (match) {
        const year = match[1];
        const month = match[2];
        const day = match[3];
        const hour = match[4];
        const min = match[5];
        const sec = match[7] || '0';
        const fraction = parseFloat('0' + match[8]);
        ret = _partsToTime(year, month, day, hour, min, sec, fraction);
    }
    if (ret === undefined) {
        match = s.match(DATETIME2_REGEX);
        if (match) {
            const year = _fix2year(match[1]);
            const month = match[2];
            const day = match[3];
            const hour = match[4];
            const min = match[5];
            const sec = match[7] || '0';
            const fraction = parseFloat('0' + match[8]);
            ret = _partsToTime(year, month, day, hour, min, sec, fraction);
        }
    }
    if (ret === undefined) {
        match = s.match(DATE4_REGEX);
        if (match) {
            const year = match[1];
            const month = match[2];
            const day = match[3];
            ret = _partsToTime(year, month, day, 0, 0, 0);
        }
    }
    if (ret === undefined) {
        match = s.match(DATE2_REGEX);
        if (match) {
            const year = _fix2year(match[1]);
            const month = match[2];
            const day = match[3];
            ret = _partsToTime(year, month, day, 0, 0, 0);
        }
    }
    return ret;
}
function _numToTime(number) {
    const hours = Math.floor(number / 10000);
    number -= hours * 10000;
    const minutes = Math.floor(number / 100);
    number -= minutes * 100;
    return hours * HOUR + minutes * MINUTE + number;
}
function getDecimals(value, max) {
    let ret = 0;
    if (typeof value === 'number') {
        ret = String(value).split('.')?.[1]?.length || 0;
    }
    else if (typeof value === 'string') {
        ret = value.split('.')?.[1]?.length || 0;
    }
    {
        ret = Math.min(max, ret);
    }
    return ret;
}
function _pad2(num) {
    return String(num).padStart(2, '0');
}
function _pad4(num) {
    return String(num).padStart(4, '0');
}
function _fix2year(num) {
    let ret = num;
    if (num?.length <= 2) {
        ret = parseInt(num);
        if (num >= 0 && num <= 69) {
            ret += 2000;
        }
        else if (num >= 70 && num <= 99) {
            ret += 1900;
        }
    }
    return ret;
}
function _partsToTime(year, month, day, hour, min, sec, fraction) {
    const iso = `${_pad4(year)}-${_pad2(month)}-${_pad2(day)}T${_pad2(hour)}:${_pad2(min)}:${_pad2(sec)}Z`;
    const time = Date.parse(iso);
    let ret;
    if (!isNaN(time)) {
        ret = { time: time / 1000, fraction };
    }
    return ret;
}

function sum(expr, state) {
    const { row, ...other } = state;
    const group = row?.['@@group'] || [{}];
    let err = null;
    let value = 0;
    let name = 'SUM(';
    group.forEach((group_row, i) => {
        const groupState = { ...other, row: group_row };
        const result = getValue(expr.args?.expr, groupState);
        if (i === 0) {
            name += result.name;
        }
        if (!err && result.err) {
            err = result.err;
        }
        else if (result.value === null) {
            value = null;
        }
        else if (value !== null) {
            value += convertNum(result.value);
        }
    });
    name += ')';
    return { err, value, type: 'number', name };
}
const methods$6 = { sum };

function _isDateOrTimeLike(type) {
    return type === 'date' || type === 'datetime' || type === 'time';
}
function _isDateLike(type) {
    return type === 'date' || type === 'datetime';
}
function _numBothSides(expr, state, op, allow_interval) {
    const left = getValue(expr.left, state);
    const right = getValue(expr.right, state);
    let err = left.err || right.err;
    const name = left.name + op + right.name;
    let value;
    let left_num;
    let right_num;
    let interval;
    let datetime;
    if (!err) {
        if (left.value === null || right.value === null) {
            value = null;
        }
        else if (allow_interval && left.type === 'interval') {
            interval = left.value;
            if (_isDateOrTimeLike(right.type)) {
                datetime = right.value;
            }
            else if (typeof right.value === 'string') {
                datetime = convertDateTime(left.value);
                if (!datetime) {
                    value = null;
                }
            }
            else {
                value = null;
            }
        }
        else if (allow_interval && right.type === 'interval') {
            interval = right.value;
            if (_isDateOrTimeLike(left.type)) {
                datetime = left.value;
            }
            else if (typeof left.value === 'string') {
                datetime = convertDateTime(left.value);
                if (!datetime) {
                    value = null;
                }
            }
            else {
                value = null;
            }
        }
        else if (right.type === 'interval' || left.type === 'interval') {
            err = 'bad_interval_usage';
        }
        else {
            left_num = convertNum(left.value);
            right_num = convertNum(right.value);
            if (left_num === null || right_num === null) {
                value = null;
            }
        }
    }
    return { err, name, value, left_num, right_num, interval, datetime };
}
function plus$1(expr, state) {
    const result = _numBothSides(expr, state, ' + ', true);
    const { err, name, left_num, right_num, interval, datetime } = result;
    let value = result.value;
    let type;
    if (!err && value !== null) {
        if (datetime && interval) {
            const result = interval.add(datetime);
            value = result.value;
            type = result.type;
        }
        else {
            value = left_num + right_num;
            type = 'number';
        }
    }
    return { err, value, type, name };
}
function minus$2(expr, state) {
    const result = _numBothSides(expr, state, ' - ', true);
    const { err, name, left_num, right_num, interval, datetime } = result;
    let value = result.value;
    let type;
    if (!err && value !== null) {
        if (datetime && interval) {
            const result = interval.sub(datetime);
            value = result.value;
            type = result.type;
        }
        else {
            value = left_num - right_num;
            type = 'number';
        }
    }
    return { err, value, type, name };
}
function mul(expr, state) {
    const result = _numBothSides(expr, state, ' * ');
    const { err, name, left_num, right_num } = result;
    let value = result.value;
    if (!err && value !== null) {
        value = left_num * right_num;
    }
    return { err, value, name };
}
function div(expr, state) {
    const result = _numBothSides(expr, state, ' / ');
    const { err, name, left_num, right_num } = result;
    let value = result.value;
    if (!err && value !== null) {
        value = left_num / right_num;
    }
    return { err, value, name };
}
function _convertCompare(left, right) {
    if (left.value !== null &&
        right.value !== null &&
        left.value !== right.value) {
        if ((_isDateLike(left.type ?? '') || _isDateLike(right.type ?? '')) &&
            left.type !== right.type) {
            const union = _unionDateTime(left.type ?? '', right.type ?? '');
            if (union === 'date' || union === 'datetime') {
                left.value = convertDateTime(left.value, union, 6) ?? left.value;
                right.value = convertDateTime(right.value, union, 6) ?? right.value;
            }
        }
        if (typeof left.value === 'number' ||
            typeof right.value === 'number' ||
            left.type === 'number' ||
            right.type === 'number') {
            left.value = convertNum(left.value);
            right.value = convertNum(right.value);
        }
        else {
            if (typeof left.value !== 'string') {
                left.value = String(left.value);
            }
            if (typeof right.value !== 'string') {
                right.value = String(right.value);
            }
        }
    }
}
function _equal$1(expr, state, op) {
    const left = getValue(expr.left, state);
    const right = getValue(expr.right, state);
    const err = left.err || right.err;
    const name = (left.name ?? '') + op + (right.name ?? '');
    let value = 0;
    if (!err) {
        _convertCompare(left, right);
        if (left.value === null || right.value === null) {
            value = null;
        }
        else if (left.value === right.value) {
            value = 1;
        }
        else if (typeof left.value === 'string' &&
            typeof right.value === 'string') {
            value = left.value.localeCompare(right.value) === 0 ? 1 : 0;
        }
    }
    return { err, value, name };
}
function equal$1(expr, state) {
    return _equal$1(expr, state, ' = ');
}
function notEqual$1(expr, state) {
    const ret = _equal$1(expr, state, ' != ');
    if (ret.value !== null) {
        ret.value = ret.value ? 0 : 1;
    }
    return ret;
}
function _gt$1(expr_left, expr_right, state, op, flip) {
    const left = getValue(expr_left, state);
    const right = getValue(expr_right, state);
    const err = left.err || right.err;
    const name = flip
        ? (right.name ?? '') + op + (left.name ?? '')
        : (left.name ?? '') + op + (right.name ?? '');
    let value = 0;
    if (!err) {
        _convertCompare(left, right);
        if (left.value === null || right.value === null) {
            value = null;
        }
        else if (left.value === right.value) {
            value = 0;
        }
        else if (typeof left.value === 'number' &&
            typeof right.value === 'number') {
            value = left.value > right.value ? 1 : 0;
        }
        else if (typeof left.value === 'string' &&
            typeof right.value === 'string') {
            value = left.value.localeCompare(right.value) > 0 ? 1 : 0;
        }
    }
    return { err, value, name };
}
function gt$1(expr, state) {
    return _gt$1(expr.left, expr.right, state, ' > ', false);
}
function lt$1(expr, state) {
    return _gt$1(expr.right, expr.left, state, ' < ', true);
}
function _gte$1(expr_left, expr_right, state, op, flip) {
    const left = getValue(expr_left, state);
    const right = getValue(expr_right, state);
    const err = left.err || right.err;
    const name = flip
        ? (right.name ?? '') + op + (left.name ?? '')
        : (left.name ?? '') + op + (right.name ?? '');
    let value = 0;
    if (!err) {
        _convertCompare(left, right);
        if (left.value === null || right.value === null) {
            value = null;
        }
        else if (left.value === right.value) {
            value = 1;
        }
        else if (typeof left.value === 'number' &&
            typeof right.value === 'number') {
            value = convertNum(left.value) >= convertNum(right.value) ? 1 : 0;
        }
        else if (typeof left.value === 'string' &&
            typeof right.value === 'string') {
            value = left.value.localeCompare(right.value) >= 0 ? 1 : 0;
        }
    }
    return { err, value, name };
}
function gte$1(expr, state) {
    return _gte$1(expr.left, expr.right, state, ' >= ', false);
}
function lte$1(expr, state) {
    return _gte$1(expr.right, expr.left, state, ' <= ', true);
}
function and$1(expr, state) {
    const left = getValue(expr.left, state);
    let err = left.err;
    let name = left.name + ' AND ';
    let value = 0;
    if (!err) {
        value = convertBooleanValue(left.value);
        if (value !== 0) {
            const right = getValue(expr.right, state);
            err = right.err;
            value = convertBooleanValue(right.value) && value;
            name = left.name + ' AND ' + right.name;
        }
    }
    return { err, value, name };
}
function or$1(expr, state) {
    const left = getValue(expr.left, state);
    let err = left.err;
    let name = left.name + ' OR ';
    let value = 1;
    if (!err) {
        value = convertBooleanValue(left.value);
        if (!value) {
            const right = getValue(expr.right, state);
            err = right.err;
            const result = convertBooleanValue(right.value);
            if (result) {
                value = 1;
            }
            else if (value !== null) {
                value = result;
            }
            name = left.name + ' OR ' + right.name;
        }
    }
    return { err, value, name };
}
function xor(expr, state) {
    const left = getValue(expr.left, state);
    const right = getValue(expr.right, state);
    const err = left.err || right.err;
    const name = left.name + ' XOR ' + right.name;
    let value = 1;
    if (!err) {
        const right_bool = convertBooleanValue(right.value);
        const left_bool = convertBooleanValue(left.value);
        if (right_bool === null || left_bool === null) {
            value = null;
        }
        else {
            value = right_bool ^ left_bool;
        }
    }
    return { err, value, name };
}
function is$1(expr, state) {
    return _is$1(expr, state, 'IS');
}
function isNot$1(expr, state) {
    const result = _is$1(expr, state, 'IS NOT');
    result.value = result.value ? 0 : 1;
    return result;
}
function _is$1(expr, state, op) {
    const result = getValue(expr.left, state);
    const rightExpr = expr.right;
    let right;
    let right_name;
    // Type guard: check if rightExpr is a Value type
    if (typeof rightExpr === 'object' &&
        rightExpr &&
        'value' in rightExpr &&
        !('type' in rightExpr && rightExpr.type === 'expr_list')) {
        if (rightExpr.value === null) {
            right = null;
            right_name = 'NULL';
        }
        else if (rightExpr.value === true) {
            right = true;
            right_name = 'TRUE';
        }
        else if (rightExpr.value === false) {
            right = false;
            right_name = 'FALSE';
        }
        else if (!result.err) {
            result.err = { err: 'syntax_err', args: [op] };
        }
    }
    else if (!result.err) {
        result.err = { err: 'syntax_err', args: [op] };
    }
    result.name = `${result.name} ${op} ${right_name}`;
    if (!result.err) {
        if (right === null) {
            result.value = right === result.value ? 1 : 0;
        }
        else if (right && result.value) {
            result.value = 1;
        }
        else if (!right && !result.value) {
            result.value = 1;
        }
        else {
            result.value = 0;
        }
    }
    return result;
}
function _unionDateTime(type1, type2) {
    let ret;
    if (type1 === 'string') {
        ret = 'datetime';
    }
    else if (type2 === 'string') {
        ret = 'datetime';
    }
    else if (type1 === 'time' || type2 === 'time') {
        ret = 'datetime';
    }
    else if (_isDateLike(type1) && _isDateLike(type2)) {
        ret = 'datetime';
    }
    return ret;
}
const methods$5 = {
    '+': plus$1,
    '-': minus$2,
    '*': mul,
    '/': div,
    '=': equal$1,
    '!=': notEqual$1,
    '<>': notEqual$1,
    '>': gt$1,
    '<': lt$1,
    '>=': gte$1,
    '<=': lte$1,
    and: and$1,
    or: or$1,
    xor,
    is: is$1,
    'is not': isNot$1,
};

function datetime(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = `CAST(${result.name} AS DATETIME)`;
    result.type = 'datetime';
    if (!result.err && result.value !== null) {
        const target = Array.isArray(expr.target)
            ? expr.target[0]
            : expr.target;
        const decimals = target?.length || 0;
        if (decimals > 6) {
            result.err = 'ER_TOO_BIG_PRECISION';
        }
        result.value = convertDateTime(result.value, 'datetime', decimals);
    }
    return result;
}
function date$1(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = `CAST(${result.name} AS DATE)`;
    result.type = 'date';
    if (!result.err && result.value !== null) {
        result.value = convertDateTime(result.value, 'date');
    }
    return result;
}
function time(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = `CAST(${result.name} AS TIME)`;
    result.type = 'time';
    if (!result.err && result.value !== null) {
        const target = Array.isArray(expr.target)
            ? expr.target[0]
            : expr.target;
        const decimals = target?.length || 0;
        if (decimals > 6) {
            result.err = 'ER_TOO_BIG_PRECISION';
        }
        result.value = convertTime(result.value, decimals);
    }
    return result;
}
function signed(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = `CAST(${result.name} AS SIGNED)`;
    result.type = 'bigint';
    if (!result.err && result.value !== null) {
        result.value = Math.trunc(convertNum(result.value));
    }
    return result;
}
function char(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = `CAST(${result.name} AS CHAR)`;
    if (!result.err && result.value !== null && result.type !== 'string') {
        result.type = 'string';
        result.value = String(result.value);
    }
    return result;
}
const methods$4 = { datetime, date: date$1, time, signed, char };

const DAY = 24 * 60 * 60;
function database(expr, state) {
    return { err: null, value: state.session.getCurrentDatabase() };
}
function sleep(expr, state) {
    const result = getValue(expr.args.value?.[0], state);
    result.name = `SLEEP(${result.name})`;
    const sleep_ms = convertNum(result.value);
    if (sleep_ms > 0) {
        result.sleep_ms = sleep_ms * 1000;
    }
    return result;
}
function length(expr, state) {
    const result = getValue(expr.args.value?.[0], state);
    result.name = `LENGTH(${result.name})`;
    result.type = 'number';
    if (!result.err && result.value !== null) {
        result.value = String(result.value).length;
    }
    return result;
}
function concat(expr, state) {
    let err = null;
    let value = '';
    expr.args.value?.every?.((sub) => {
        const result = getValue(sub, state);
        if (!err && result.err) {
            err = result.err;
        }
        else if (result.value === null) {
            value = null;
        }
        else {
            value += String(result.value);
        }
        return value !== null;
    });
    return { err, value };
}
function left(expr, state) {
    const result = getValue(expr.args?.value?.[0], state);
    const len_result = getValue(expr.args?.value?.[1], state);
    result.name = `LEFT(${result.name ?? ''}, ${len_result.name ?? ''})`;
    result.err = result.err || len_result.err;
    result.type = 'string';
    if (!result.err && (result.value === null || len_result.value === null)) {
        result.value = null;
    }
    else if (!result.err) {
        const length = convertNum(len_result.value);
        result.value = String(result.value).substring(0, length);
    }
    return result;
}
function coalesce(expr, state) {
    let err = null;
    let value = null;
    let type;
    expr.args.value?.some?.((sub) => {
        const result = getValue(sub, state);
        if (result.err) {
            err = result.err;
        }
        value = result.value;
        type = result.type;
        return !err && value !== null;
    });
    return { err, value, type };
}
const ifnull = coalesce;
function now(expr, state) {
    const result = getValue(expr.args?.value?.[0], state);
    result.name = expr.args ? `NOW(${result.name ?? ''})` : 'CURRENT_TIMESTAMP';
    if (!result.err && result.type) {
        const decimals = typeof result.value === 'number' ? result.value : 0;
        if (decimals > 6) {
            result.err = 'ER_TOO_BIG_PRECISION';
        }
        result.value = createSQLDateTime(Date.now() / 1000, 'datetime', decimals);
        result.type = 'datetime';
    }
    return result;
}
const current_timestamp = now;
function from_unixtime(expr, state) {
    const result = getValue(expr.args.value?.[0], state);
    result.name = `FROM_UNIXTIME(${result.name})`;
    result.type = 'datetime';
    if (!result.err && result.value !== null) {
        const time = convertNum(result.value);
        const decimals = Math.min(6, String(time).split('.')?.[1]?.length || 0);
        result.value =
            time < 0 ? null : createSQLDateTime(time, 'datetime', decimals);
    }
    return result;
}
function date(expr, state) {
    const result = getValue(expr.args.value?.[0], state);
    result.name = `DATE(${result.name})`;
    result.type = 'date';
    if (!result.err && result.value !== null) {
        const dateValue = convertDateTime(result.value);
        if (dateValue &&
            typeof dateValue === 'object' &&
            'setType' in dateValue &&
            typeof dateValue.setType === 'function') {
            dateValue.setType('date');
        }
        result.value = dateValue;
    }
    return result;
}
function date_format(expr, state) {
    const date = getValue(expr.args.value?.[0], state);
    const format = getValue(expr.args.value?.[1], state);
    const err = date.err || format.err;
    let value;
    const name = `DATE_FORMAT(${date.name}, ${format.name})`;
    if (!err && (date.value === null || format.value === null)) {
        value = null;
    }
    else if (!err) {
        value =
            convertDateTime(date.value)?.dateFormat?.(String(format.value)) || null;
    }
    return { err, name, value, type: 'string' };
}
function datediff(expr, state) {
    const expr1 = getValue(expr.args.value?.[0], state);
    const expr2 = getValue(expr.args.value?.[1], state);
    const err = expr1.err || expr2.err;
    let value;
    const name = `DATEDIFF(${expr1.name}, ${expr2.name})`;
    if (!err && (expr1.value === null || expr2.value === null)) {
        value = null;
    }
    else if (!err) {
        value =
            convertDateTime(expr1.value)?.diff?.(convertDateTime(expr2.value)) ||
                null;
    }
    return { err, name, value, type: 'int' };
}
function curdate(expr) {
    const value = createSQLDateTime(Date.now() / 1000, 'date');
    const name = expr.args ? 'CURDATE()' : 'CURRENT_DATE';
    return { err: null, value, name, type: 'date' };
}
const current_date = curdate;
function curtime(expr, state) {
    const result = getValue(expr.args?.value?.[0], state);
    result.name = expr.args ? `CURTIME(${result.name ?? ''})` : 'CURRENT_TIME';
    if (!result.err && result.type) {
        const decimals = typeof result.value === 'number' ? result.value : 0;
        if (decimals > 6) {
            result.err = 'ER_TOO_BIG_PRECISION';
        }
        const time = (Date.now() / 1000) % DAY;
        result.value = createSQLTime(time, decimals);
        result.type = 'time';
    }
    return result;
}
const current_time = curtime;
const methods$3 = {
    database,
    sleep,
    length,
    concat,
    left,
    coalesce,
    ifnull,
    now,
    current_timestamp,
    from_unixtime,
    date,
    date_format,
    datediff,
    curdate,
    current_date,
    curtime,
    current_time,
};

const SINGLE_TIME = {
    microsecond: 0.000001,
    second: 1,
    minute: 60,
    hour: 60 * 60,
    day: 24 * 60 * 60,
    week: 7 * 24 * 60 * 60,
};
const DOUBLE_TIME = {
    second_microsecond: [1, 0.000001],
    minute_microsecond: [60, 0.000001],
    minute_second: [60, 1],
    hour_microsecond: [60 * 60, 0.000001],
    hour_second: [60 * 60, 1],
    hour_minute: [60 * 60, 60],
    day_microsecond: [24 * 60 * 60, 0.000001],
    day_second: [24 * 60 * 60, 1],
    day_minute: [24 * 60 * 60, 60],
    day_hour: [24 * 60 * 60, 60 * 60],
};
const MONTH = {
    month: 1,
    quarter: 3,
    year: 12,
    year_month: [12, 1],
};
const FORCE_DATE = {
    day: true,
    week: true,
    month: true,
    quarter: true,
    year: true,
    day_microsecond: true,
    day_second: true,
    day_minute: true,
    day_hour: true,
    year_month: true,
};
const DECIMALS = {
    microsecond: 6,
    second_microsecond: 6,
    minute_microsecond: 6,
    hour_microsecond: 6,
    day_microsecond: 6,
};
class SQLInterval {
    _number;
    _decimals;
    _isMonth;
    _forceDate;
    constructor(number, decimals, is_month, force_date) {
        this._isMonth = is_month;
        this._forceDate = force_date;
        this._decimals = decimals || 0;
        if (this._decimals > 0) {
            this._number = parseFloat(number.toFixed(this._decimals + 1).slice(0, -1));
        }
        else {
            this._number = Math.trunc(number);
        }
    }
    getNumber() {
        return this._number;
    }
    isMonth() {
        return this._isMonth;
    }
    forceDate() {
        return this._forceDate;
    }
    toString() {
        return null;
    }
    _add(datetime, mult) {
        let old_time = datetime.getTime?.();
        let fraction = datetime.getFraction?.();
        const old_type = datetime?.getType?.();
        let type;
        if (old_type === 'datetime') {
            type = 'datetime';
        }
        else if (old_type === 'date' && !this._forceDate) {
            type = 'datetime';
        }
        else if (old_type === 'date') {
            type = 'date';
        }
        else if (old_type === 'time' && this._forceDate) {
            type = 'datetime';
        }
        else if (old_type === 'time') {
            type = 'time';
        }
        const decimals = Math.max(datetime.getDecimals?.(), this._decimals);
        const number = this._number * mult;
        let value = null;
        if (type === 'time') {
            value = createSQLTime(old_time + number, decimals);
        }
        else {
            if (old_type === 'time') {
                const now = Date.now() / 1000;
                old_time += now - (now % (24 * 60 * 60));
            }
            let time;
            if (this._isMonth) {
                time = _addMonth(old_time, number);
            }
            else {
                const add_time = Math.floor(number);
                time = old_time + add_time;
                fraction += number - add_time;
                const overflow = Math.floor(fraction);
                time += overflow;
                fraction -= overflow;
            }
            value = createSQLDateTime({ time, fraction }, type, decimals);
        }
        return { type, value };
    }
    add(datetime) {
        return this._add(datetime, 1);
    }
    sub(datetime) {
        return this._add(datetime, -1);
    }
}
function createSQLInterval(value, unit_name) {
    let is_month = false;
    let unit;
    if (unit_name in MONTH) {
        is_month = true;
        unit = MONTH[unit_name];
    }
    else {
        unit = SINGLE_TIME[unit_name] ?? DOUBLE_TIME[unit_name];
    }
    let ret = null;
    const number = unit ? _convertNumber(value, unit, unit_name) : null;
    if (number !== null) {
        const force_date = unit_name in FORCE_DATE;
        let decimals = DECIMALS[unit_name] || 0;
        if (!decimals && unit_name.endsWith('second')) {
            decimals = getDecimals(value, 6);
            if (typeof value === 'string' && decimals) {
                decimals = 6;
            }
        }
        ret = new SQLInterval(number, decimals, is_month, force_date);
    }
    return ret;
}
function _convertNumber(value, unit, unit_name) {
    let ret = null;
    if (Array.isArray(unit)) {
        if (typeof value === 'number') {
            ret = value * unit[1];
        }
        else {
            const match = String(value).match(/\d+/g);
            if (match && match.length === 2) {
                ret = parseInt(match[0]) * unit[0] + parseInt(match[1]) * unit[2];
            }
            else if (match && match.length === 1) {
                ret = parseInt(match[0]) * unit[1];
            }
            else if (match && match.length === 0) {
                ret = 0;
            }
            else {
                ret = null;
            }
        }
    }
    else {
        ret = convertNum(value);
        if (ret !== null) {
            if (unit_name !== 'second') {
                ret = Math.trunc(ret);
            }
            ret *= unit;
        }
    }
    return ret;
}
function _addMonth(old_time, number) {
    const date = new Date(old_time * 1000);
    const start_time = date.getTime();
    const new_months = date.getUTCFullYear() * 12 + date.getUTCMonth() + number;
    const year = Math.floor(new_months / 12);
    const month = new_months - year * 12;
    let day = date.getUTCDate();
    date.setUTCFullYear(year);
    date.setUTCMonth(month);
    while (date.getUTCMonth() !== month) {
        date.setUTCMonth(0);
        date.setUTCDate(day--);
        date.setUTCMonth(month);
    }
    const delta = date.getTime() - start_time;
    return old_time + delta / 1000;
}

function interval(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = `INTERVAL ${result.name} ${expr.unit}`;
    result.type = 'interval';
    if (!result.err && result.value !== null) {
        result.value = createSQLInterval(result.value, expr.unit);
    }
    return result;
}
const methods$2 = { interval };

function plus(expr, state) {
    return getValue(expr.expr, state);
}
function not$1(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = 'NOT ' + result.name;
    result.type = 'number';
    if (!result.err && result.value !== null) {
        result.value = convertNum(result.value) ? 0 : 1;
    }
    return result;
}
function minus$1(expr, state) {
    const result = getValue(expr.expr, state);
    result.name = '-' + result.name;
    result.type = 'number';
    if (!result.err && result.value !== null) {
        result.value = -convertNum(result.value);
    }
    return result;
}
const methods$1 = { '+': plus, '!': not$1, not: not$1, '-': minus$1 };

function version_comment() {
    return 'dynamosql source version';
}
const methods = {
    version_comment,
};

// Helper to extract function name from node-sql-parser AST format
function getFunctionName(nameObj) {
    if (typeof nameObj === 'string') {
        return nameObj;
    }
    if (nameObj?.name && Array.isArray(nameObj.name)) {
        return nameObj.name.map((n) => n.value).join('.');
    }
    return String(nameObj);
}
// Helper to extract database name from node-sql-parser AST format
function getDatabaseName(dbObj) {
    if (typeof dbObj === 'string') {
        return dbObj;
    }
    if (dbObj?.schema && Array.isArray(dbObj.schema)) {
        return dbObj.schema[0]?.value || '';
    }
    return String(dbObj);
}
function walkColumnRefs(object, cb) {
    if (object?.type === 'column_ref') {
        cb(object);
    }
    else {
        let array;
        if (Array.isArray(object)) {
            array = object;
        }
        else if (object && typeof object === 'object') {
            array = Object.values(object);
        }
        array?.forEach?.((child) => {
            walkColumnRefs(child, cb);
        });
    }
}

function getValue(expr, state) {
    const { session, row } = state;
    let result = {
        err: null,
        value: undefined,
        name: undefined,
    };
    const type = expr?.type;
    if (!expr) ;
    else if (type === 'number') {
        result.value =
            typeof expr.value === 'string' ? Number(expr.value) : expr.value;
    }
    else if (type === 'double_quote_string') {
        result.value = expr.value;
        result.name = `"${result.value}"`;
    }
    else if (type === 'null') {
        result.value = null;
    }
    else if (type === 'bool') {
        result.value = expr.value ? 1 : 0;
        result.name = expr.value ? 'TRUE' : 'FALSE';
    }
    else if (type === 'hex_string' || type === 'full_hex_string') {
        result.value = Buffer.from(expr.value, 'hex');
        result.name = 'x' + expr.value.slice(0, 10);
        result.type = 'buffer';
    }
    else if (type === 'interval') {
        result = methods$2.interval(expr, state);
    }
    else if (type === 'function') {
        const funcExpr = expr;
        const funcName = getFunctionName(funcExpr.name);
        const func = methods$3[funcName.toLowerCase()];
        if (func) {
            result = func(funcExpr, state);
            if (!result.name) {
                result.name = funcName + '()';
            }
        }
        else {
            shared.logger.trace('expression.getValue: unknown function:', funcName);
            result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
        }
    }
    else if (type === 'aggr_func') {
        const aggrExpr = expr;
        const funcName = getFunctionName(aggrExpr.name);
        const func = methods$6[funcName.toLowerCase()];
        if (func) {
            result = func(aggrExpr, state);
            if (!result.name) {
                result.name = funcName + '()';
            }
        }
        else {
            shared.logger.trace('expression.getValue: unknown aggregate:', funcName);
            result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [funcName] };
        }
    }
    else if (type === 'binary_expr') {
        const binExpr = expr;
        const func = methods$5[binExpr.operator.toLowerCase()];
        if (func) {
            result = func(binExpr, state);
            if (!result.name) {
                result.name = binExpr.operator;
            }
        }
        else {
            shared.logger.trace('expression.getValue: unknown binary operator:', binExpr.operator);
            result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [binExpr.operator] };
        }
    }
    else if (type === 'unary_expr') {
        const unaryExpr = expr;
        const func = methods$1[unaryExpr.operator.toLowerCase()];
        if (func) {
            result = func(unaryExpr, state);
            if (!result.name) {
                result.name = unaryExpr.operator;
            }
        }
        else {
            shared.logger.trace('expression.getValue: unknown unanary operator:', unaryExpr.operator);
            result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [unaryExpr.operator] };
        }
    }
    else if (type === 'cast') {
        const castExpr = expr;
        const target = Array.isArray(castExpr.target)
            ? castExpr.target[0]
            : castExpr.target;
        const dataType = target?.dataType;
        const func = methods$4[dataType?.toLowerCase() ?? ''];
        if (func) {
            result = func(castExpr, state);
            if (!result.name) {
                result.name = `CAST(? AS ${dataType})`;
            }
        }
        else {
            shared.logger.trace('expression.getValue: unknown cast type:', dataType);
            result.err = { err: 'ER_SP_DOES_NOT_EXIST', args: [dataType] };
        }
    }
    else if (type === 'var') {
        const varExpr = expr;
        const { prefix } = varExpr;
        if (prefix === '@@') {
            const func = methods[varExpr.name.toLowerCase()];
            if (func) {
                result.value = func();
            }
            else {
                shared.logger.trace('expression.getValue: unknown system variable:', varExpr.name);
                result.err = {
                    err: 'ER_UNKNOWN_SYSTEM_VARIABLE',
                    args: [varExpr.name],
                };
            }
        }
        else if (prefix === '@') {
            result.value = session.getVariable(varExpr.name) ?? null;
        }
        else {
            result.err = 'unsupported';
        }
        result.name = prefix + varExpr.name;
    }
    else if (type === 'column_ref') {
        const colRef = expr;
        const colRefItem = colRef.type === 'column_ref' ? colRef : colRef.expr;
        result.name = colRefItem.column;
        if (row && colRefItem._resultIndex >= 0) {
            const output_result = row['@@result']?.[colRefItem._resultIndex];
            result.value = output_result?.value;
            result.type = output_result?.type;
        }
        else if (row) {
            const cell = row[colRefItem.from?.key]?.[colRefItem.column];
            const decode = _decodeCell(cell);
            result.type = decode?.type;
            result.value = decode?.value;
        }
        else {
            result.err = 'no_row_list';
            result.value = colRefItem.column;
        }
    }
    else {
        shared.logger.error('unsupported expr:', expr);
        result.err = 'unsupported';
    }
    if (!result.type) {
        result.type = result.value === null ? 'null' : typeof result.value;
    }
    if (result.name === undefined && result.value !== undefined) {
        result.name = String(result.value);
    }
    return result;
}
function _decodeCell(cell) {
    if (!cell || cell.NULL) {
        return { type: 'null', value: null };
    }
    if (cell.value !== undefined) {
        return { type: cell.type ?? typeof cell.value, value: cell.value };
    }
    if (cell.S !== undefined) {
        return { type: 'string', value: cell.S };
    }
    if (cell.N !== undefined) {
        return { type: 'number', value: cell.N };
    }
    if (cell.BOOL !== undefined) {
        return { type: 'boolean', value: cell.BOOL };
    }
    if (cell.M !== undefined) {
        return { type: 'json', value: mapToObject(cell.M) };
    }
    const type = typeof cell;
    return { type: type === 'object' ? 'json' : type, value: cell };
}

function constantFixup(func) {
    return (expr, state) => {
        let result;
        result = getValue(expr, state);
        if (result.err) {
            result = func(expr, state);
        }
        return result;
    };
}
function and(expr, state) {
    const left = convertWhere(expr.left, state);
    const right = convertWhere(expr.right, state);
    if (left.err === 'unsupported' && state?.default_true) {
        left.err = null;
        left.value = 1;
    }
    if (right.err === 'unsupported' && state?.default_true) {
        right.err = null;
        right.value = 1;
    }
    const err = left.err || right.err;
    let value;
    if (!left.value || !right.value) {
        value = 0;
    }
    else if (left.value === 1 && right.value === 1) {
        value = 1;
    }
    else if (right.value === 1) {
        value = left.value;
    }
    else if (left.value === 1) {
        value = right.value;
    }
    else {
        value = `(${left.value}) AND (${right.value})`;
    }
    return { err, value };
}
function or(expr, state) {
    const left = convertWhere(expr.left, state);
    const right = convertWhere(expr.right, state);
    let err = left.err || right.err;
    let value;
    if (err === 'unsupported' && state?.default_true) {
        value = 1;
        err = null;
    }
    else if (!left.value && !right.value) {
        value = 0;
    }
    else if (left.value === 1 || right.value === 1) {
        value = 1;
    }
    else if (!right.value) {
        value = left.value;
    }
    else if (!left.value) {
        value = right.value;
    }
    else {
        value = `(${left.value}) OR (${right.value})`;
    }
    return { err, value };
}
function _in(expr, state) {
    const left = convertWhere(expr.left, state);
    let err;
    let value;
    if (left.err) {
        err = left.err;
    }
    else if (left.value === null) {
        value = null;
    }
    else {
        const count = expr.right?.value?.length;
        const list = [];
        for (let i = 0; i < count; i++) {
            const right = convertWhere(expr.right.value[i], state);
            if (right.err) {
                err = right.err;
                break;
            }
            else if (right.value === null) {
                value = null;
                break;
            }
            else {
                list.push(right.value);
            }
        }
        if (value === undefined) {
            value = `${left.value} IN (${list.join(',')})`;
        }
    }
    return { err, value };
}
function _comparator(expr, state, op) {
    const left = convertWhere(expr.left, state);
    const right = convertWhere(expr.right, state);
    const err = left.err || right.err;
    const value = `${left.value} ${op} ${right.value}`;
    return { err, value };
}
function equal(expr, state) {
    return _comparator(expr, state, '=');
}
function notEqual(expr, state) {
    return _comparator(expr, state, '!=');
}
function gt(expr, state) {
    return _comparator(expr, state, '>');
}
function lt(expr, state) {
    return _comparator(expr, state, '<');
}
function gte(expr, state) {
    return _comparator(expr, state, '>=');
}
function lte(expr, state) {
    return _comparator(expr, state, '<=');
}
function is(expr, state) {
    return _is(expr, state, 'IS');
}
function isNot(expr, state) {
    return _is(expr, state, 'IS NOT');
}
function _is(expr, state, op) {
    const left = convertWhere(expr.left, state);
    let right;
    let err = left.err;
    if (!err) {
        if (expr.right.value === null) {
            right = 'NULL';
        }
        else if (expr.right.value === true) {
            right = 'TRUE';
        }
        else if (expr.right.value === false) {
            right = 'FALSE';
        }
        else {
            err = 'syntax_err';
        }
    }
    const value = `${left.value} ${op} ${right}`;
    return { err, value };
}
function not(expr, state) {
    const result = convertWhere(expr.expr, state);
    if (!result.err) {
        result.value = 'NOT ' + result.value;
    }
    return result;
}
function minus(expr, state) {
    const result = convertWhere(expr.expr, state);
    if (!result.err) {
        result.value = '-' + result.value;
    }
    return result;
}
function unsupported() {
    return { err: 'unsupported' };
}
const _equal = constantFixup(equal);
const _notEqual = constantFixup(notEqual);
const _gt = constantFixup(gt);
const _lt = constantFixup(lt);
const _gte = constantFixup(gte);
const _lte = constantFixup(lte);
const _and = constantFixup(and);
const _or = constantFixup(or);
const _inOp = constantFixup(_in);
const _isOp = constantFixup(is);
const _isNotOp = constantFixup(isNot);
const _between = constantFixup(unsupported);
const _not = constantFixup(not);
const _minus = constantFixup(minus);

var ConvertExpression = /*#__PURE__*/Object.freeze({
    __proto__: null,
    "!": _not,
    "!=": _notEqual,
    "-": _minus,
    "<": _lt,
    "<=": _lte,
    "<>": _notEqual,
    "=": _equal,
    ">": _gt,
    ">=": _gte,
    and: _and,
    between: _between,
    in: _inOp,
    is: _isOp,
    "is not": _isNotOp,
    not: _not,
    or: _or
});

function foo() {
    return { err: 'unsupported' };
}

var Functions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    foo: foo
});

function convertWhere(expr, state) {
    const { from_key } = state;
    let err = null;
    let value = null;
    if (expr) {
        const { type } = expr;
        if (type === 'number') {
            value = expr.value;
        }
        else if (type === 'double_quote_string') {
            value = `'${expr.value}'`;
        }
        else if (type === 'null') {
            value = null;
        }
        else if (type === 'bool') {
            value = expr.value;
        }
        else if (type === 'function') {
            const funcName = getFunctionName(expr.name);
            const func = Functions[funcName.toLowerCase()];
            if (func && typeof func === 'function') {
                const result = func(expr, state);
                if (result.err) {
                    err = result.err;
                }
                else {
                    value = result.value;
                }
            }
            else {
                err = 'unsupported';
            }
        }
        else if (type === 'binary_expr' || type === 'unary_expr') {
            const func = ConvertExpression[expr.operator.toLowerCase()];
            if (func) {
                const result = func(expr, state);
                if (result.err) {
                    err = result.err;
                }
                else {
                    value = result.value;
                }
            }
            else {
                err = 'unsupported';
            }
        }
        else if (type === 'column_ref') {
            if (expr.from?.key === from_key) {
                value = expr.column;
            }
            else {
                err = 'unsupported';
            }
        }
        else {
            const result = getValue(expr, state);
            err = result.err;
            value = result.value;
        }
    }
    return { err, value };
}

async function singleDelete$1(params) {
    const { dynamodb, session } = params;
    const { from, where } = params.ast;
    let no_single = false;
    const result = convertWhere(where, { session, from_key: from?.[0]?.key });
    if (result.err) {
        no_single = true;
    }
    else if (from.length > 1) {
        no_single = true;
    }
    else if (!result.value) {
        no_single = true;
    }
    if (no_single) {
        throw new NoSingleOperationError();
    }
    const sql = `
DELETE FROM ${escapeIdentifier(from[0].table)}
WHERE ${result.value}
RETURNING ALL OLD *
`;
    try {
        const results = await dynamodb.queryQL(sql);
        return { affectedRows: results?.length || 0 };
    }
    catch (err) {
        if (err?.name === 'ValidationException') {
            throw new NoSingleOperationError();
        }
        else if (err?.name === 'ConditionalCheckFailedException') {
            return { affectedRows: 0 };
        }
        shared.logger.error('singleDelete: query err:', err);
        throw err;
    }
}
async function multipleDelete$1(params) {
    const { dynamodb, list } = params;
    let affectedRows = 0;
    for (const object of list) {
        const { table, key_list, delete_list } = object;
        try {
            await dynamodb.deleteItems({ table, key_list, list: delete_list });
            affectedRows += delete_list.length;
        }
        catch (err) {
            shared.logger.error('multipleDelete: deleteItems: err:', err, table);
            throw err;
        }
    }
    return { affectedRows };
}

async function insertRowList$1(params) {
    if (params.list.length === 0) {
        return { affectedRows: 0 };
    }
    else if (params.duplicate_mode) {
        return _insertIgnoreReplace(params);
    }
    else {
        return _insertNoIgnore(params);
    }
}
async function _insertIgnoreReplace(params) {
    const { dynamodb, duplicate_mode, table } = params;
    let list = params.list;
    let affectedRows;
    if (list.length > 1) {
        try {
            const result = await dynamodb.getTableCached(table);
            const key_list = result.Table.KeySchema.map((k) => k.AttributeName);
            const track = new Map();
            if (duplicate_mode === 'replace') {
                list.reverse();
            }
            list = list.filter((row) => trackFirstSeen(track, key_list.map((key) => row[key].value)));
            if (duplicate_mode === 'replace') {
                list.reverse();
            }
        }
        catch (err) {
            if (err?.message === 'resource_not_found') {
                throw new SQLError({ err: 'table_not_found', args: [table] });
            }
            throw err;
        }
    }
    if (duplicate_mode === 'ignore') {
        affectedRows = list.length;
        const sql_list = list.map((item) => `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`);
        try {
            await dynamodb.batchQL(sql_list);
        }
        catch (err) {
            if (err?.name === 'ResourceNotFoundException' ||
                err?.message?.toLowerCase().includes('resource not found')) {
                throw new SQLError({ err: 'table_not_found', args: [table] });
            }
            if (Array.isArray(err)) {
                let error;
                err.forEach((item_err) => {
                    if (item_err?.Code === 'DuplicateItem') {
                        affectedRows--;
                    }
                    else if (!error && item_err) {
                        affectedRows--;
                        error = convertError(item_err);
                    }
                });
                if (error)
                    throw error;
            }
            else if (err?.name === 'ValidationException') {
                throw new SQLError({
                    err: 'dup_table_insert',
                    sqlMessage: err.message,
                    cause: err,
                });
            }
            else {
                throw err;
            }
        }
    }
    else {
        list.forEach(_fixupItem);
        const opts = { table, list };
        try {
            await dynamodb.putItems(opts);
            affectedRows = list.length;
        }
        catch (err) {
            throw convertError(err);
        }
    }
    return { affectedRows };
}
async function _insertNoIgnore(params) {
    const { dynamodb, table, list } = params;
    const sql_list = list.map((item) => `INSERT INTO ${escapeIdentifier(table)} VALUE ${_escapeItem(item)}`);
    try {
        await dynamodb.transactionQL(sql_list);
        return { affectedRows: list.length };
    }
    catch (err) {
        if (err?.name === 'TransactionCanceledException' &&
            err.CancellationReasons) {
            for (let i = 0; i < err.CancellationReasons.length; i++) {
                if (err.CancellationReasons[i].Code === 'DuplicateItem') {
                    throw new SQLError({
                        err: 'dup_table_insert',
                        args: [table, _fixupItem(list[i])],
                    });
                }
                else if (err.CancellationReasons[i].Code !== 'None') {
                    throw new SQLError({
                        err: convertError(err.CancellationReasons[i]),
                        message: err.CancellationReasons[i].Message,
                    });
                }
            }
        }
        else if (err?.name === 'ValidationException') {
            throw new SQLError({
                err: 'dup_table_insert',
                sqlMessage: err.message,
                cause: err,
            });
        }
        // Check for resource not found errors
        const errStr = String(err?.message || err || '').toLowerCase();
        if (err?.name === 'ResourceNotFoundException' ||
            errStr.includes('resource not found') ||
            errStr.includes('requested resource not found')) {
            throw new SQLError({ err: 'table_not_found', args: [table] });
        }
        throw err;
    }
}
function _fixupItem(item) {
    for (const key in item) {
        item[key] = item[key].value;
    }
    return item;
}
function _escapeItem(item) {
    let s = '{ ';
    s += Object.keys(item)
        .map((key) => `'${key}': ${escapeValue(item[key].value)}`)
        .join(', ');
    s += ' }';
    return s;
}

async function getRowList$1(params) {
    const { list } = params;
    const source_map = {};
    const column_map = {};
    for (const from of list) {
        const { results, column_list } = await _getFromTable$1({ ...params, from });
        source_map[from.key] = results;
        column_map[from.key] = column_list;
    }
    return { source_map, column_map };
}
async function _getFromTable$1(params) {
    const { dynamodb, session, from, where } = params;
    const { table, _requestSet, _requestAll } = params.from;
    const request_columns = [..._requestSet];
    const columns = _requestAll || request_columns.length === 0
        ? '*'
        : request_columns.map(escapeIdentifier).join(',');
    let sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;
    const where_result = where
        ? convertWhere(where, { session, from_key: from.key, default_true: true })
        : null;
    if (!where_result?.err && where_result?.value) {
        sql += ' WHERE ' + where_result.value;
    }
    try {
        const results = await dynamodb.queryQL(sql);
        let column_list;
        if (_requestAll) {
            const response_set = new Set();
            results.forEach((result) => {
                for (const key in result) {
                    response_set.add(key);
                }
            });
            column_list = [...response_set.keys()];
        }
        else {
            column_list = request_columns;
        }
        return { results, column_list };
    }
    catch (err) {
        if (err?.message === 'resource_not_found') {
            throw new SQLError({ err: 'table_not_found', args: [table] });
        }
        shared.logger.error('raw_engine.getRowList err:', err, sql);
        throw err;
    }
}

async function singleUpdate$1(params) {
    const { dynamodb, session } = params;
    const { set, from, where } = params.ast;
    const where_result = convertWhere(where, {
        session,
        from_key: from?.[0]?.key,
    });
    let no_single = where_result.err;
    if (from.length > 1 || !where_result.value) {
        no_single = true;
    }
    const value_list = set.map((object) => {
        const { value } = object;
        let ret;
        const result = convertWhere(value, { session, from_key: from?.[0]?.key });
        if (result.err) {
            no_single = true;
        }
        else {
            ret = result.value;
        }
        return ret;
    });
    if (no_single) {
        throw new NoSingleOperationError();
    }
    const sets = set
        .map((object, i) => escapeIdentifier(object.column) + ' = ' + value_list[i])
        .join(', ');
    const sql = `
UPDATE ${escapeIdentifier(from[0].table)}
SET ${sets}
WHERE ${where_result.value}
RETURNING MODIFIED OLD *
`;
    try {
        const results = await dynamodb.queryQL(sql);
        const result = { affectedRows: 1, changedRows: 0 };
        set.forEach((object, i) => {
            const { column } = object;
            const value = value_list[i];
            if (value !== escapeValue(valueToNative(results?.[0]?.[column]))) {
                result.changedRows = 1;
            }
        });
        return result;
    }
    catch (err) {
        if (err?.name === 'ValidationException') {
            throw new NoSingleOperationError();
        }
        else if (err?.name === 'ConditionalCheckFailedException') {
            return { affectedRows: 0, changedRows: 0 };
        }
        shared.logger.error('singleUpdate: err:', err);
        throw err;
    }
}
async function multipleUpdate$1(params) {
    const { dynamodb, list } = params;
    let affectedRows = 0;
    let changedRows = 0;
    for (const object of list) {
        const { table, key_list, update_list } = object;
        update_list.forEach((item) => item.set_list.forEach((set) => (set.value = set.value.value)));
        try {
            await dynamodb.updateItems({ table, key_list, list: update_list });
            affectedRows += list.length;
            changedRows += list.length;
        }
        catch (err) {
            shared.logger.error('multipleUpdate: updateItems: err:', err, 'table:', table);
            throw err;
        }
    }
    return { affectedRows, changedRows };
}

async function commit$2(_params) { }
async function rollback$2(_params) { }

var RawEngine = /*#__PURE__*/Object.freeze({
    __proto__: null,
    addColumn: addColumn$1,
    commit: commit$2,
    createIndex: createIndex$1,
    createTable: createTable$2,
    deleteIndex: deleteIndex$1,
    dropTable: dropTable$2,
    getRowList: getRowList$1,
    getTableInfo: getTableInfo$1,
    getTableList: getTableList$2,
    insertRowList: insertRowList$1,
    multipleDelete: multipleDelete$1,
    multipleUpdate: multipleUpdate$1,
    rollback: rollback$2,
    singleDelete: singleDelete$1,
    singleUpdate: singleUpdate$1
});

const g_tableMap = {};
function getTable(database, table, session) {
    const key = database + '.' + table;
    let data = session.getTempTable(database, table) || g_tableMap[key];
    const updates = txGetData(database, table, session)?.data;
    if (data && updates) {
        data = Object.assign({}, data, updates);
    }
    return data;
}
function updateTableData(database, table, session, updates) {
    const key = database + '.' + table;
    const data = session.getTempTable(database, table) || g_tableMap[key];
    Object.assign(data, updates);
}
function txSaveData(database, table, session, data) {
    const tx = session.getTransaction();
    const key = database + '.' + table;
    const existing = tx.getData('memory') || {};
    existing[key] = { database, table, data };
    tx.setData('memory', existing);
}
function txGetData(database, table, session) {
    const key = database + '.' + table;
    const tx = session.getTransaction();
    return tx?.getData?.('memory')?.[key];
}
function saveTable(database, table, data) {
    const key = database + '.' + table;
    g_tableMap[key] = data;
}
function deleteTable(database, table) {
    const key = database + '.' + table;
    delete g_tableMap[key];
}

async function getTableInfo(params) {
    const { session, database, table } = params;
    const data = getTable(database, table, session);
    if (data) {
        return {
            table,
            primary_key: data.primary_key,
            column_list: data.column_list,
            is_open: false,
        };
    }
    throw new SQLError({ err: 'table_not_found', args: [table] });
}
async function getTableList$1(_params) {
    return [];
}
async function createTable$1(params) {
    const { session, database, table, primary_key, column_list, is_temp } = params;
    if (primary_key.length === 0) {
        throw new SQLError({
            err: 'unsupported',
            message: 'primary key is required',
        });
    }
    const data = { column_list, primary_key, row_list: [], primary_map: new Map() };
    if (is_temp) {
        session.saveTempTable(database, table, data);
    }
    else {
        saveTable(database, table, data);
    }
}
async function dropTable$1(params) {
    const { session, database, table } = params;
    if (session.getTempTable(database, table)) {
        session.deleteTempTable(database, table);
    }
    else {
        deleteTable(database, table);
    }
}
async function addColumn(_params) { }
async function createIndex(_params) { }
async function deleteIndex(_params) { }

async function singleDelete(_params) {
    throw new NoSingleOperationError();
}
async function multipleDelete(params) {
    const { session, list } = params;
    let affectedRows = 0;
    for (const changes of list) {
        const { database, table, delete_list } = changes;
        const data = getTable(database, table, session);
        if (!data) {
            throw new SQLError('table_not_found');
        }
        const row_list = data.row_list.slice();
        const primary_map = new Map(data.primary_map);
        for (const object of delete_list) {
            const key_list = object.map((key) => key.value);
            const delete_key = JSON.stringify(key_list);
            const index = primary_map.get(delete_key);
            if (index !== undefined && index >= 0) {
                primary_map.delete(delete_key);
                row_list.splice(index, 1);
                primary_map.forEach((value, key) => {
                    if (value > index) {
                        primary_map.set(key, value - 1);
                    }
                });
                affectedRows++;
            }
            else {
                shared.logger.info('memory.delete: failed to find key:', key_list, 'for table:', table);
            }
        }
        txSaveData(database, table, session, { row_list, primary_map });
    }
    return { affectedRows };
}

async function insertRowList(params) {
    const { session, database, table, list, duplicate_mode } = params;
    const data = getTable(database, table, session);
    if (list.length === 0) {
        return { affectedRows: 0 };
    }
    if (!data) {
        throw new SQLError('table_not_found');
    }
    const { primary_key } = data;
    const row_list = data.row_list.slice();
    const primary_map = new Map(data.primary_map);
    let affectedRows = 0;
    for (const row of list) {
        _transformRow(row);
        const key_values = primary_key.map((key) => row[key.name].value);
        const key = JSON.stringify(key_values);
        const index = primary_map.get(key);
        if (index === undefined) {
            primary_map.set(key, row_list.push(row) - 1);
            affectedRows++;
        }
        else if (duplicate_mode === 'replace') {
            if (!_rowEqual(row_list[index], row)) {
                affectedRows++;
            }
            row_list[index] = row;
            affectedRows++;
        }
        else if (!duplicate_mode) {
            throw new SQLError({
                err: 'dup_primary_key_entry',
                args: [primary_key, key_values],
            });
        }
    }
    txSaveData(database, table, session, { row_list, primary_map });
    return { affectedRows, changedRows: 0 };
}
function _transformRow(row) {
    for (const key in row) {
        row[key] = { type: row[key].type, value: row[key].value };
    }
}
function _rowEqual(a, b) {
    const keys_a = Object.keys(a);
    return keys_a.every((key) => {
        return a[key].value === b[key].value;
    });
}

async function getRowList(params) {
    const { list } = params;
    const source_map = {};
    const column_map = {};
    for (const from of list) {
        const result = _getFromTable({ ...params, from });
        if (result.err) {
            throw new SQLError(result.err);
        }
        source_map[from.key] = result.row_list;
        column_map[from.key] = result.column_list;
    }
    return { source_map, column_map };
}
function _getFromTable(params) {
    const { session } = params;
    const { db, table } = params.from;
    const data = getTable(db, table, session);
    return {
        err: data ? null : 'table_not_found',
        row_list: data?.row_list,
        column_list: data?.column_list?.map?.((column) => column.name) || [],
    };
}

async function singleUpdate(_params) {
    throw new NoSingleOperationError();
}
async function multipleUpdate(params) {
    const { session, list } = params;
    let affectedRows = 0;
    let changedRows = 0;
    for (const changes of list) {
        const { database, table, update_list } = changes;
        const data = getTable(database, table, session);
        if (!data) {
            throw new SQLError('table_not_found');
        }
        const row_list = data.row_list.slice();
        const primary_map = new Map(data.primary_map);
        for (const update of update_list) {
            const { set_list } = update;
            const key_list = update.key.map((key) => key.value);
            const update_key = JSON.stringify(key_list);
            const index = primary_map.get(update_key);
            if (index !== undefined && index >= 0) {
                const old_row = row_list[index];
                const new_row = Object.assign({}, old_row);
                let changed = false;
                set_list.forEach((set) => {
                    new_row[set.column] = _transformCell(set.value);
                    if (old_row[set.column].value !== new_row[set.column].value) {
                        changed = true;
                    }
                });
                const new_key = _makePrimaryKey(data.primary_key, new_row);
                if (new_key !== update_key && primary_map.has(new_key)) {
                    throw new SQLError({
                        err: 'dup_primary_key_entry',
                        args: [data.primary_key, new_key],
                    });
                }
                else if (new_key !== update_key) {
                    primary_map.delete(update_key);
                    primary_map.set(new_key, index);
                }
                row_list[index] = new_row;
                affectedRows++;
                if (changed) {
                    changedRows++;
                }
            }
            else {
                shared.logger.error('memory.update: failed to find key:', key_list, 'for table:', table);
            }
        }
        txSaveData(database, table, session, { row_list, primary_map });
    }
    return { affectedRows, changedRows };
}
function _transformCell(cell) {
    return { value: cell.value, type: cell.type };
}
function _makePrimaryKey(primary_key, row) {
    const key_values = primary_key.map((key) => row[key.name].value);
    return JSON.stringify(key_values);
}

async function commit$1(params) {
    const { session, data } = params;
    for (const key in data) {
        const { database, table, data: tx_data } = data[key];
        updateTableData(database, table, session, tx_data);
    }
}
async function rollback$1(_params) { }

var MemoryEngine = /*#__PURE__*/Object.freeze({
    __proto__: null,
    addColumn: addColumn,
    commit: commit$1,
    createIndex: createIndex,
    createTable: createTable$1,
    deleteIndex: deleteIndex,
    dropTable: dropTable$1,
    getRowList: getRowList,
    getTableInfo: getTableInfo,
    getTableList: getTableList$1,
    insertRowList: insertRowList,
    multipleDelete: multipleDelete,
    multipleUpdate: multipleUpdate,
    rollback: rollback$1,
    singleDelete: singleDelete,
    singleUpdate: singleUpdate
});

const NullEngine = {
    commit: async () => {
        throw new Error('unsupported');
    },
    rollback: async () => {
        throw new Error('unsupported');
    },
    getTableList: async () => {
        throw new Error('unsupported');
    },
    createTable: async () => {
        throw new Error('unsupported');
    },
    dropTable: async () => {
        throw new Error('unsupported');
    },
    createIndex: async () => {
        throw new Error('unsupported');
    },
    deleteIndex: async () => {
        throw new Error('unsupported');
    },
    addColumn: async () => {
        throw new Error('unsupported');
    },
    getTableInfo: async () => {
        throw new Error('unsupported');
    },
    getRowList: async () => {
        throw new Error('unsupported');
    },
    singleDelete: async () => {
        throw new Error('unsupported');
    },
    multipleDelete: async () => {
        throw new Error('unsupported');
    },
    singleUpdate: async () => {
        throw new Error('unsupported');
    },
    multipleUpdate: async () => {
        throw new Error('unsupported');
    },
    insertRowList: async () => {
        throw new Error('unsupported');
    },
};
function getEngineByName(name) {
    let ret;
    switch (name) {
        case 'raw':
            ret = RawEngine;
            break;
        case 'memory':
            ret = MemoryEngine;
            break;
        default:
            ret = NullEngine;
            break;
    }
    return ret;
}
function getDatabaseError(database) {
    const error = new SQLError({ err: 'db_not_found', args: [database] });
    return {
        commit: async () => {
            throw error;
        },
        rollback: async () => {
            throw error;
        },
        getTableList: async () => {
            throw error;
        },
        createTable: async () => {
            throw error;
        },
        dropTable: async () => {
            throw error;
        },
        createIndex: async () => {
            throw error;
        },
        deleteIndex: async () => {
            throw error;
        },
        addColumn: async () => {
            throw error;
        },
        getTableInfo: async () => {
            throw error;
        },
        getRowList: async () => {
            throw error;
        },
        singleDelete: async () => {
            throw error;
        },
        multipleDelete: async () => {
            throw error;
        },
        singleUpdate: async () => {
            throw error;
        },
        multipleUpdate: async () => {
            throw error;
        },
        insertRowList: async () => {
            throw error;
        },
    };
}
function getTableError(table) {
    const error = new SQLError({ err: 'table_not_found', args: [table] });
    return {
        commit: async () => {
            throw error;
        },
        rollback: async () => {
            throw error;
        },
        getTableList: async () => {
            throw error;
        },
        createTable: async () => {
            throw error;
        },
        dropTable: async () => {
            throw error;
        },
        createIndex: async () => {
            throw error;
        },
        deleteIndex: async () => {
            throw error;
        },
        addColumn: async () => {
            throw error;
        },
        getTableInfo: async () => {
            throw error;
        },
        getRowList: async () => {
            throw error;
        },
        singleDelete: async () => {
            throw error;
        },
        multipleDelete: async () => {
            throw error;
        },
        singleUpdate: async () => {
            throw error;
        },
        multipleUpdate: async () => {
            throw error;
        },
        insertRowList: async () => {
            throw error;
        },
    };
}

const BUILT_IN = ['_dynamodb'];
const g_schemaMap = {};
function getEngine(database, table, session) {
    let ret;
    const schema = g_schemaMap[database];
    if (database === '_dynamodb') {
        ret = getEngineByName('raw');
    }
    else if (!schema) {
        ret = getDatabaseError(database);
    }
    else if (session.getTempTable(database, table)) {
        ret = getEngineByName('memory');
    }
    else if (schema[table]) {
        ret = getEngineByName(schema[table].table_engine);
    }
    else {
        ret = getTableError(table);
    }
    return ret;
}
function _findTable(database, table, session) {
    return (session.getTempTable(database, table) || g_schemaMap[database]?.[table]);
}
function getDatabaseList() {
    return [...BUILT_IN, ...Object.keys(g_schemaMap)];
}
async function getTableList(params) {
    const { dynamodb, database } = params;
    if (database === '_dynamodb') {
        const engine = getEngineByName('raw');
        return await engine.getTableList({ dynamodb });
    }
    else if (database in g_schemaMap) {
        return [];
    }
    else {
        throw new SQLError({ err: 'db_not_found', args: [database] });
    }
}
function createDatabase(database) {
    if (BUILT_IN.includes(database) || database in g_schemaMap) {
        throw new SQLError('database_exists');
    }
    g_schemaMap[database] = {};
}
async function dropDatabase(params) {
    const { session, database } = params;
    if (BUILT_IN.includes(database)) {
        throw new SQLError('database_no_drop_builtin');
    }
    else if (database in g_schemaMap) {
        session.dropTempTable(database);
        const table_list = Object.keys(g_schemaMap[database]);
        for (const table of table_list) {
            const engine = getEngine(database, table, session);
            try {
                await engine.dropTable({ ...params, table });
                delete g_schemaMap[database][table];
            }
            catch (err) {
                shared.logger.error('dropDatabase: table:', table, 'drop err:', err);
                throw err;
            }
        }
        delete g_schemaMap[database];
    }
    else {
        throw new SQLError({ err: 'db_not_found', args: [database] });
    }
}
async function createTable(params) {
    const { session, database, table, is_temp } = params;
    const table_engine = is_temp
        ? 'memory'
        : (params.table_engine?.toLowerCase?.() ?? 'raw');
    if (database === '_dynamodb' && table_engine !== 'raw') {
        throw new SQLError('access_denied');
    }
    else if (database === '_dynamodb') {
        const engine = getEngineByName('raw');
        await engine.createTable(params);
    }
    else if (_findTable(database, table, session)) {
        throw new SQLError({ err: 'table_exists', args: [table] });
    }
    else if (!(database in g_schemaMap)) {
        throw new SQLError({ err: 'db_not_found', args: [database] });
    }
    else {
        const engine = getEngineByName(table_engine);
        if (engine) {
            await engine.createTable(params);
            if (!is_temp) {
                g_schemaMap[database][table] = { table_engine };
            }
        }
        else {
            throw new SQLError({
                err: 'ER_UNKNOWN_STORAGE_ENGINE',
                args: [table_engine],
            });
        }
    }
}
async function dropTable(params) {
    const { session, database, table } = params;
    if (database === '_dynamodb') {
        const engine = getEngineByName('raw');
        await engine.dropTable(params);
    }
    else if (_findTable(database, table, session)) {
        const engine = getEngine(database, table, session);
        try {
            await engine.dropTable(params);
            delete g_schemaMap[database][table];
        }
        catch (err) {
            shared.logger.error('SchemaManager.dropTable: drop error but deleting table anyway: err:', err, database, table);
            delete g_schemaMap[database][table];
            throw err;
        }
    }
    else {
        throw new SQLError('resource_not_found');
    }
}

class Transaction {
    _dataMap = new Map();
    _isAutoCommit;
    constructor(auto_commit) {
        this._isAutoCommit = Boolean(auto_commit);
    }
    isAutoCommit() {
        return this._isAutoCommit;
    }
    getEngineNameList() {
        return this._dataMap.keys();
    }
    getData(name) {
        return this._dataMap.get(name);
    }
    setData(name, data) {
        this._dataMap.set(name, data);
    }
}
async function run(params) {
    const { dynamodb, session, func } = params;
    startTransaction({ session, auto_commit: true });
    const tx = session.getTransaction();
    params.transaction = tx;
    try {
        const result = await func(params);
        if (tx.isAutoCommit()) {
            await commit({ dynamodb, session });
        }
        return result;
    }
    catch (err) {
        if (tx.isAutoCommit()) {
            await rollback({ dynamodb, session });
        }
        throw err;
    }
}
function startTransaction(params) {
    const { session, auto_commit } = params;
    const existing = session.getTransaction();
    if (!existing) {
        const tx = new Transaction(auto_commit);
        session.setTransaction(tx);
    }
}
async function commit(params) {
    await _txEach(params, async ({ engine, ...other }) => {
        await engine.commit(other);
    });
}
async function rollback(params) {
    await _txEach(params, async ({ engine, ...other }) => {
        await engine.rollback(other);
    });
}
async function _txEach(params, callback) {
    const { dynamodb, session } = params;
    const transaction = session.getTransaction();
    if (transaction) {
        const list = Array.from(transaction.getEngineNameList());
        for (const name of list) {
            const engine = getEngineByName(name);
            const data = transaction.getData(name);
            await callback({ engine, dynamodb, session, transaction, data });
        }
        session.setTransaction(null);
    }
}

async function query$8(params) {
    const { ast, dynamodb, session } = params;
    const database = ast.table?.[0]?.db || session.getCurrentDatabase();
    const table = ast.table?.[0]?.table;
    const engine = getEngine(database, table, session);
    if (ast.table && database) {
        const opts = { dynamodb, ast, engine, session, func: _runAlterTable };
        return await run(opts);
    }
    else if (ast.table) {
        throw new SQLError('no_current_database');
    }
    else {
        throw new SQLError('unsupported');
    }
}
async function _runAlterTable(params) {
    const { ast, dynamodb, engine, session } = params;
    const table = ast.table?.[0]?.table;
    const column_list = [];
    // Process column additions
    for (const def of ast.expr) {
        if (def.resource === 'column' && def.action === 'add') {
            const column_name = def.column?.column;
            const type = def.definition?.dataType;
            const length = def.definition?.length;
            column_list.push({ name: column_name, type, length });
            const opts = { dynamodb, session, table, column_name, type, length };
            await engine.addColumn(opts);
        }
    }
    // Process index operations
    for (const def of ast.expr) {
        if (def.resource === 'index' && def.action === 'add') {
            let key_err;
            const key_list = def.definition?.map?.((sub) => {
                const column_def = column_list.find((col) => col.name === sub.column);
                if (!column_def) {
                    key_err = {
                        err: 'ER_KEY_COLUMN_DOES_NOT_EXITS',
                        args: [sub.column],
                    };
                }
                return {
                    name: sub.column,
                    order_by: sub.order_by,
                    type: column_def?.type,
                };
            }) || [];
            if (key_err) {
                throw new SQLError(key_err);
            }
            const opts = {
                dynamodb,
                session,
                table,
                index_name: def.index,
                key_list,
            };
            try {
                await engine.createIndex(opts);
            }
            catch (err) {
                if (err?.message === 'index_exists') {
                    throw new SQLError({ err: 'ER_DUP_KEYNAME', args: [def.index] });
                }
                throw err;
            }
        }
        else if (def.resource === 'index' && def.action === 'drop') {
            const opts = { dynamodb, session, table, index_name: def.index };
            try {
                await engine.deleteIndex(opts);
            }
            catch (err) {
                if (err?.message === 'index_not_found') {
                    throw new SQLError({
                        err: 'ER_CANT_DROP_FIELD_OR_KEY',
                        args: [def.index],
                    });
                }
                throw err;
            }
        }
    }
    return {};
}

function convertType(type, nullable) {
    let ret = type;
    if (type === 'number') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.BINARY,
            columnLength: 66,
            columnType: TYPES.DECIMAL,
            flags: FIELD_FLAGS.BINARY | FIELD_FLAGS.NOT_NULL,
            decimals: 31,
        };
    }
    else if (type === 'bigint') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.BINARY,
            columnLength: 66,
            columnType: TYPES.BIGINT,
            flags: FIELD_FLAGS.BINARY | FIELD_FLAGS.NOT_NULL,
            decimals: 0,
        };
    }
    else if (type === 'null') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.BINARY,
            columnLength: 0,
            columnType: TYPES.NULL,
            flags: FIELD_FLAGS.BINARY,
            decimals: 0,
        };
    }
    else if (type === 'json') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.UTF8_GENERAL_CI,
            columnLength: 4294967295,
            columnType: TYPES.JSON,
            flags: 0,
            decimals: 0,
        };
    }
    else if (type === 'datetime') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.BINARY,
            columnLength: 26,
            columnType: TYPES.DATETIME,
            flags: FIELD_FLAGS.BINARY | FIELD_FLAGS.NOT_NULL,
            decimals: 0,
        };
    }
    else if (type === 'date') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.BINARY,
            columnLength: 10,
            columnType: TYPES.DATE,
            flags: FIELD_FLAGS.BINARY | FIELD_FLAGS.NOT_NULL,
            decimals: 0,
        };
    }
    else if (type === 'time') {
        ret = {
            catalog: 'def',
            table: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.BINARY,
            columnLength: 15,
            columnType: TYPES.TIME,
            flags: FIELD_FLAGS.BINARY | FIELD_FLAGS.NOT_NULL,
            decimals: 0,
        };
    }
    else if (type === 'buffer') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.BINARY,
            columnLength: 255,
            columnType: TYPES.VAR_STRING,
            flags: FIELD_FLAGS.NOT_NULL |
                FIELD_FLAGS.BINARY |
                FIELD_FLAGS.UNSIGNED,
            decimals: 0,
        };
    }
    else if (type === 'string' || typeof type !== 'object') {
        ret = {
            catalog: 'def',
            table: '',
            schema: '',
            orgTable: '',
            name: '',
            orgName: '',
            characterSet: CHARSETS.UTF8_GENERAL_CI,
            columnLength: 255,
            columnType: TYPES.VAR_STRING,
            flags: FIELD_FLAGS.NOT_NULL,
            decimals: 31,
        };
    }
    if (ret && nullable === true) {
        ret.flags &= -2;
    }
    return ret;
}

function resolveReferences(ast, current_database) {
    let err = null;
    const table_map = {};
    const db_map = {};
    const from = ast.type === 'select' ? ast.from : ast.from;
    from?.forEach?.((from) => {
        if (!from.db) {
            if (!current_database) {
                err = 'no_current_database';
            }
            else {
                from.db = current_database;
            }
        }
        if (!from._requestSet) {
            from._requestSet = new Set();
        }
        from._requestAll = from._requestAll || false;
        from.key = from.as || `${from.db}.${from.table}`;
        if (from.as) {
            table_map[from.as] = from;
        }
        else {
            if (!table_map[from.table]) {
                table_map[from.table] = from;
            }
            if (!db_map[from.db]) {
                db_map[from.db] = {};
            }
            db_map[from.db][from.table] = from;
        }
    });
    const table = ast.type === 'update' ? ast.table : ast.table;
    table?.forEach?.((object) => {
        const from = object.db
            ? db_map[object.db]?.[object.table]
            : table_map[object.table];
        if (!from) {
            err = { err: 'table_not_found', args: [object.table] };
        }
        else {
            object.from = from;
        }
    });
    const name_cache = {};
    if (!err) {
        const columns = ast.type === 'select' ? ast.columns : undefined;
        const set = ast.type === 'update' ? ast.set : undefined;
        const where = ast.where;
        [from, columns, where, set].forEach((item) => {
            walkColumnRefs(item, (object) => {
                const ret = _resolveObject(object, ast, db_map, table_map, name_cache);
                if (ret && !err) {
                    err = ret;
                }
            });
        });
    }
    if (!err) {
        const set = ast.type === 'update' ? ast.set : undefined;
        set?.forEach?.((object) => {
            const ret = _resolveObject(object, ast, db_map, table_map, name_cache);
            if (ret && !err) {
                err = ret;
            }
        });
    }
    const result_map = {};
    const columns = ast.type === 'select' ? ast.columns : undefined;
    columns?.forEach?.((column, i) => {
        const col = column;
        if (col.as) {
            result_map[col.as] = i;
        }
        else if (col.expr?.type === 'column_ref') {
            result_map[col.expr.column ?? ''] = i;
        }
    });
    if (!err) {
        const groupby = ast.type === 'select' ? ast.groupby : undefined;
        const orderby = ast.type === 'select'
            ? ast.orderby
            : ast.orderby;
        const having = ast.type === 'select' ? ast.having : undefined;
        [groupby, orderby, having].forEach((item) => {
            walkColumnRefs(item, (object) => {
                const ret = _resolveObject(object, ast, db_map, table_map, name_cache, result_map);
                if (ret && !err) {
                    err = ret;
                }
            });
        });
    }
    return err;
}
function _resolveObject(object, ast, db_map, table_map, name_cache, result_map) {
    let err = null;
    const obj = object;
    if (obj.column === '*') {
        if (obj.db) {
            const from = db_map[obj.db]?.[obj.table ?? ''];
            if (from) {
                from._requestAll = true;
            }
            else {
                err = { err: 'table_not_found', args: [obj.table] };
            }
        }
        else if (obj.table) {
            let found = false;
            const astFrom = ast.from;
            astFrom?.forEach?.((from) => {
                if (from.as === obj.table || (!from.as && from.table === obj.table)) {
                    from._requestAll = true;
                    found = true;
                }
            });
            if (!found) {
                err = { err: 'table_not_found', args: [obj.table] };
            }
        }
        else {
            const astFrom = ast.from;
            astFrom?.forEach?.((from) => {
                from._requestAll = true;
            });
        }
    }
    else {
        let add_cache = false;
        let from;
        if (obj.db) {
            from = db_map[obj.db]?.[obj.table ?? ''];
            add_cache = true;
        }
        else if (obj.table) {
            from = table_map[obj.table];
            add_cache = true;
        }
        else {
            const index = result_map?.[obj.column ?? ''];
            if (index !== undefined && index >= 0) {
                obj._resultIndex = index;
            }
            else {
                const cached = name_cache[obj.column ?? ''];
                const astFrom = ast.from;
                from = cached ?? astFrom?.[0];
            }
        }
        if (from) {
            obj.from = from;
            from._requestSet?.add(obj.column ?? '');
            if (add_cache && obj.column) {
                name_cache[obj.column] = from;
            }
        }
        else if (obj._resultIndex === undefined) {
            if (obj.db && !db_map[obj.db]) {
                err = { err: 'db_not_found', args: [obj.db] };
            }
            else if (obj.table) {
                err = { err: 'table_not_found', args: [obj.table] };
            }
            else {
                err = { err: 'column_not_found', args: [obj.column] };
            }
        }
    }
    return err;
}

function formJoin(params) {
    const { source_map, from, where, session } = params;
    const row_list = [];
    from.forEach((from_table) => {
        row_list[from_table.key ?? ''] = [];
        from_table.is_left = from_table.join?.indexOf?.('LEFT') >= 0;
    });
    const result = _findRows(source_map, from, where, session, row_list, 0, 0);
    const { err, output_count } = result;
    if (!err) {
        row_list.length = output_count;
    }
    return { err, row_list };
}
function _findRows(source_map, list, where, session, row_list, from_index, start_index) {
    let err = null;
    const from = list[from_index];
    const { key, on, is_left } = from;
    const rows = source_map[key];
    const row_count = rows?.length || (is_left ? 1 : 0);
    let output_count = 0;
    for (let i = 0; i < row_count && !err; i++) {
        const row_index = start_index + output_count;
        if (!row_list[row_index]) {
            row_list[row_index] = {};
        }
        const row = row_list[row_index];
        row_list[row_index][key] = rows[i] ?? null;
        for (let j = 0; output_count > 0 && j < from_index; j++) {
            const from_key = list[j].key;
            row_list[row_index][from_key] = row_list[start_index][from_key];
        }
        let skip = false;
        if (on) {
            const result = getValue(on, { session, row });
            if (result.err) {
                err = result.err;
            }
            else if (!result.value) {
                skip = true;
            }
        }
        if (skip && is_left && output_count === 0 && i + 1 === row_count) {
            row_list[row_index][key] = null;
            skip = false;
        }
        if (!skip) {
            const next_from = from_index + 1;
            if (next_from < list.length) {
                const result = _findRows(source_map, list, where, session, row_list, next_from, start_index + output_count);
                if (result.err) {
                    err = result.err;
                }
                else {
                    output_count += result.output_count;
                }
            }
            else if (where) {
                const result = getValue(where, { session, row });
                if (result.err) {
                    err = result.err;
                }
                else if (result.value) {
                    output_count++;
                }
            }
            else {
                output_count++;
            }
        }
    }
    return { err, output_count };
}

function formGroup(params) {
    const { groupby, ast, row_list, session } = params;
    let err = null;
    const output_list = [];
    const count = groupby.length;
    for (let i = 0; i < count; i++) {
        const group = groupby[i];
        if (group._resultIndex !== undefined) {
            groupby[i] = ast.columns[group._resultIndex]?.expr;
        }
        else if (group.type === 'number') {
            groupby[i] = ast.columns[(group.value ?? 1) - 1]?.expr;
        }
    }
    const group_map = {};
    row_list.forEach((row) => {
        const key_list = groupby.map((group) => {
            const result = getValue(group, { session, row });
            if (result.err && !err) {
                err = result.err;
            }
            return result.value;
        });
        if (!err) {
            let obj = group_map;
            for (let i = 0; i < count; i++) {
                const key = String(key_list[i]);
                if (i + 1 === count && !obj[key]) {
                    obj[key] = [];
                }
                else if (!obj[key]) {
                    obj[key] = {};
                }
                obj = obj[key];
            }
            obj.push(row);
        }
    });
    if (!err) {
        _unroll(output_list, group_map);
    }
    return { err, row_list: output_list };
}
function _unroll(list, obj) {
    if (Array.isArray(obj)) {
        list.push({ ...obj[0], '@@group': obj });
    }
    else {
        const objMap = obj;
        for (const key in objMap) {
            _unroll(list, objMap[key]);
        }
    }
}

function sort(row_list, orderby, state) {
    try {
        row_list.sort(_sort.bind(null, orderby, state));
    }
    catch (e) {
        return e;
    }
    return null;
}
function _sort(orderby, state, a, b) {
    const order_length = orderby.length;
    for (let i = 0; i < order_length; i++) {
        const order = orderby[i];
        const { expr } = order;
        const func = order.type !== 'DESC' ? _asc : _desc;
        const exprObj = expr;
        if (exprObj?.type === 'number') {
            const index = (exprObj.value ?? 1) - 1;
            const result = func(a['@@result']?.[index]?.value, b['@@result']?.[index]?.value, state.column_list?.[index]);
            if (result !== 0) {
                return result;
            }
        }
        else {
            const a_value = getValue(expr, { ...state, row: a });
            const b_value = getValue(expr, { ...state, row: b });
            const err = a_value.err || b_value.err;
            if (err) {
                throw new SQLError(err);
            }
            const result = func(a_value.value, b_value.value, a_value.type);
            if (result !== 0) {
                return result;
            }
        }
    }
    return 0;
}
function _asc(a, b, column) {
    if (a === b) {
        return 0;
    }
    else if (a === null) {
        return -1;
    }
    else if (b === null) {
        return 1;
    }
    else if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }
    else if ((typeof column === 'object' &&
        column.columnType === 246) ||
        column === 'number') {
        return _convertNum(a) - _convertNum(b);
    }
    else if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
    }
    else {
        return String(a).localeCompare(String(b));
    }
}
function _desc(a, b, column) {
    return _asc(b, a, column);
}
function _convertNum(value) {
    let ret = value;
    if (value === '') {
        ret = 0;
    }
    else if (typeof value === 'string') {
        ret = parseFloat(value);
        if (isNaN(ret)) {
            ret = 0;
        }
    }
    return ret;
}

async function query$7(params) {
    const { output_row_list, column_list } = await internalQuery(params);
    output_row_list?.forEach?.((row) => {
        for (const key in row) {
            row[key] = row[key].value;
        }
    });
    return { output_row_list, column_list };
}
async function internalQuery(params) {
    const { ast, session, dynamodb } = params;
    const current_database = session.getCurrentDatabase();
    if (!params.skip_resolve) {
        const resolve_err = resolveReferences(ast, current_database ?? undefined);
        if (resolve_err) {
            shared.logger.error('select: resolve err:', resolve_err);
            throw new SQLError(resolve_err);
        }
    }
    let source_map = {};
    let column_map = {};
    if (ast?.from?.length) {
        const db = ast.from?.[0]?.db;
        const table = ast.from?.[0]?.table;
        const engine = getEngine(db, table, session);
        const opts = { session, dynamodb, list: ast.from, where: ast.where };
        const result = await engine.getRowList(opts);
        source_map = result.source_map;
        column_map = result.column_map;
    }
    return _evaluateReturn({ ...params, source_map, column_map });
}
function _evaluateReturn(params) {
    const { session, source_map, ast } = params;
    const query_columns = _expandStarColumns(params);
    const { from, where, groupby } = ast;
    let err = null;
    let row_list;
    let sleep_ms = 9;
    if (from) {
        const result = formJoin({ source_map, from, where, session });
        if (result.err) {
            err = result.err;
        }
        else {
            row_list = result.row_list;
        }
    }
    else {
        row_list = [{ 0: {} }];
    }
    if (!err && groupby) {
        const result = formGroup({ groupby, ast, row_list, session });
        if (result.err) {
            err = result.err;
        }
        else {
            row_list = result.row_list;
        }
    }
    const row_count = row_list?.length || 0;
    const column_count = query_columns?.length || 0;
    for (let i = 0; i < row_count && !err; i++) {
        const output_row = [];
        const row = row_list[i];
        for (let j = 0; j < column_count; j++) {
            const column = query_columns[j];
            const result = getValue(column.expr, {
                session,
                row,
            });
            if (result.err) {
                err = result.err;
                break;
            }
            else {
                output_row[j] = result;
                if (result.type !== column.result_type) {
                    column.result_type = _unionType(column.result_type, result.type);
                }
                if (!column.result_name) {
                    column.result_name = result.name;
                }
                if (result.value === null) {
                    column.result_nullable = true;
                }
            }
            if (result.sleep_ms) {
                sleep_ms = result.sleep_ms;
            }
        }
        row['@@result'] = output_row;
    }
    if (err) {
        throw new SQLError(err);
    }
    const column_list = [];
    for (let i = 0; i < column_count; i++) {
        const column = query_columns[i];
        const column_type = convertType(column.result_type, column.result_nullable);
        const exprObj = column.expr;
        column_type.orgName = column.result_name || '';
        column_type.name = column.as || column_type.orgName;
        column_type.orgTable = exprObj?.from?.table || '';
        column_type.table = exprObj?.from?.as || column_type.orgTable;
        column_type.schema = exprObj?.from?.db || '';
        column_list.push(column_type);
    }
    if (ast.orderby) {
        const sort_err = sort(row_list, ast.orderby, {
            session,
            column_list: column_list,
        });
        if (sort_err) {
            throw new SQLError(sort_err);
        }
    }
    let start = 0;
    let end = row_list.length;
    if (ast.limit?.seperator === 'offset') {
        start = ast.limit.value[1].value;
        end = Math.min(end, start + ast.limit.value[0].value);
    }
    else if (ast.limit?.value?.length > 1) {
        start = ast.limit.value[0].value;
        end = Math.min(end, start + ast.limit.value[1].value);
    }
    else if (ast.limit) {
        end = Math.min(end, ast.limit.value[0].value);
    }
    row_list = row_list.slice(start, end);
    const output_row_list = row_list.map((row) => row['@@result']);
    if (sleep_ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ output_row_list, column_list, row_list });
            }, sleep_ms);
        });
    }
    return { output_row_list, column_list, row_list };
}
function _expandStarColumns(params) {
    const { ast, column_map } = params;
    const astObj = ast;
    const ret = [];
    astObj?.columns?.forEach?.((column) => {
        const col = column;
        if (col?.expr?.type === 'column_ref' && col.expr.column === '*') {
            const { db, table } = col.expr;
            const fromList = astObj.from;
            fromList?.forEach((from) => {
                if ((!db && !table) ||
                    (db && from.db === db && from.table === table && !from.as) ||
                    (!db && from.table === table && !from.as) ||
                    (!db && from.as === table)) {
                    const column_list = column_map[from.key ?? ''];
                    if (!column_list?.length) {
                        from._requestSet?.forEach((name) => column_list.push(name));
                    }
                    column_list?.forEach((name) => {
                        ret.push({
                            expr: {
                                type: 'column_ref',
                                db: from.as ? null : from.db,
                                table: from.as ? from.as : from.table,
                                column: name,
                                from: from,
                            },
                            as: null,
                        });
                    });
                }
            });
        }
        else {
            ret.push(col);
        }
    });
    return ret;
}
function _unionType(old_type, new_type) {
    let ret = new_type ?? 'string';
    if (!old_type || old_type === 'null') ;
    else if (new_type === 'null') {
        ret = old_type;
    }
    else if (new_type !== old_type) {
        ret = 'string';
    }
    return ret;
}

async function query$6(params) {
    const { ast, session } = params;
    const database = ast.table?.[0]?.db || session.getCurrentDatabase();
    if (ast.keyword === 'database') {
        return await _createDatabase(params);
    }
    else if (!database) {
        throw new SQLError('no_current_database');
    }
    else if (ast.keyword === 'table') {
        return await _createTable(params);
    }
    else {
        shared.logger.error('unsupported create:', ast.keyword);
        throw new SQLError('unsupported');
    }
}
async function _createDatabase(params) {
    const { ast } = params;
    try {
        createDatabase(getDatabaseName(ast.database));
        return { affectedRows: 1, changedRows: 0 };
    }
    catch (err) {
        if (err === 'database_exists' && ast.if_not_exists) {
            return undefined;
        }
        else if (err && err !== 'database_exists') {
            shared.logger.error('createDatabase: err:', err);
        }
        throw err;
    }
}
async function _createTable(params) {
    const { ast, session, dynamodb } = params;
    const database = ast.table?.[0]?.db || session.getCurrentDatabase();
    const table = ast.table?.[0]?.table;
    const duplicate_mode = ast.ignore_replace;
    const column_list = [];
    let primary_key = [];
    ast.create_definitions?.forEach?.((def) => {
        if (def.resource === 'column') {
            column_list.push({
                name: def.column?.column,
                type: def.definition?.dataType,
                length: def.definition?.length,
            });
            if (def.primary_key === 'primary key') {
                primary_key.push({ name: def.column?.column });
            }
        }
        else if (def.constraint_type === 'primary key') {
            primary_key = def.definition?.map?.((sub) => ({
                name: sub.column,
                order_by: sub.order_by,
            }));
        }
    });
    let list;
    let result;
    // Handle CREATE TABLE AS SELECT
    if (ast.as && ast.query_expr) {
        const opts = { ast: ast.query_expr, session, dynamodb };
        const { output_row_list, column_list: columns } = await internalQuery(opts);
        const track = new Map();
        list = output_row_list.map((row) => {
            const obj = {};
            columns.forEach((column, i) => {
                obj[column.name] = row[i];
            });
            if (!duplicate_mode) {
                const keys = primary_key.map(({ name }) => obj[name].value);
                if (!trackFirstSeen(track, keys)) {
                    throw new SQLError({
                        err: 'dup_primary_key_entry',
                        args: [primary_key.map((key) => key.name), keys],
                    });
                }
            }
            return obj;
        });
    }
    // Create the table
    const options = Object.fromEntries(ast.table_options?.map?.((item) => [item.keyword, item.value]) || []);
    const opts = {
        dynamodb,
        session,
        database,
        table,
        column_list,
        primary_key,
        is_temp: Boolean(ast.temporary),
        table_engine: options['engine'],
    };
    try {
        await createTable(opts);
    }
    catch (err) {
        if (err?.code === 'ER_TABLE_EXISTS_ERROR' && ast.if_not_exists) {
            return undefined;
        }
        throw err;
    }
    // Insert data if any
    if (list?.length > 0) {
        const engine = getEngine(database, table, session);
        const insertOpts = {
            dynamodb,
            session,
            database,
            table,
            list,
            duplicate_mode,
        };
        result = await engine.insertRowList(insertOpts);
    }
    return result;
}

function makeEngineGroups(session, list) {
    const ret = [];
    list.forEach((object) => {
        const { database, table } = object;
        const engine = getEngine(database, table, session);
        const found = ret.find((group) => group.engine === engine);
        if (found) {
            found.list.push(object);
        }
        else {
            ret.push({ engine, list: [object] });
        }
    });
    return ret;
}

async function runSelect(params) {
    const { dynamodb, session, ast } = params;
    const result_list = [];
    // Get table info for all tables
    for (const object of ast.from) {
        const { db, table } = object;
        const engine = getEngine(db, table, session);
        const opts = { dynamodb, session, database: db, table };
        try {
            const result = await engine.getTableInfo(opts);
            if (result?.primary_key?.length > 0) {
                object._keyList = result.primary_key.map((key) => key.name);
                object._keyList.forEach((key) => object._requestSet.add(key));
            }
            else {
                throw new SQLError('bad_schema');
            }
        }
        catch (err) {
            shared.logger.error('SelectModify: getTable: err:', err, table);
            throw err;
        }
    }
    // Run the select query
    const opts = { dynamodb, session, ast, skip_resolve: true };
    const { row_list } = await internalQuery(opts);
    ast.from.forEach((object) => {
        const from_key = object.key;
        const key_list = object._keyList;
        const collection = new Map();
        row_list.forEach((row) => {
            const keys = key_list.map((key) => row[from_key]?.[key]);
            if (!keys.includes(undefined)) {
                _addCollection(collection, keys, row);
            }
        });
        const result = {
            key: from_key,
            list: [],
        };
        result_list.push(result);
        collection.forEach((value0, key0) => {
            if (key_list.length > 1) {
                value0.forEach((value1, key1) => {
                    result.list.push({ key: [key0, key1], row: value1 });
                });
            }
            else {
                result.list.push({ key: [key0], row: value0 });
            }
        });
    });
    return result_list;
}
function _addCollection(collection, keys, value) {
    if (keys.length > 1) {
        let sub_map = collection.get(keys[0]);
        if (!sub_map) {
            sub_map = new Map();
            collection.set(keys[0], sub_map);
        }
        sub_map.set(keys[1], value);
    }
    else {
        collection.set(keys[0], value);
    }
}

async function query$5(params) {
    const { ast, session } = params;
    const current_database = session.getCurrentDatabase();
    const resolve_err = resolveReferences(ast, current_database);
    const database = ast.from?.[0]?.db;
    if (resolve_err) {
        shared.logger.error('resolve_err:', resolve_err);
        throw new SQLError(resolve_err);
    }
    else if (!database) {
        throw new SQLError('no_current_database');
    }
    const opts = { ...params, func: _runDelete };
    return await run(opts);
}
async function _runDelete(params) {
    const { ast, session, dynamodb } = params;
    const database = ast.from?.[0]?.db;
    const table = ast.from?.[0]?.table;
    const engine = getEngine(database, table, session);
    if (ast.from.length === 1) {
        const opts = { dynamodb, session, ast };
        try {
            const result = await engine.singleDelete(opts);
            return { affectedRows: result.affectedRows, changedRows: 0 };
        }
        catch (err) {
            if (err instanceof NoSingleOperationError) {
                return await _multipleDelete(params);
            }
            throw err;
        }
    }
    else {
        return await _multipleDelete(params);
    }
}
async function _multipleDelete(params) {
    const { dynamodb, session, ast } = params;
    let affectedRows = 0;
    // Get rows to delete
    const result_list = await runSelect(params);
    ast.table.forEach((object) => {
        const from_key = object.from.key;
        const list = result_list.find((result) => result.key === from_key)?.list;
        object._deleteList = [];
        list?.forEach?.((item) => object._deleteList.push(item.key));
    });
    // Delete rows
    const from_list = ast.table
        .map((obj) => ({
        database: obj.from.db,
        table: obj.from.table,
        key_list: obj.from._keyList,
        delete_list: obj._deleteList,
    }))
        .filter((obj) => obj.delete_list.length > 0);
    if (from_list.length > 0) {
        const groups = makeEngineGroups(session, from_list);
        for (const group of groups) {
            const { engine, list } = group;
            const opts = { dynamodb, session, list };
            const result = await engine.multipleDelete(opts);
            affectedRows += result.affectedRows;
        }
    }
    return { affectedRows, changedRows: 0 };
}

async function query$4(params) {
    const { ast, session, dynamodb } = params;
    if (ast.keyword === 'database') {
        await dropDatabase({ ...params, database: ast.name });
        return undefined;
    }
    else if (ast.keyword === 'table') {
        const database = ast.name?.[0]?.db || session.getCurrentDatabase();
        const table = ast.name?.[0]?.table;
        if (!database) {
            throw new SQLError('no_current_database');
        }
        const opts = { dynamodb, session, database, table };
        try {
            await dropTable(opts);
            return {};
        }
        catch (err) {
            if (err?.message === 'resource_not_found' && ast.prefix === 'if exists') {
                return undefined;
            }
            else if (err?.message === 'resource_not_found') {
                throw new SQLError({ err: 'ER_BAD_TABLE_ERROR', args: [table] });
            }
            throw err;
        }
    }
    else {
        shared.logger.error('unsupported:', ast);
        throw new SQLError('unsupported');
    }
}

async function query$3(params) {
    const { ast, session } = params;
    const duplicate_mode = ast.type === 'replace'
        ? 'replace'
        : ast.prefix === 'ignore into'
            ? 'ignore'
            : null;
    const database = ast.table?.[0]?.db || session.getCurrentDatabase();
    const table = ast.table?.[0]?.table;
    if (!database) {
        throw new SQLError('no_current_database');
    }
    const err = _checkAst(ast);
    if (err) {
        throw new SQLError(err);
    }
    const engine = getEngine(database, table, session);
    const opts = {
        ...params,
        database,
        engine,
        duplicate_mode,
        func: _runInsert,
    };
    return await run(opts);
}
async function _runInsert(params) {
    const { ast, session, engine, dynamodb, duplicate_mode } = params;
    const table = ast.table?.[0]?.table;
    let list;
    // Build the list of rows to insert
    if (ast.set?.length > 0) {
        const obj = {};
        ast.set.forEach((item) => {
            const expr_result = getValue(item.value, { session });
            if (expr_result.err) {
                throw new SQLError(expr_result.err);
            }
            obj[item.column] = expr_result;
        });
        list = [obj];
    }
    else if (ast.columns?.length > 0 && ast.values.type === 'select') {
        const opts = { ast: ast.values, session, dynamodb };
        const { output_row_list } = await internalQuery(opts);
        list = output_row_list.map((row) => {
            const obj = {};
            ast.columns.forEach((name, i) => {
                obj[name] = row[i];
            });
            return obj;
        });
    }
    else if (ast.columns?.length > 0) {
        list = [];
        const values = ast.values?.type === 'values' ? ast.values.values : ast.values;
        values?.forEach?.((row, i) => {
            const obj = {};
            if (row.value.length === ast.columns.length) {
                ast.columns.forEach((name, j) => {
                    const expr_result = getValue(row.value[j], {
                        session,
                    });
                    if (expr_result.err) {
                        throw new SQLError(expr_result.err);
                    }
                    obj[name] = expr_result;
                });
                list.push(obj);
            }
            else {
                throw new SQLError({ err: 'ER_WRONG_VALUE_COUNT_ON_ROW', args: [i] });
            }
        });
    }
    else {
        shared.logger.error('unsupported insert without column names');
        throw new SQLError('unsupported');
    }
    // Insert the rows
    if (list.length > 0) {
        const opts = {
            dynamodb,
            session,
            database: params.database,
            table,
            list,
            duplicate_mode,
        };
        try {
            return await engine.insertRowList(opts);
        }
        catch (err) {
            const errStr = String(err?.message || '').toLowerCase();
            if (err?.message === 'resource_not_found' ||
                err?.err === 'resource_not_found' ||
                err?.name === 'ResourceNotFoundException' ||
                errStr.includes('resource not found')) {
                throw new SQLError({
                    err: 'table_not_found',
                    args: err?.args || [table],
                });
            }
            throw err;
        }
    }
    else {
        return { affectedRows: 0, changedRows: 0 };
    }
}
function _checkAst(ast) {
    const astObj = ast;
    let err = null;
    if (astObj.values?.type === 'select') {
        if (astObj.columns?.length !== astObj.values.columns?.length) {
            err = { err: 'ER_WRONG_VALUE_COUNT_ON_ROW', args: [1] };
        }
    }
    return err;
}

function query$2(params) {
    const { ast, session } = params;
    const expr = ast?.expr;
    if (expr?.type === 'assign') {
        const { left } = expr;
        const right = getValue(expr.right, { session });
        if (right.err) {
            throw new SQLError(right.err);
        }
        else if (left?.type === 'var' && left.prefix === '@') {
            session.setVariable(left.name, right.value);
        }
        else {
            shared.logger.error('set_handler.query: unsupported left:', left);
            throw new SQLError('unsupported');
        }
    }
}

async function query$1(params) {
    const { ast, session, dynamodb } = params;
    if (ast.keyword === 'databases') {
        const column = Object.assign(convertType('string'), {
            table: 'SCHEMATA',
            orgTable: 'schemata',
            name: 'Database',
            orgName: 'Database',
        });
        const list = getDatabaseList();
        const rows = list?.map?.((item) => [item]);
        return { rows, columns: [column] };
    }
    else if (ast.keyword === 'tables') {
        const database = session.getCurrentDatabase();
        if (!database) {
            throw new SQLError('no_current_database');
        }
        const name = 'Tables_in_' + database;
        const column = Object.assign(convertType('string'), {
            table: 'TABLES',
            orgTable: 'tables',
            name,
            orgName: name,
        });
        const list = await getTableList({ dynamodb, database });
        const rows = list?.map?.((item) => [item]);
        return { rows, columns: [column] };
    }
    else {
        throw new SQLError('unsupported');
    }
}

async function query(params) {
    const { ast, session } = params;
    const current_database = session.getCurrentDatabase();
    ast.from = ast.table;
    delete ast.table;
    const resolve_err = resolveReferences(ast, current_database);
    const database = ast.from?.[0]?.db;
    if (resolve_err) {
        shared.logger.error('resolve_err:', resolve_err);
        throw new SQLError(resolve_err);
    }
    else if (!database) {
        throw new SQLError('no_current_database');
    }
    const opts = { ...params, func: _runUpdate };
    return await run(opts);
}
async function _runUpdate(params) {
    const { ast, session, dynamodb } = params;
    const database = ast.from?.[0]?.db;
    const table = ast.from?.[0]?.table;
    const engine = getEngine(database, table, session);
    if (ast.from.length === 1) {
        const opts = { dynamodb, session, ast };
        try {
            return await engine.singleUpdate(opts);
        }
        catch (err) {
            if (err instanceof NoSingleOperationError) {
                return await _multipleUpdate(params);
            }
            throw err;
        }
    }
    else {
        return await _multipleUpdate(params);
    }
}
async function _multipleUpdate(params) {
    const { dynamodb, session, ast } = params;
    let affectedRows = 0;
    let changedRows = 0;
    // Get rows to update
    const result_list = await runSelect(params);
    ast.from.forEach((object) => {
        const from_key = object.key;
        const list = result_list.find((result) => result.key === from_key)?.list;
        object._updateList = [];
        list?.forEach?.(({ key, row }) => {
            const set_list = ast.set
                .filter((set_item) => set_item.from.key === from_key)
                .map((set_item) => {
                const expr_result = getValue(set_item.value, {
                    session,
                    row,
                });
                if (expr_result.err) {
                    throw new SQLError(expr_result.err);
                }
                return { column: set_item.column, value: expr_result };
            });
            if (set_list.length > 0) {
                object._updateList.push({ key, set_list });
            }
        });
    });
    // Update rows
    const from_list = ast.from
        .map((obj) => ({
        database: obj.db,
        table: obj.table,
        key_list: obj._keyList,
        update_list: obj._updateList,
    }))
        .filter((obj) => obj.update_list.length > 0);
    if (from_list.length > 0) {
        const groups = makeEngineGroups(session, from_list);
        for (const group of groups) {
            const { engine, list } = group;
            const opts = { dynamodb, session, list };
            const result = await engine.multipleUpdate(opts);
            affectedRows += result.affectedRows;
            changedRows += result.changedRows;
        }
    }
    return { affectedRows, changedRows };
}

function typeCast(value, column, options) {
    let ret;
    if (value === null || value === undefined) {
        ret = null;
    }
    else {
        switch (column.columnType) {
            case TYPES.OLDDECIMAL:
            case TYPES.TINY:
            case TYPES.TINYINT:
            case TYPES.SHORT:
            case TYPES.SMALLINT:
            case TYPES.INT:
            case TYPES.LONG:
            case TYPES.FLOAT:
            case TYPES.DOUBLE:
            case TYPES.LONGLONG:
            case TYPES.BIGINT:
            case TYPES.INT24:
            case TYPES.MEDIUMINT:
            case TYPES.YEAR:
            case TYPES.BIT:
            case TYPES.DECIMAL:
                if (typeof value === 'number') {
                    ret = value;
                }
                else if (typeof value === 'string') {
                    ret = parseFloat(value);
                }
                else {
                    ret = parseFloat(String(value));
                }
                break;
            case TYPES.TIMESTAMP:
            case TYPES.DATE:
            case TYPES.DATETIME:
            case TYPES.NEWDATE:
                if (options?.dateStrings) {
                    ret = String(value);
                }
                else if (value instanceof Date) {
                    ret = value;
                }
                else if (value.toDate) {
                    ret = value.toDate();
                }
                else {
                    ret = new Date(String(value));
                }
                break;
            case TYPES.GEOMETRY:
            case TYPES.TIME:
                if (typeof value === 'string') {
                    ret = value;
                }
                else {
                    ret = String(value);
                }
                break;
            case TYPES.VARCHAR:
            case TYPES.ENUM:
            case TYPES.SET:
            case TYPES.VAR_STRING:
            case TYPES.STRING:
                if (column.characterSet === CHARSETS.BINARY) {
                    if (Buffer.isBuffer(ret)) {
                        ret = value;
                    }
                    else {
                        ret = Buffer.from(String(value));
                    }
                }
                else if (typeof value === 'string') {
                    ret = value;
                }
                else {
                    ret = String(value);
                }
                break;
            case TYPES.JSON:
                if (typeof value === 'object') {
                    ret = value;
                }
                else if (typeof value === 'string') {
                    ret = _jsonParse(value);
                }
                else {
                    ret = value;
                }
                break;
            case TYPES.TINYBLOB:
            case TYPES.MEDIUMBLOB:
            case TYPES.LONGBLOB:
            case TYPES.BLOB:
                if (Buffer.isBuffer(value)) {
                    ret = value;
                }
                else {
                    ret = Buffer.from(String(value));
                }
                break;
            case TYPES.NULL:
                ret = value;
                break;
        }
    }
    return ret;
}
function _jsonParse(obj) {
    try {
        return JSON.parse(obj);
    }
    catch {
        return null;
    }
}

const g_parser = new mysqlExports.Parser();
const DEFAULT_RESULT = {
    fieldCount: 0,
    affectedRows: 0,
    insertId: 0,
    message: '',
    changedRows: 0,
    protocol41: true,
};
class Query extends node_events.EventEmitter {
    _session;
    sql;
    values;
    typeCast;
    nestedTables;
    constructor(params) {
        super();
        this._session = params.session;
        this.sql = params.sql;
        this.values = params.values;
        this.typeCast = params.typeCast ?? params.session.typeCast ?? true;
        this.nestedTables = params.nestTables ?? false;
    }
    start() { }
    stream(_options) {
        throw new SQLError('NOT_IMPLEMENTED');
    }
    async run() {
        try {
            const result = await this._run();
            this.emit('end');
            return result;
        }
        catch (e) {
            this.emit('error', e);
            throw e;
        }
    }
    async _run() {
        const { err: parse_err, list } = _astify(this.sql);
        if (parse_err) {
            throw new SQLError(parse_err, this.sql);
        }
        if (list.length === 0) {
            throw new SQLError('ER_EMPTY_QUERY', this.sql);
        }
        if (list.length > 1 && !this._session.multipleStatements) {
            throw new SQLError('multiple_statements_disabled', this.sql);
        }
        const result_list = [];
        const schema_list = [];
        try {
            for (let n = 0; n < list.length; n++) {
                const ast = list[n];
                if (ast) {
                    const { result, columns } = await this._singleQuery(ast);
                    if (result !== undefined) {
                        this._transformResult(result, columns);
                    }
                    result_list[n] = result ?? DEFAULT_RESULT;
                    schema_list[n] = columns;
                }
            }
            if (list.length === 1) {
                return [result_list[0], schema_list[0]];
            }
            else {
                return [result_list, schema_list];
            }
        }
        catch (err) {
            const sql_err = new SQLError(err, this.sql);
            sql_err.index = result_list.length;
            throw sql_err;
        }
    }
    async _singleQuery(ast) {
        const params = {
            ast,
            dynamodb: this._session.dynamodb,
            session: this._session,
        };
        switch (ast?.type) {
            case 'alter':
                return { result: await query$8(params), columns: [] };
            case 'create':
                return { result: await query$6(params), columns: [] };
            case 'delete':
                return { result: await query$5(params), columns: [] };
            case 'drop':
                return { result: await query$4(params), columns: [] };
            case 'insert':
            case 'replace':
                return { result: await query$3(params), columns: [] };
            case 'show': {
                const { rows, columns } = await query$1(params);
                return { result: rows, columns };
            }
            case 'select': {
                const { output_row_list, column_list } = await query$7(params);
                return { result: output_row_list, columns: column_list };
            }
            case 'set':
                query$2(params);
                return { result: undefined, columns: [] };
            case 'update':
                return { result: await query(params), columns: [] };
            case 'use':
                return await _useDatabase({ ast, session: this._session });
            default: {
                const unknownAst = ast;
                shared.logger.error('unsupported statement type:', unknownAst);
                throw new SQLError({
                    err: 'unsupported_type',
                    args: [unknownAst?.type ?? 'unknown'],
                });
            }
        }
    }
    _transformResult(list, columns) {
        if (this._session.resultObjects && Array.isArray(list)) {
            list.forEach((result, i) => {
                const obj = {};
                columns.forEach((column, j) => {
                    const resultArray = result;
                    const value = this._convertCell(resultArray[j], column);
                    if (this.nestedTables === false) {
                        obj[column.name] = value;
                    }
                    else if (typeof this.nestedTables === 'string') {
                        obj[`${column.table}${this.nestedTables}${column.name}`] = value;
                    }
                    else {
                        const tableObj = obj[column.table];
                        if (!tableObj) {
                            obj[column.table] = {};
                        }
                        obj[column.table][column.name] = value;
                    }
                });
                list[i] = obj;
            });
        }
    }
    _convertCell(value, column) {
        if (typeof this.typeCast === 'function') {
            const { type, ...untypedColumn } = column;
            return this.typeCast({
                ...untypedColumn,
                type: String(type),
                length: column.length,
                string: () => (value === null ? null : String(value)),
                buffer: () => (value === null ? null : Buffer.from(String(value))),
            }, () => typeCast(value, column, this._session.typeCastOptions));
        }
        return this.typeCast
            ? typeCast(value, column, this._session.typeCastOptions)
            : value;
    }
}
function _astify(sql) {
    let err = null;
    let list = [];
    try {
        const result = g_parser.astify(sql, { database: 'MySQL' });
        if (Array.isArray(result)) {
            list = result;
        }
        else {
            list = [result];
        }
    }
    catch (e) {
        shared.logger.error('parse error:', e);
        const start = e?.location?.start;
        err = { err: 'parse', args: [start?.line ?? 0, start?.column ?? 0] };
    }
    return { err, list };
}
async function _useDatabase(params) {
    params.session.setCurrentDatabase(params.ast.db);
    return { result: undefined, columns: [] };
}

let g_threadId = 1;
class Session extends node_events.EventEmitter {
    config;
    state = 'connected';
    threadId = g_threadId++;
    dynamodb;
    typeCastOptions = {};
    typeCast = true;
    resultObjects = true;
    multipleStatements = false;
    _currentDatabase = null;
    _localVariables = {};
    _transaction = null;
    _isReleased = false;
    _tempTableMap = {};
    escape = SqlString__namespace.escape;
    escapeId = SqlString__namespace.escapeId;
    format = SqlString__namespace.format;
    constructor(args) {
        super();
        this.config = args || {};
        this.dynamodb = createDynamoDB(args);
        if (args?.database) {
            this.setCurrentDatabase(args.database);
        }
        if (args?.multipleStatements) {
            this.multipleStatements = true;
        }
        if (args?.resultObjects === false) {
            this.resultObjects = false;
        }
        if (args?.typeCast !== undefined) {
            this.typeCast = args.typeCast;
        }
        if (args?.dateStrings) {
            this.typeCastOptions.dateStrings = true;
        }
    }
    release(done) {
        this._isReleased = true;
        done?.();
    }
    end(done) {
        this.release(done);
    }
    destroy() {
        this.release();
    }
    setCurrentDatabase(database, done) {
        this._currentDatabase = database;
        done?.();
    }
    getCurrentDatabase() {
        return this._currentDatabase;
    }
    setVariable(name, value) {
        this._localVariables[name] = value;
    }
    getVariable(name) {
        return this._localVariables[name];
    }
    getTransaction() {
        return this._transaction;
    }
    setTransaction(tx) {
        this._transaction = tx;
    }
    getTempTableList() {
        return Object.entries(this._tempTableMap);
    }
    getTempTable(database, table) {
        const key = database + '.' + table;
        return this._tempTableMap[key];
    }
    saveTempTable(database, table, contents) {
        const key = database + '.' + table;
        this._tempTableMap[key] = contents;
    }
    deleteTempTable(database, table) {
        this.dropTempTable(database, table);
    }
    dropTempTable(database, table) {
        const prefix = database + '.';
        if (table) {
            const key = prefix + table;
            delete this._tempTableMap[key];
        }
        else {
            Object.keys(this._tempTableMap).forEach((key) => {
                if (key.startsWith(prefix)) {
                    delete this._tempTableMap[key];
                }
            });
        }
    }
    query(params, values, done) {
        if (this._isReleased) {
            done?.(new SQLError('released'));
            return;
        }
        const opts = typeof params === 'object' ? { ...params } : { sql: '' };
        if (typeof params === 'string') {
            opts.sql = params;
        }
        if (typeof values === 'function') {
            done = values;
        }
        else if (values !== undefined) {
            opts.values = values;
        }
        if (opts.values !== undefined) {
            opts.sql = SqlString__namespace.format(opts.sql ?? '', opts.values);
        }
        //this._query(opts, done);
        const query = new Query({ ...opts, session: this });
        void this._run(query, done);
        return query;
    }
    createQuery = this.query;
    async _run(query, done) {
        try {
            const [results, fields] = await query.run();
            done?.(null, results, fields);
        }
        catch (e) {
            done?.(e);
        }
    }
}
function createSession$1(args) {
    return new Session(args);
}

function createPool$1(args) {
    return new Pool(args ?? {});
}
class Pool extends node_events.EventEmitter {
    config;
    escape = SqlString__namespace.escape;
    escapeId = SqlString__namespace.escapeId;
    format = SqlString__namespace.format;
    constructor(args) {
        super();
        this.config = args;
    }
    end(done) {
        done?.();
    }
    getConnection(done) {
        done(null, createSession$1(this.config));
    }
    query(opts, values, done) {
        if (typeof values === 'function') {
            done = values;
            values = undefined;
        }
        const session = createSession$1(this.config);
        return session.query(opts, values, (error, results, fields) => {
            session.release();
            done?.(error, results, fields);
        });
    }
}

const createConnection = createSession$1;
const createPool = createPool$1;
const createPoolCluster = createPool$1;
const createSession = createSession$1;
const escape = SqlString__namespace.escape;
const escapeId = SqlString__namespace.escapeId;
const format = SqlString__namespace.format;
const raw = SqlString__namespace.raw;

exports.SQLError = SQLError;
exports.createConnection = createConnection;
exports.createPool = createPool;
exports.createPoolCluster = createPoolCluster;
exports.createSession = createSession;
exports.escape = escape;
exports.escapeId = escapeId;
exports.format = format;
exports.raw = raw;
//# sourceMappingURL=dynamosql.js.map
