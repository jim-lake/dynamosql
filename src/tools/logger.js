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
let g_logLevel = LEVEL_ERROR;
if (process.env.LOG) {
  const level = LEVEL_MAP[process.env.LOG];
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
