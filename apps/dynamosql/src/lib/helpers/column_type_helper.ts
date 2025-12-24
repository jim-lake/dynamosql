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
        break;
      case 'CHAR':
        charsetNr = COLLATIONS.UTF8_GENERAL_CI;
        type = Types.STRING;
        break;
      case 'TIMESTAMP':
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
      default:
        type = Types.VAR_STRING;
        break;
    }
  } else if (def.type) {
    switch (def.type) {
      case 'double':
        type = Types.DOUBLE;
        break;
      case 'number':
        length = 66;
        type = Types.NEWDECIMAL;
        flags |= FIELD_FLAGS.BINARY;
        decimals = 31;
        break;
      case 'longlong':
        length = 66;
        type = Types.LONGLONG;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'null':
        type = Types.NULL;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'json':
        charsetNr = COLLATIONS.UTF8_GENERAL_CI;
        length = 4294967295;
        type = Types.JSON;
        break;
      case 'datetime':
        length = 26;
        type = Types.DATETIME;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'date':
        length = 10;
        type = Types.DATE;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'time':
        length = 15;
        type = Types.TIME;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'buffer':
        length = 65535;
        type = Types.VAR_STRING;
        flags |= FIELD_FLAGS.BINARY;
        break;
      case 'text':
        charsetNr = COLLATIONS.UTF8_GENERAL_CI;
        length = 150994944;
        type = Types.BLOB;
        decimals = 31;
        break;
      case 'char':
        charsetNr = COLLATIONS.UTF8_GENERAL_CI;
        length = 255;
        type = Types.STRING;
        break;
      case 'string':
      default:
        charsetNr = COLLATIONS.UTF8_GENERAL_CI;
        length = 255;
        type = Types.VAR_STRING;
        break;
    }
  }

  if (def.collation !== undefined) {
    charsetNr = def.collation;
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
