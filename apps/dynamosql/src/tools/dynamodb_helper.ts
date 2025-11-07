export function pql(strings: TemplateStringsArray, ...values: any[]) {
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

export function escapeIdentifier(string: string) {
  return '"' + string.replace('"', '""') + '"';
}

export function escapeString(string: string) {
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

export function escapeValue(value: any, type?: string): string {
  let s: string;
  if (type === 'string') {
    s = "'" + escapeString(String(value)) + "'";
  } else if (type === 'number') {
    s = escapeNumber(value);
  } else if (value === null) {
    s = 'NULL';
  } else if (Array.isArray(value)) {
    s = '[ ';
    s += value.map((v) => escapeValue(v)).join(', ');
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

export function convertError(err: any) {
  if (!err) return err;

  let ret: any;
  if (err.name === 'ConditionalCheckFailedException' && err.Item) {
    ret = new Error('cond_fail');
  } else if (err.Code === 'ConditionalCheckFailed') {
    ret = new Error('cond_fail');
  } else if (
    err.name === 'ResourceNotFoundException' ||
    err.Code === 'ResourceNotFound' ||
    (err.message && err.message.includes('resource not found'))
  ) {
    ret = new Error('resource_not_found');
  } else if (
    err.name === 'ResourceInUseException' ||
    (err.message && err.message.includes('resource in use'))
  ) {
    ret = new Error('resource_in_use');
  } else if (err.Code === 'ValidationError' || err.name === 'ValidationError') {
    if (err.Message?.match?.(/expected: [^\s]* actual: NULL/)) {
      ret = new Error('ER_BAD_NULL_ERROR');
    } else if (err.Message?.match?.(/expected: [^\s]* actual:/)) {
      ret = new Error('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD');
    } else {
      ret = new Error('validation');
    }
  } else {
    ret = err;
  }
  return ret;
}

export function mapToObject(obj: any) {
  const ret: any = {};
  ret.toString = toString;
  Object.keys(obj).forEach((key) => {
    ret[key] = valueToNative(obj[key]);
  });
  return ret;
}

export function valueToNative(value: any): any {
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

export function nativeToValue(obj: any): any {
  let ret: any;
  if (obj === null) {
    ret = { NULL: true };
  } else if (typeof obj === 'object') {
    const M: any = {};
    for (const key in obj) {
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

export function convertValueToPQL(value: any) {
  let ret: string;
  if (!value) {
    ret = 'NULL';
  } else if (value.S !== undefined) {
    ret = "'" + escapeString(value.S) + "'";
  } else if (value.N !== undefined) {
    ret = value.N;
  } else {
    ret = "'" + escapeString(String(value)) + "'";
  }
  return ret;
}

export function convertSuccess(result: any): [any, any] {
  let err: any = null;
  let ret: any;
  if (result?.Responses) {
    ret = [];
    result.Responses.forEach((response: any, i: number) => {
      if (response.Error) {
        if (!err) {
          err = [];
        }
        err[i] = convertError(response.Error);
      }
      ret[i] = convertResult(response);
    });
  } else {
    ret = convertResult(result);
  }
  return [err, ret];
}

export function convertResult(result: any) {
  let ret: any;
  if (result?.Items) {
    ret = result.Items;
  } else if (result?.Item) {
    ret = [result?.Item];
  }
  return ret;
}

export function dynamoType(type: string) {
  let ret = type;
  if (type === 'string') {
    ret = 'S';
  } else if (type === 'VARCHAR') {
    ret = 'S';
  } else if (type === 'INT') {
    ret = 'N';
  } else if (type === 'number') {
    ret = 'N';
  } else if (type === 'blob') {
    ret = 'B';
  }
  return ret;
}
