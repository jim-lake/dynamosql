'use strict';

var util = require('node:util');

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

var util__namespace = /*#__PURE__*/_interopNamespaceDefault(util);

var LEVEL_NONE = 0;
var LEVEL_ERROR = 1;
var LEVEL_INFO = 2;
var LEVEL_TRACE = 3;
var LEVEL_MAP = {
    NONE: LEVEL_NONE,
    ERROR: LEVEL_ERROR,
    INFO: LEVEL_INFO,
    TRACE: LEVEL_TRACE,
};
var g_remoteLogFunc = null;
var g_logLevel = LEVEL_NONE;
if (process.env.LOG) {
    var level = LEVEL_MAP[process.env.LOG.toUpperCase()];
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
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (g_logLevel >= LEVEL_ERROR) {
        return _log.apply(void 0, args);
    }
}
function info() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (g_logLevel >= LEVEL_INFO) {
        return _log.apply(void 0, args);
    }
}
function trace() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (g_logLevel >= LEVEL_TRACE) {
        return _log.apply(void 0, args);
    }
}
function always() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return _log.apply(void 0, args);
}
function _log() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var s = util__namespace.format.apply(util__namespace, args);
    console.log('[' + new Date().toUTCString() + '] ' + s);
    g_remoteLogFunc === null || g_remoteLogFunc === void 0 ? void 0 : g_remoteLogFunc(s);
    return s;
}
function inspect() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var s = '';
    for (var index in args) {
        var a = args[index];
        if (Number(index) > 0) {
            s += ' ';
        }
        if (typeof a == 'object') {
            s += util__namespace.inspect(a, { depth: 99 });
        }
        else {
            s += a;
        }
    }
    console.log(s);
}

var logger = /*#__PURE__*/Object.freeze({
    __proto__: null,
    LEVEL_ERROR: LEVEL_ERROR,
    LEVEL_INFO: LEVEL_INFO,
    LEVEL_NONE: LEVEL_NONE,
    LEVEL_TRACE: LEVEL_TRACE,
    always: always,
    error: error,
    info: info,
    inspect: inspect,
    setLogLevel: setLogLevel,
    setRemoteLog: setRemoteLog,
    trace: trace
});

exports.logger = logger;
//# sourceMappingURL=index.js.map
