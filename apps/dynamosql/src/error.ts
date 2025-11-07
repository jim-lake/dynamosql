import { types } from 'node:util';
import { CODE_ERRNO } from './constants/mysql';
import { jsonStringify } from './tools/util';

const { isNativeError } = types;
const DEFAULT_ERRNO = 1002;
const DEFAULT_CODE = 'ER_NO';

type ErrorTemplate = (args?: any[]) => string;

interface ErrorMapEntry {
  code: string;
  sqlMessage?: string | ErrorTemplate;
  errno?: number;
}

interface ErrorInput {
  err?: string;
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
  args?: any[];
  cause?: Error;
  index?: number;
}

const ERROR_MAP: Record<string, ErrorMapEntry> = {
  dup_table_insert: {
    code: 'ER_DUP_ENTRY',
    sqlMessage: errStr`Duplicate entry for table '${0}' and item '${1}'`,
  },
  dup: {
    code: 'ER_DUP_ENTRY',
    sqlMessage: 'Duplicate entry',
  },
  dup_primary_key_entry: {
    code: 'ER_DUP_ENTRY',
    sqlMessage: errStr`Duplicate entry for value '${1}' for '${0}'`,
  },
  parse: {
    code: 'ER_PARSE_ERROR',
    sqlMessage: errStr`You have an error in your SQL syntax; check your syntax near column ${1} at line ${0}`,
  },
  syntax_err: {
    code: 'ER_PARSE_ERROR',
    sqlMessage: errStr`You have an error in your SQL syntax; check your syntax near ${0}`,
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
    code: 'ER_NO',
    sqlMessage: 'Unsupport sql feature.',
  },
  unsupported_type: {
    code: 'ER_NO',
    sqlMessage: errStr`Unsupported query type: ${0}`,
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
  ER_BAD_TABLE_ERROR: {
    code: 'ER_BAD_TABLE_ERROR',
    sqlMessage: errStr`Unknown  table '${0}'`,
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
  ER_WRONG_VALUE_COUNT_ON_ROW: {
    code: 'ER_WRONG_VALUE_COUNT_ON_ROW',
    sqlMessage: errStr`Column count doesn't match value count at row ${0}`,
  },
  ER_BAD_NULL_ERROR: {
    code: 'ER_BAD_NULL_ERROR',
  },
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: {
    code: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
  },
  ER_KEY_COLUMN_DOES_NOT_EXITS: {
    code: 'ER_KEY_COLUMN_DOES_NOT_EXITS',
    sqlMessage: errStr`Key column '${0}' doesn't exist in table`,
  },
  ER_DUP_KEYNAME: {
    code: 'ER_DUP_KEYNAME',
    sqlMessage: errStr`Duplicate key name '${0}'`,
  },
  ER_CANT_DROP_FIELD_OR_KEY: {
    code: 'ER_CANT_DROP_FIELD_OR_KEY',
    sqlMessage: errStr`Can't DROP '${0}'; check that column/key exists`,
  },
  ER_UNKNOWN_STORAGE_ENGINE: {
    code: 'ER_UNKNOWN_STORAGE_ENGINE',
    sqlMessage: errStr`Unknown storage engine '${0}'`,
  },
  access_denied: {
    code: 'ER_DBACCESS_DENIED_ERROR',
    sqlMessage: 'Access denied',
  },
};

export class SQLError extends Error {
  code: string;
  errno: number;
  sqlStateMarker?: string;
  sqlState?: string;
  fieldCount?: number;
  fatal: boolean = false;
  sqlMessage?: string;
  sql?: string;
  index: number;

  constructor(err: string | ErrorInput, sql?: string) {
    const sql_err =
      ERROR_MAP[err as string] || ERROR_MAP[(err as ErrorInput).err!];
    const code = (err as ErrorInput).code || sql_err?.code || DEFAULT_CODE;
    const errno =
      (err as ErrorInput).errno ||
      sql_err?.errno ||
      CODE_ERRNO[code] ||
      DEFAULT_ERRNO;
    let sqlMessage = (err as ErrorInput).sqlMessage || sql_err?.sqlMessage;
    if (typeof sqlMessage === 'function') {
      sqlMessage = sqlMessage((err as ErrorInput).args);
    }
    const index = typeof err === 'string' ? 0 : (err.index ?? 0);
    const message =
      (err as ErrorInput).message ||
      sqlMessage ||
      (typeof err === 'string' ? err : undefined);
    if ((err as ErrorInput).cause) {
      super(message, { cause: (err as ErrorInput).cause });
    } else if (isNativeError(err) || code === DEFAULT_CODE) {
      super(message, { cause: err });
    } else {
      super(message);
    }
    this.code = code;
    this.errno = errno;
    this.index = index;
    if (sqlMessage) {
      this.sqlMessage = sqlMessage as string;
    }
    if (sql) {
      this.sql = sql;
    }
  }
}

function errStr(
  strings: TemplateStringsArray,
  ...index_list: number[]
): ErrorTemplate {
  return function (arg_list?: any[]) {
    let s = '';
    for (let i = 0; i < strings.length; i++) {
      s += strings[i];
      s += _stringify(arg_list?.[index_list?.[i]]);
    }
    return s;
  };
}

function _stringify(arg: any): string {
  let ret = arg || '';
  if (arg === null) {
    ret = 'NULL';
  } else if (Array.isArray(arg)) {
    ret = arg.map(_stringify).join(',');
  } else if (
    typeof arg === 'object' &&
    arg.toString === Object.prototype.toString
  ) {
    ret = jsonStringify(arg);
  }
  return ret;
}

export class NoSingleOperationError extends Error {
  constructor() {
    super('no_single');
    this.name = 'NoSingleOperationError';
  }
}
