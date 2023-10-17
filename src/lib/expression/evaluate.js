// first to ignore circles
exports.getValue = getValue;

const BinaryExpression = require('./binary_expression');
const Functions = require('./functions');
const UnaryExpression = require('./unary_expression');
const SystemVariables = require('../system_variables');

const { mapToObject } = require('../../tools/dynamodb_helper');
const logger = require('../../tools/logger');

function getValue(expr, state) {
  const { session, row, column_list } = state;
  let result = { err: null, type: null, value: null, name: null };

  if (expr.type === 'number') {
    result.value = expr.value;
  } else if (expr.type === 'double_quote_string') {
    result.value = expr.value;
    result.name = `"${result.value}"`;
  } else if (expr.type === 'null') {
    result.value = null;
  } else if (expr.type === 'bool') {
    result.value = expr.value ? 1 : 0;
    result.name = expr.value ? 'TRUE' : 'FALSE';
  } else if (expr.type === 'function') {
    const func = Functions[expr.name.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = expr.name + '()';
      }
    } else {
      result.err = 'ER_SP_DOES_NOT_EXIST';
    }
  } else if (expr.type === 'binary_expr') {
    const func = BinaryExpression[expr.operator.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = expr.operator;
      }
    } else {
      result.err = 'ER_SP_DOES_NOT_EXIST';
    }
  } else if (expr.type === 'unary_expr') {
    const func = UnaryExpression[expr.operator.toLowerCase()];
    if (func) {
      result = func(expr, state);
      if (!result.name) {
        result.name = expr.operator;
      }
    } else {
      logger.inspect(expr);
      result.err = 'ER_SP_DOES_NOT_EXIST';
    }
  } else if (expr.type === 'var') {
    const { prefix } = expr;
    if (prefix === '@@') {
      const func = SystemVariables[expr.name.toLowerCase()];
      if (func) {
        result.value = func(session);
      } else {
        result.err = 'ER_UNKNOWN_SYSTEM_VARIABLE';
      }
    } else if (prefix === '@') {
      result.value = session.getVariable(expr.name) ?? null;
    } else {
      result.err = 'unsupported';
    }
    result.name = prefix + expr.name;
  } else if (expr.type === 'column_ref') {
    result.name = expr.column;
    if (row && expr.result_index >= 0) {
      result.value = row['@@result']?.[expr.result_index];
      result.type = column_list?.[expr.result_index]?.result_type;
    } else if (row) {
      const cell = row[expr.from?.key]?.[expr.column];
      const decode = _decodeCell(cell);
      result.type = decode?.type;
      result.value = decode?.value;
    } else {
      result.err = 'no_row_list';
      result.value = expr.column;
    }
  } else {
    logger.error('unsupported expr:', expr);
    result.err = 'unsupported';
  }

  if (!result.type) {
    result.type = result.value === null ? 'null' : typeof result.value;
  }
  if (!result.name) {
    result.name = String(result.value);
  }
  return result;
}

function _decodeCell(cell) {
  let type;
  let value;
  if (!cell || cell.NULL) {
    type = 'null';
    value = null;
  } else if (cell.S) {
    type = 'string';
    value = cell.S;
  } else if (cell.N) {
    type = 'number';
    value = cell.N;
  } else if (cell.BOOL) {
    type = 'boolean';
    value = cell.BOOL;
  } else if (cell.M) {
    type = 'json';
    value = mapToObject(cell.M);
  } else {
    logger.error('invalid cell:', cell);
  }
  return { type, value };
}
