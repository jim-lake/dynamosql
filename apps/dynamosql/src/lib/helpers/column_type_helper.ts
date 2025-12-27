import { COLLATIONS, FIELD_FLAGS } from '../../constants/mysql';
import { Types } from '../../types';

import type { FieldInfo } from '../../types';
import type { ColumnDef } from '../engine';

export function convertType(def: Partial<ColumnDef>): FieldInfo {
  let charsetNr = COLLATIONS.BINARY;
  let length = 0;
  let type: Types = Types.VAR_STRING;
  let flags = 0;
  let decimals = 0;
  if (def.mysqlType) {
    switch (def.mysqlType) {
      case 'INT':
        type = Types.LONG;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'BIGINT':
        type = Types.LONGLONG;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'VARCHAR':
        type = Types.VAR_STRING;
        charsetNr = COLLATIONS.UTF8MB4_GENERAL_CI;
        break;
      case 'CHAR':
        type = Types.STRING;
        charsetNr = COLLATIONS.UTF8MB4_GENERAL_CI;
        break;
      case 'TIMESTAMP':
        type = Types.TIMESTAMP;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'DATETIME':
        type = Types.DATETIME;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'DATE':
        type = Types.DATE;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'TIME':
        type = Types.TIME;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'DECIMAL':
        type = Types.NEWDECIMAL;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'BOOLEAN':
        type = Types.TINY;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'TEXT':
      case 'TINYTEXT':
      case 'MEDIUMTEXT':
      case 'LONGTEXT':
        type = Types.BLOB;
        charsetNr = COLLATIONS.UTF8MB4_GENERAL_CI;
        break;
      case 'TINYBLOB':
        type = Types.BLOB;
        length = 255;
        flags |= FIELD_FLAGS.BINARY | FIELD_FLAGS.BLOB;
        break;
      case 'BLOB':
        type = Types.BLOB;
        length = 65535;
        flags |= FIELD_FLAGS.BINARY | FIELD_FLAGS.BLOB;
        break;
      case 'MEDIUMBLOB':
        type = Types.BLOB;
        length = 16777215;
        flags |= FIELD_FLAGS.BINARY | FIELD_FLAGS.BLOB;
        break;
      case 'LONGBLOB':
        type = Types.BLOB;
        length = 4294967295;
        flags |= FIELD_FLAGS.BINARY | FIELD_FLAGS.BLOB;
        break;
      default:
        type = Types.VAR_STRING;
        break;
    }
  } else if (def.type) {
    switch (def.type) {
      case 'double':
        type = Types.DOUBLE;
        flags |= FIELD_FLAGS.BINARY;
        decimals = 31;
        break;
      case 'number':
        type = Types.NEWDECIMAL;
        length = 66;
        flags |= FIELD_FLAGS.BINARY;
        decimals = 31;
        break;
      case 'longlong':
        type = Types.LONGLONG;
        length = 66;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'null':
        type = Types.NULL;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'json':
        type = Types.JSON;
        charsetNr = COLLATIONS.UTF8MB4_GENERAL_CI;
        length = 4294967295;
        break;
      case 'datetime':
        type = Types.DATETIME;
        length = 26;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'date':
        type = Types.DATE;
        length = 10;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'time':
        type = Types.TIME;
        length = 15;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'buffer':
        type = Types.VAR_STRING;
        length = 65535;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'text':
        type = Types.BLOB;
        charsetNr = COLLATIONS.UTF8MB4_GENERAL_CI;
        length = 150994944;
        decimals = 31;
        break;
      case 'char':
        type = Types.STRING;
        charsetNr = COLLATIONS.UTF8MB4_GENERAL_CI;
        length = 255;
        break;
      case 'string':
      default:
        type = Types.VAR_STRING;
        charsetNr = COLLATIONS.UTF8MB4_GENERAL_CI;
        length = 255;
        break;
    }
  }

  if (def.length !== undefined) {
    length = def.length;
  }
  if (def.nullable === false) {
    flags |= FIELD_FLAGS.NOT_NULL;
  }
  if (def.decimals !== undefined) {
    decimals = def.decimals;
  }

  return {
    catalog: 'def',
    db: '',
    table: '',
    orgTable: '',
    name: '',
    orgName: '',
    charsetNr,
    length,
    type,
    flags,
    decimals,
    zeroFill: false,
    protocol41: true,
  };
}
