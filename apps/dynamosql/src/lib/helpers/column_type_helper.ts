import { CHARSETS, FIELD_FLAGS } from '../../constants/mysql';
import { Types } from '../../types';

import type { FieldInfo } from '../../types';

export function convertType(type?: string, nullable?: boolean): FieldInfo {
  const flags = nullable !== true ? FIELD_FLAGS.NOT_NULL : 0;
  switch (type?.toLowerCase()) {
    case 'double':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 23,
        type: Types.DOUBLE,
        flags: flags | FIELD_FLAGS.BINARY,
        decimals: 31,
        zeroFill: false,
        protocol41: true,
      };
    case 'decimal':
    case 'number':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 66,
        type: Types.NEWDECIMAL,
        flags: flags | FIELD_FLAGS.BINARY,
        decimals: 31,
        zeroFill: false,
        protocol41: true,
      };
    case 'bigint':
    case 'longlong':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 66,
        type: Types.LONGLONG,
        flags: flags | FIELD_FLAGS.BINARY,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'null':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 0,
        type: Types.NULL,
        flags: FIELD_FLAGS.BINARY,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'json':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.UTF8_GENERAL_CI,
        length: 4294967295,
        type: Types.JSON,
        flags,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'datetime':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 26,
        type: Types.DATETIME,
        flags: flags | FIELD_FLAGS.BINARY,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'date':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 10,
        type: Types.DATE,
        flags: flags | FIELD_FLAGS.BINARY,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'time':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 15,
        type: Types.TIME,
        flags: flags | FIELD_FLAGS.BINARY,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'buffer':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.BINARY,
        length: 65535,
        type: Types.VAR_STRING,
        flags: flags | FIELD_FLAGS.BINARY,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'text':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.UTF8_GENERAL_CI,
        length: 150994944,
        type: Types.BLOB,
        flags,
        decimals: 31,
        zeroFill: false,
        protocol41: true,
      };
    case 'char':
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.UTF8_GENERAL_CI,
        length: 255,
        type: Types.STRING,
        flags,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
    case 'string':
    default:
      return {
        catalog: 'def',
        db: '',
        table: '',
        orgTable: '',
        name: '',
        orgName: '',
        charsetNr: CHARSETS.UTF8_GENERAL_CI,
        length: 255,
        type: Types.VAR_STRING,
        flags,
        decimals: 0,
        zeroFill: false,
        protocol41: true,
      };
  }
}
