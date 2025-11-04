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

const util = require('node:util');

exports.setLogLevel = setLogLevel;
exports.setRemoteLog = setRemoteLog;
exports.error = error;
exports.info = info;
exports.trace = trace;
exports.inspect = inspect;
exports.always = always;

const LEVEL_NONE = 0;
const LEVEL_ERROR = 1;
const LEVEL_INFO = 2;
const LEVEL_TRACE = 3;
const LEVEL_MAP = {
  NONE: LEVEL_NONE,
  ERROR: LEVEL_ERROR,
  INFO: LEVEL_INFO,
  TRACE: LEVEL_TRACE,
};
exports.LEVEL_NONE = LEVEL_NONE;
exports.LEVEL_ERROR = LEVEL_ERROR;
exports.LEVEL_INFO = LEVEL_INFO;
exports.LEVEL_TRACE = LEVEL_TRACE;

let g_remoteLogFunc = null;
let g_logLevel = LEVEL_NONE;
if (process.env.LOG) {
  const level = LEVEL_MAP[process.env.LOG.toUpperCase()];
  if (level !== undefined) {
    g_logLevel = level;
    trace('log level:', level);
  }
}

function setRemoteLog(func) {
  g_remoteLogFunc = func;
}
function setLogLevel(level) {
  g_logLevel = level;
}
function error() {
  if (g_logLevel >= LEVEL_ERROR) {
    return _log.apply(this, arguments);
  }
}
function info() {
  if (g_logLevel >= LEVEL_INFO) {
    return _log.apply(this, arguments);
  }
}
function trace() {
  if (g_logLevel >= LEVEL_TRACE) {
    return _log.apply(this, arguments);
  }
}
function always() {
  return _log.apply(this, arguments);
}
function _log() {
  const s = util.format.apply(this, arguments);
  console.log('[' + new Date().toUTCString() + '] ' + s);
  g_remoteLogFunc?.(s);
  return s;
}
function inspect() {
  let s = '';
  for (let index in arguments) {
    const a = arguments[index];
    if (index > 0) {
      s += ' ';
    }

    if (typeof a == 'object') {
      s += util.inspect(a, { depth: 99 });
    } else {
      s += a;
    }
  }
  console.log(s);
}

declare namespace logger {
  export {
  };
}

declare const createPool: typeof createPool$1;
declare const createSession: any;

declare const escape: any;
declare const escapeId: any;

export { createPool, createSession, escape, escapeId, logger };
