declare const LEVEL_NONE = 0;
declare const LEVEL_ERROR = 1;
declare const LEVEL_INFO = 2;
declare const LEVEL_TRACE = 3;
declare function setRemoteLog(func: any): void;
declare function setLogLevel(level: number): void;
declare function error(...args: any[]): string;
declare function info(...args: any[]): string;
declare function trace(...args: any[]): string;
declare function always(...args: any[]): string;
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

export { logger };
