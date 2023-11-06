const { isNativeError } = require('node:util').types;
const { CODE_ERRNO } = require('./constants/mysql');
const { jsonStringify } = require('./tools/util');

const DEFAULT_ERRNO = 1002;
const DEFAULT_CODE = 'ER_NO';

const ERROR_MAP = {
  dup_table_insert: {
    code: 'ER_DUP_ENTRY',
    sqlMessage: errStr`Duplicate entry for table '${0}' and item '${1}'`,
  },
  dup: {
    code: 'ER_DUP_ENTRY',
    sqlMessage: 'Duplicate entry',
  },
  parse: {
    code: 'ER_PARSE_ERROR',
    sqlMessage: errStr`You have an error in your SQL syntax; check your syntax near column ${1} at line ${0}`,
  },
  ER_EMPTY_QUERY: {
    code: 'ER_EMPTY_QUERY',
    sqlMessage: 'Query was empty',
  },
  multiple_statements_disabled: {
    code: 'ER_PARSE_ERROR',
    sqlMessage:
      'Multiple statements are disabled.  See the "multipleStatements" session option.',
  },
  unsupported: {
    code: DEFAULT_ERRNO,
    sqlMessage: 'Unsupport sql feature.',
  },
  unsupported_type: {
    code: DEFAULT_ERRNO,
    sqlMessage: errStr`Unsupported query type: ${0}`,
  },
  no_current_database: {
    code: 'ER_NO_DB_ERROR',
    sqlMessage: 'No database selected',
  },
  db_not_found: {
    code: 'ER_BAD_DB_ERROR',
    sqlMessage: errStr`Unknown database '${0}'`,
  },
  table_not_found: {
    code: 'ER_NO_SUCH_TABLE',
    sqlMessage: errStr`Table '${0}' doesn't exist`,
  },
  column_not_found: {
    code: 'ER_BAD_FIELD_ERROR',
    sqlMessage: errStr`Unknown column '${0}'`,
  },
  ER_SP_DOES_NOT_EXIST: {
    code: 'ER_SP_DOES_NOT_EXIST',
    sqlMessage: errStr`FUNCTION ${0} does not exist`,
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
};
class SQLError extends Error {
  constructor(err, sql) {
    const sql_err = ERROR_MAP[err] || ERROR_MAP[err.err];
    const code = err.code || sql_err?.code || DEFAULT_CODE;
    const errno =
      err.errno || sql_err?.errno || CODE_ERRNO[code] || DEFAULT_ERRNO;
    let sqlMessage = err.sqlMessage || sql_err?.sqlMessage;
    if (typeof sqlMessage === 'function') {
      sqlMessage = sqlMessage(err.args);
    }
    const message =
      err.message || sqlMessage || (typeof err === 'string' ? err : undefined);
    if (isNativeError(err)) {
      super(message, { cause: err });
    } else {
      super(message);
    }
    this.code = code;
    this.errno = errno;
    if (sqlMessage) {
      this.sqlMessage = sqlMessage;
    }
    if (sql) {
      this.sql = sql;
    }
  }
}
exports.SQLError = SQLError;

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
  if (
    arg &&
    typeof arg === 'object' &&
    arg.toString === Object.prototype.toString
  ) {
    ret = jsonStringify(arg);
  }
  return ret;
}
