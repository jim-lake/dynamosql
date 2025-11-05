export {
  pql,
  escapeIdentifier,
  escapeString,
  escapeValue,
  convertError,
  mapToObject,
  valueToNative,
  nativeToValue,
};

function pql(strings: TemplateStringsArray, ...values: any[]) {
  let s = '';
  for (let i = 0; i < strings.length; i++) {
    s += strings[i];
    if (i < values.length) {
      s += escapeValue(values[i]);
    }
  }
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function escapeIdentifier(string: string) {
  return '"' + string.replace('"', '""') + '"';
}

function escapeString(string: string) {
  let ret = '';
  for (let i = 0; i < string.length; i++) {
    const c = string.charCodeAt(i);
    if (c < 32) {
      ret += '\\x' + c.toString(16);
    } else if (c === 39) {
      ret += "''";
    } else {
      ret += string[i];
    }
  }
  return ret;
}

function escapeNumber(value: any) {
  return String(value).replace(/[^0-9.]/g, '');
}

function escapeValue(value: any, type?: string): string {
  let s: string;
  if (type === 'string') {
    s = "'" + escapeString(String(value)) + "'";
  } else if (type === 'number') {
    s = escapeNumber(value);
  } else if (value === null) {
    s = 'NULL';
  } else if (Array.isArray(value)) {
    s = '[ ';
    s += value.map(escapeValue).join(', ');
    s += ' ]';
  } else if (typeof value === 'object') {
    s = '{ ';
    s += Object.keys(value)
      .map((key) => `'${key}': ${escapeValue(value[key])}`)
      .join(', ');
    s += ' }';
  } else if (typeof value === 'number') {
    s = String(value);
  } else if (value !== undefined) {
    s = "'" + escapeString(String(value)) + "'";
  } else {
    s = 'undefined';
  }
  return s;
}

function convertError(err: any) {
  let ret: any = err;
  if (err.name === 'ConditionalCheckFailedException' && err.Item) {
    ret = 'cond_fail';
  } else if (err.Code === 'ConditionalCheckFailed') {
    ret = 'cond_fail';
  } else if (
    err.name === 'ResourceNotFoundException' ||
    err.Code === 'ResourceNotFound'
  ) {
    ret = 'resource_not_found';
  } else if (err.name === 'ResourceInUseException') {
    ret = 'resource_in_use';
  } else if (err.Code === 'ValidationError' || err.name === 'ValidationError') {
    if (err.Message?.match?.(/expected: [^\s]* actual: NULL/)) {
      ret = 'ER_BAD_NULL_ERROR';
    } else if (err.Message?.match?.(/expected: [^\s]* actual:/)) {
      ret = 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD';
    } else {
      ret = 'validation';
    }
  }
  return ret;
}

function mapToObject(obj: any) {
  const ret: any = {};
  ret.toString = toString;
  Object.keys(obj).forEach((key) => {
    ret[key] = valueToNative(obj[key]);
  });
  return ret;
}

function valueToNative(value: any): any {
  let ret = value;
  if (value) {
    if (value.N) {
      ret = parseFloat(value.N);
    } else if (value.L?.map) {
      ret = value.L.map(valueToNative);
    } else if (value.M) {
      ret = mapToObject(value.M);
    } else {
      ret = value.S ?? value.B ?? value.BOOL ?? value;
    }
  }
  return ret;
}

function nativeToValue(obj: any): any {
  let ret: any;
  if (obj === null) {
    ret = { NULL: true };
  } else if (typeof obj === 'object') {
    const M: any = {};
    for (let key in obj) {
      M[key] = nativeToValue(obj[key]);
    }
    ret = { M };
  } else if (typeof obj === 'number') {
    ret = { N: String(obj) };
  } else if (typeof obj === 'boolean') {
    ret = { BOOL: obj };
  } else {
    ret = { S: String(obj) };
  }
  return ret;
}

function toString(this: any) {
  return JSON.stringify(this);
}
