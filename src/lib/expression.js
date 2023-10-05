const Functions = require('./functions');
const SystemVariables = require('./system_variables');

const { mapToObject } = require('../tools/dynamodb_helper');
const logger = require('../tools/logger');

exports.getValue = getValue;

function getValue(expr, session, row_map, index) {
  let err = null;
  let type = null;
  let value = null;
  let name = null;

  if (expr.type === 'number') {
    value = expr.value;
  } else if (expr.type === 'double_quote_string') {
    value = expr.value;
  } else if (expr.type === 'function') {
    const func = Functions[expr.name.toLowerCase()];
    if (func) {
      const result = func({ args: expr.args, session });
      if (result.err) {
        err = result.err;
      } else {
        value = result.value;
        type = result.type;
        name = expr.name + '()';
      }
    } else {
      err = 'ER_SP_DOES_NOT_EXIST';
    }
  } else if (expr.type === 'var') {
    const { prefix } = expr;
    if (prefix === '@@') {
      const func = SystemVariables[expr.name.toLowerCase()];
      if (func) {
        value = func(session);
      } else {
        err = 'ER_UNKNOWN_SYSTEM_VARIABLE';
      }
    } else if (prefix === '@') {
      value = session.getVariable(expr.name) ?? null;
    } else {
      err = 'unsupported';
    }
    name = prefix + expr.name;
  } else if (expr.type === 'column_ref') {
    name = expr.column;
    const cell = row_map?.[expr.from?.key]?.[index]?.[name];
    const decode = _decodeCell(cell);
    type = decode?.type;
    value = decode?.value;
  } else {
    logger.error('unsupported expr:', expr);
    err = 'unsupported';
  }

  if (!type) {
    type = value === null ? 'null' : typeof value;
  }
  if (!name) {
    name = value;
  }
  return { err, type, value, name };
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
