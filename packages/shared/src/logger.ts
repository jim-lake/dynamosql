import * as util from 'node:util';

export const LEVEL_NONE = 0;
export const LEVEL_ERROR = 1;
export const LEVEL_INFO = 2;
export const LEVEL_TRACE = 3;
const LEVEL_MAP: any = {
  NONE: LEVEL_NONE,
  ERROR: LEVEL_ERROR,
  INFO: LEVEL_INFO,
  TRACE: LEVEL_TRACE,
};

let g_remoteLogFunc: any = null;
let g_logLevel = LEVEL_NONE;
if (process.env.LOG) {
  const level = LEVEL_MAP[process.env.LOG.toUpperCase()];
  if (level !== undefined) {
    g_logLevel = level;
    trace('log level:', level);
  }
}

export function setRemoteLog(func: any) {
  g_remoteLogFunc = func;
}

export function setLogLevel(level: number) {
  g_logLevel = level;
}

export function error(...args: any[]) {
  if (g_logLevel >= LEVEL_ERROR) {
    return _log(...args);
  }
}

export function info(...args: any[]) {
  if (g_logLevel >= LEVEL_INFO) {
    return _log(...args);
  }
}

export function trace(...args: any[]) {
  if (g_logLevel >= LEVEL_TRACE) {
    return _log(...args);
  }
}

export function always(...args: any[]) {
  return _log(...args);
}

function _log(...args: any[]) {
  const s = util.format(...args);
  console.log('[' + new Date().toUTCString() + '] ' + s);
  g_remoteLogFunc?.(s);
  return s;
}

export function inspect(...args: any[]) {
  let s = '';
  for (let index in args) {
    const a = args[index];
    if (Number(index) > 0) {
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
