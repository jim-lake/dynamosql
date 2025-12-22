import { SQLDateTime } from '../types/sql_datetime';
import { SQLTime } from '../types/sql_time';

import type { EvaluationResult } from '../expression';

export function getDecimalsForString(s: string): number {
  return _scaleNumberString(s);
}
export function getDecimals(result: EvaluationResult): number {
  if (result.decimals !== undefined) {
    return result.decimals;
  } else if (result.value instanceof SQLDateTime) {
    return result.value.getDecimals();
  } else if (result.value instanceof SQLTime) {
    return result.value.getDecimals();
  } else {
    switch (result.type) {
      case 'string':
      case 'double':
        return 31;
      case 'number':
        if (typeof result.value === 'number') {
          return _scaleNumber(result.value);
        }
        break;
      default:
        break;
    }
  }
  return 0;
}
function _scaleNumber(n: number): number {
  return _scaleNumberString(String(n));
}
function _scaleNumberString(s: string): number {
  const e = s.indexOf('e');
  if (e !== -1) {
    const coeff = s.slice(0, e);
    const exp = parseInt(s.slice(e + 1), 10);
    const dot = coeff.indexOf('.');
    const digits = dot === -1 ? 0 : coeff.length - dot - 1;
    return Math.max(0, digits - exp);
  }
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}
