import type { ScalarAttributeType } from '@aws-sdk/client-dynamodb';

export function pql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
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

export function escapeIdentifier(string: string): string {
  return '"' + string.replace('"', '""') + '"';
}

export function escapeString(string: string): string {
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

function escapeNumber(value: unknown): string {
  return String(value).replace(/[^0-9.]/g, '');
}

export function escapeValue(value: unknown, type?: string): string {
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
      .map(
        (key) =>
          `'${key}': ${escapeValue((value as Record<string, unknown>)[key])}`
      )
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

export function convertError(err: unknown): any {
  if (!err) return err;

  let ret: any;
  if (err && typeof err === 'object') {
    const error = err as any;
    if (error.name === 'ConditionalCheckFailedException' && error.Item) {
      ret = new Error('cond_fail');
    } else if (error.Code === 'ConditionalCheckFailed') {
      ret = new Error('cond_fail');
    } else if (
      error.name === 'ResourceNotFoundException' ||
      error.Code === 'ResourceNotFound' ||
      (error.message && String(error.message).includes('resource not found'))
    ) {
      ret = new Error('resource_not_found');
    } else if (
      error.name === 'ResourceInUseException' ||
      (error.message && String(error.message).includes('resource in use'))
    ) {
      ret = new Error('resource_in_use');
    } else if (
      error.Code === 'ValidationError' ||
      error.name === 'ValidationError'
    ) {
      if (error.Message?.match?.(/expected: [^\s]* actual: NULL/)) {
        ret = new Error('ER_BAD_NULL_ERROR');
      } else if (error.Message?.match?.(/expected: [^\s]* actual:/)) {
        ret = new Error('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD');
      } else {
        ret = new Error('validation');
      }
    } else {
      ret = err;
    }
  } else {
    ret = err;
  }
  return ret;
}

export function mapToObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const ret: Record<string, unknown> = {};
  (ret as any).toString = toString;
  Object.keys(obj).forEach((key) => {
    ret[key] = valueToNative(obj[key]);
  });
  return ret;
}

export function valueToNative(value: unknown): unknown {
  let ret = value;
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (v.N) {
      ret = parseFloat(v.N as string);
    } else if (Array.isArray(v.L)) {
      ret = v.L.map(valueToNative);
    } else if (v.M) {
      ret = mapToObject(v.M as Record<string, unknown>);
    } else {
      ret = v.S ?? v.B ?? v.BOOL ?? value;
    }
  }
  return ret;
}

export function nativeToValue(
  obj: unknown
):
  | { M: Record<string, unknown> }
  | { N: string }
  | { BOOL: boolean }
  | { S: string }
  | { NULL: true } {
  if (obj === null) {
    return { NULL: true };
  } else if (typeof obj === 'object') {
    const M: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      M[key] = nativeToValue((obj as Record<string, unknown>)[key]);
    }
    return { M };
  } else if (typeof obj === 'number') {
    return { N: String(obj) };
  } else if (typeof obj === 'boolean') {
    return { BOOL: obj };
  } else {
    return { S: String(obj) };
  }
}

function toString(this: Record<string, unknown>): string {
  return JSON.stringify(this);
}

export function convertValueToPQL(value: unknown): string {
  let ret: string;
  if (!value) {
    ret = 'NULL';
  } else if (typeof value === 'object' && value !== null) {
    const v = value as Record<string, unknown>;
    if (v.S !== undefined) {
      ret = "'" + escapeString(v.S as string) + "'";
    } else if (v.N !== undefined) {
      ret = String(v.N);
    } else {
      ret = "'" + escapeString(String(value)) + "'";
    }
  } else {
    ret = "'" + escapeString(String(value)) + "'";
  }
  return ret;
}

export function convertSuccess(result: unknown): [any, any] {
  let err: any = null;
  let ret: any;
  if (result && typeof result === 'object') {
    const res = result as any;
    if (res.Responses && Array.isArray(res.Responses)) {
      ret = [];
      res.Responses.forEach((response: any, i: number) => {
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
  } else {
    ret = convertResult(result);
  }
  return [err, ret];
}

export function convertResult(result: unknown): any {
  let ret: any;
  if (result && typeof result === 'object') {
    const res = result as any;
    if (res.Items) {
      ret = res.Items;
    } else if (res.Item) {
      ret = [res.Item];
    }
  }
  return ret;
}

export function dynamoType(type: string): ScalarAttributeType {
  let ret = type as ScalarAttributeType;
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
