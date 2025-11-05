import { getValue } from './evaluate';
import { convertNum } from '../helpers/sql_conversion';

function plus(expr: any, state: any): any {
  return getValue(expr.expr, state);
}

function not(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = 'NOT ' + result.name;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = convertNum(result.value) ? 0 : 1;
  }
  return result;
}

function minus(expr: any, state: any): any {
  const result = getValue(expr.expr, state);
  result.name = '-' + result.name;
  result.type = 'number';
  if (!result.err && result.value !== null) {
    result.value = -convertNum(result.value);
  }
  return result;
}

export { plus as '+', not as '!', not as 'not', minus as '-' };
