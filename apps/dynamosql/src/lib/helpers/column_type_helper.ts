import * as MYSQL from '../../constants/mysql';
import { Types } from '../../types';
import type { FieldInfo } from '../../types';

export function convertType(type: unknown, nullable?: boolean): FieldInfo {
  let ret: FieldInfo | undefined;
  if (type === 'number') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.BINARY,
      length: 66,
      type: Types.NEWDECIMAL,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 31,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'bigint') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.BINARY,
      length: 66,
      type: Types.LONGLONG,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'null') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.BINARY,
      length: 0,
      type: Types.NULL,
      flags: MYSQL.FIELD_FLAGS.BINARY,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'json') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.UTF8_GENERAL_CI,
      length: 4294967295,
      type: Types.JSON,
      flags: 0,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'datetime') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.BINARY,
      length: 26,
      type: Types.DATETIME,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'date') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.BINARY,
      length: 10,
      type: Types.DATE,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'time') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.BINARY,
      length: 15,
      type: Types.TIME,
      flags: MYSQL.FIELD_FLAGS.BINARY | MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'buffer') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.BINARY,
      length: 255,
      type: Types.VAR_STRING,
      flags:
        MYSQL.FIELD_FLAGS.NOT_NULL |
        MYSQL.FIELD_FLAGS.BINARY |
        MYSQL.FIELD_FLAGS.UNSIGNED,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  } else if (type === 'string' || typeof type !== 'object') {
    ret = {
      catalog: 'def',
      db: '',
      table: '',
      orgTable: '',
      name: '',
      orgName: '',
      charsetNr: MYSQL.CHARSETS.UTF8_GENERAL_CI,
      length: 255,
      type: Types.VAR_STRING,
      flags: MYSQL.FIELD_FLAGS.NOT_NULL,
      decimals: 0,
      zeroFill: false,
      protocol41: true,
    };
  }
  if (ret && nullable === true) {
    ret.flags &= ~MYSQL.FIELD_FLAGS.NOT_NULL;
  }
  return ret;
}
