import * as MYSQL from '../../constants/mysql';

export function convertType(type: any, nullable?: boolean): any {
  let ret = type;
  if (type === 'number') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.BINARY,
      columnLength: 66,
      columnType: MYSQL.TYPES.DECIMAL,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 31,
    };
  } else if (type === 'bigint') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.BINARY,
      columnLength: 66,
      columnType: MYSQL.TYPES.BIGINT,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
    };
  } else if (type === 'null') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.BINARY,
      columnLength: 0,
      columnType: MYSQL.TYPES.NULL,
      flags: MYSQL.FIELD_FLAGS.BINARY,
      decimals: 0,
    };
  } else if (type === 'json') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.UTF8_GENERAL_CI,
      columnLength: 4294967295,
      columnType: MYSQL.TYPES.JSON,
      flags: 0,
      decimals: 0,
    };
  } else if (type === 'datetime') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.BINARY,
      columnLength: 26,
      columnType: MYSQL.TYPES.DATETIME,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
    };
  } else if (type === 'date') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.BINARY,
      columnLength: 10,
      columnType: MYSQL.TYPES.DATE,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
    };
  } else if (type === 'time') {
    ret = {
      catalog: 'def',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.BINARY,
      columnLength: 15,
      columnType: MYSQL.TYPES.TIME,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
    };
  } else if (type === 'buffer') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.BINARY,
      columnLength: 255,
      columnType: MYSQL.TYPES.VAR_STRING,
      flags:
        MYSQL.FIELD_FLAGS.NOT_NULL |
        MYSQL.FIELD_FLAGS.BINARY |
        MYSQL.FIELD_FLAGS.UNSIGNED,
      decimals: 0,
    };
  } else if (type === 'string' || typeof type !== 'object') {
    ret = {
      catalog: 'def',
      table: '',
      schema: '',
      orgTable: '',
      name: '',
      orgName: '',
      characterSet: MYSQL.CHARSETS.UTF8_GENERAL_CI,
      columnLength: 255,
      columnType: MYSQL.TYPES.VAR_STRING,
      flags: MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 31,
    };
  }
  if (ret && nullable === true) {
    ret.flags &= ~MYSQL.FIELD_FLAGS.NOT_NULL;
  }
  return ret;
}
