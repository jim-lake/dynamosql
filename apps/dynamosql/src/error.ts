import { CODE_ERRNO } from './constants/mysql';
import { jsonStringify } from './tools/util';

const DEFAULT_CODE = 'ER_NO';

type ErrorTemplate = (args?: unknown[]) => string;

interface ErrorMapEntry {
  code: string;
  sqlMessage?: string | ErrorTemplate;
  errno?: number;
}

export interface IndexError extends Error {
  index?: number;
}

export interface ErrorInput {
  err?: string;
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
  args?: unknown[];
  cause?: unknown;
  index?: number;
}

const ERROR_MAP: Record<string, ErrorMapEntry> = {
  dup_table_insert: {
    code: 'ER_DUP_ENTRY',
    sqlMessage: errStr`Duplicate entry for table '${0}' and item '${1}'`,
  },
  dup: { code: 'ER_DUP_ENTRY', sqlMessage: 'Duplicate entry' },
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
  ER_EMPTY_QUERY: { code: 'ER_EMPTY_QUERY', sqlMessage: 'Query was empty' },
  multiple_statements_disabled: {
    code: 'ER_PARSE_ERROR',
    sqlMessage:
      'Multiple statements are disabled.  See the "multipleStatements" session option.',
  },
  unsupported: { code: 'ER_NO', sqlMessage: 'Unsupport sql feature.' },
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
    sqlMessage: errStr`Unknown table '${0}'`,
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
  ER_BAD_NULL_ERROR: { code: 'ER_BAD_NULL_ERROR' },
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
  ER_UNKNOWN_SYSTEM_VARIABLE: {
    code: 'ER_UNKNOWN_SYSTEM_VARIABLE',
    sqlMessage: errStr`Unknown system variable '${0}'`,
  },
  ER_WRONG_TYPE_FOR_VAR: {
    code: 'ER_WRONG_TYPE_FOR_VAR',
    sqlMessage: errStr`Incorrect argument type to variable '${0}'`,
  },
  ER_UNKNOWN_TIME_ZONE: {
    code: 'ER_UNKNOWN_TIME_ZONE',
    sqlMessage: errStr`Unkown or incorrect time zone: '${0}'`,
  },
  ER_PARSE_ERROR: {
    code: 'ER_PARSE_ERROR',
    sqlMessage: 'You have an error in your SQL syntax.',
  },
  ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT: {
    code: 'ER_WRONG_PARAMCOUNT_TO_NATIVE_FCT',
    sqlMessage: errStr`Incorrect parameter count in the call to native function '${0}'`,
  },
};

export class SQLError extends Error {
  public readonly code: string;
  public readonly errno: number;
  public sqlState?: string;
  public fieldCount?: number;
  public fatal: boolean = false;
  public sqlMessage?: string;
  public sql?: string;
  public index = 0;

  constructor(arg: string | ErrorInput | IndexError, sql?: string) {
    if (typeof arg === 'string') {
      const found = ERROR_MAP[arg];
      if (found !== undefined) {
        const msg = _makeMessage(found, []);
        super(`${found.code}: ${msg}`);
        this.code = found.code;
        this.sqlMessage = msg;
      } else {
        super(arg);
        this.code = DEFAULT_CODE;
      }
      this.errno = CODE_ERRNO[this.code as keyof typeof CODE_ERRNO];
    } else if (arg instanceof SQLError) {
      super(arg.message, { cause: arg });
      this.code = arg.code;
      this.errno = arg.errno;
      this.sql = arg.sql;
      this.sqlMessage = arg.sqlMessage;
      this.index = arg.index;
    } else if (arg instanceof Error) {
      super(arg.message, { cause: arg });
      this.code = DEFAULT_CODE;
      this.errno = CODE_ERRNO[this.code as keyof typeof CODE_ERRNO];
    } else if (typeof arg === 'object') {
      const found = ERROR_MAP[arg.code ?? ''] ?? ERROR_MAP[arg.err ?? ''];
      if (found !== undefined) {
        const msg = _makeMessage(found, arg.args ?? []);
        super(`${found.code}: ${msg}`);
        this.sqlMessage = msg;
        this.code = found.code;
      } else if (arg.code && arg.sqlMessage) {
        super(`${arg.code}: ${arg.sqlMessage}`);
        this.sqlMessage = arg.sqlMessage;
        this.code = arg.code;
      } else {
        super(arg.message ?? arg.err ?? arg.code ?? String(arg));
        this.code = arg.code ?? DEFAULT_CODE;
      }

      if (arg.cause !== undefined) {
        this.cause = arg.cause;
      }
      if (arg.errno !== undefined) {
        this.errno = arg.errno;
      } else {
        this.errno = CODE_ERRNO[this.code as keyof typeof CODE_ERRNO];
      }
    } else {
      super('unknown error');
      this.code = DEFAULT_CODE;
      this.errno = CODE_ERRNO[this.code as keyof typeof CODE_ERRNO];
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
  return function (arg_list?: unknown[]) {
    let s = '';
    for (let i = 0; i < strings.length; i++) {
      s += strings[i];
      const idx = index_list[i];
      s += _stringify(idx !== undefined ? arg_list?.[idx] : undefined);
    }
    return s;
  };
}
function _stringify(arg: unknown): string {
  if (typeof arg === 'string') {
    return arg;
  } else if (arg === null) {
    return 'NULL';
  } else if (arg === undefined) {
    return '';
  } else if (Array.isArray(arg)) {
    return arg.map(_stringify).join(',');
  } else if (
    typeof arg === 'object' &&
    arg.toString === Object.prototype.toString
  ) {
    return jsonStringify(arg);
  } else {
    return String(arg);
  }
}
function _makeMessage(entry: ErrorMapEntry, args: unknown[]) {
  if (typeof entry.sqlMessage === 'function') {
    return entry.sqlMessage(args);
  }
  return entry.sqlMessage;
}

export class NoSingleOperationError extends Error {
  constructor() {
    super('no_single');
    this.name = 'NoSingleOperationError';
  }
}
