import { SQLError } from '../../../error';
import { convertNum } from '../../helpers/sql_conversion';

import type { EvaluationResult } from '../../expression';
import type { CellValue, ColumnDef } from '../index';

export interface CellConvertFlags {
  strict: boolean;
  singleRow: boolean;
  ignore: boolean;
}

export function cellConvert(
  result: EvaluationResult,
  column: ColumnDef,
  flags: CellConvertFlags
): CellValue {
  const { type } = result;
  let { value } = result;
  if (value === null && !column.nullable) {
    if (flags.ignore || (!flags.strict && !flags.singleRow)) {
      value = 0;
    } else {
      throw new SQLError({ err: 'ER_BAD_NULL_ERROR' });
    }
  }
  if (column.type !== 'long' && column.type !== 'longlong') {
    return { type, value };
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return { type, value };
  }
  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    isNaN(Number(value))
  ) {
    if (flags.ignore || !flags.strict) {
      return { type, value: 0 };
    }
    throw new SQLError({ err: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' });
  }
  const num = convertNum(value) ?? 0;
  return { type, value: Math.sign(num) * Math.round(Math.abs(num)) };
}
