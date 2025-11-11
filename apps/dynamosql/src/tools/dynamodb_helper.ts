import type {
  AttributeValue,
  ScalarAttributeType,
} from '@aws-sdk/client-dynamodb';

export type KeyValue = AttributeValue | null | string;
interface NativeObject {
  [key: string]: NativeType;
}
export type NativeType = string | number | boolean | null | NativeObject;

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
  return String(value).replaceAll(/[^0-9.]/g, '');
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

interface DynamoDBError {
  name?: string;
  Code?: string;
  message?: string;
  Message?: string;
  Item?: ItemRecord;
}

type ConvertErrorResult = Error | DynamoDBError;

export function convertError(err: DynamoDBError): ConvertErrorResult {
  if (err.name === 'ConditionalCheckFailedException' && err.Item) {
    return new Error('cond_fail');
  }
  if (err.Code === 'ConditionalCheckFailed') {
    return new Error('cond_fail');
  }
  if (
    err.name === 'ResourceNotFoundException' ||
    err.Code === 'ResourceNotFound' ||
    (err.message && String(err.message).includes('resource not found'))
  ) {
    return new Error('resource_not_found');
  }
  if (
    err.name === 'ResourceInUseException' ||
    (err.message && String(err.message).includes('resource in use'))
  ) {
    return new Error('resource_in_use');
  }
  if (err.Code === 'ValidationError' || err.name === 'ValidationError') {
    if (err.Message?.match?.(/expected: [^\s]* actual: NULL/)) {
      return new Error('ER_BAD_NULL_ERROR');
    }
    if (err.Message?.match?.(/expected: [^\s]* actual:/)) {
      return new Error('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD');
    }
    return new Error('validation');
  }
  return err;
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
export function nativeToValue(obj: NativeType): AttributeValue {
  if (obj === null) {
    return { NULL: true };
  } else if (typeof obj === 'object') {
    const M: Record<string, AttributeValue> = {};
    for (const key in obj) {
      if (obj[key]) {
        M[key] = nativeToValue(obj[key]);
      }
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

export function convertValueToPQL(value: KeyValue): string {
  let ret: string;
  if (value === null) {
    ret = 'NULL';
  } else if (typeof value === 'object') {
    if (value.S !== undefined) {
      ret = "'" + escapeString(value.S) + "'";
    } else if (value.N !== undefined) {
      ret = String(value.N);
    } else {
      ret = "'" + escapeString(String(value)) + "'";
    }
  } else {
    ret = "'" + escapeString(String(value)) + "'";
  }
  return ret;
}

interface DynamoDBResponseItem {
  Error?: DynamoDBError;
  Item?: ItemRecord;
  Items?: ItemRecord[];
}

interface DynamoDBResponse {
  Responses?: DynamoDBResponseItem[];
  Items?: ItemRecord[];
  Item?: ItemRecord;
}

type ItemRecord = Record<string, AttributeValue>;
type ItemList = ItemRecord[] | null;
type ErrorList = Error[] | null;
type ConvertSuccessResult = [ErrorList, ItemList];

function isDynamoDBResponse(value: unknown): value is DynamoDBResponse {
  return value !== null && typeof value === 'object';
}

function isDynamoDBError(value: unknown): value is DynamoDBError {
  return value !== null && typeof value === 'object';
}

export function safeConvertSuccess(result: unknown): ConvertSuccessResult {
  if (!isDynamoDBResponse(result)) {
    return [null, null];
  }
  return convertSuccess(result);
}

export function safeConvertError(err: unknown): ConvertErrorResult {
  if (!isDynamoDBError(err)) {
    return err as Error;
  }
  return convertError(err);
}

export function convertSuccess(result: DynamoDBResponse): ConvertSuccessResult {
  let err: ErrorList = null;
  let ret: ItemList = null;

  if (result.Responses && Array.isArray(result.Responses)) {
    ret = [];
    result.Responses.forEach((item, i) => {
      if (item.Error) {
        if (!err) {
          err = [];
        }
        err[i] = convertError(item.Error) as Error;
      }
      const converted = convertResult(item);
      if (converted?.[0]) {
        ret![i] = converted[0];
      }
    });
  } else {
    ret = convertResult(result);
  }

  return [err, ret];
}

export function convertResult(result: DynamoDBResponseItem): ItemList {
  if (result.Items) {
    return result.Items;
  }
  if (result.Item) {
    return [result.Item];
  }
  return null;
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
const NAMESPACE_REGEX =
  /\b(FROM|UPDATE|INTO|DELETE\s+FROM)\s+(["`]?)([A-Za-z0-9_.-]+)(\2)/gi;
export function namespacePartiQL(sql: string, namespace: string): string {
  if (namespace) {
    return sql.replaceAll(
      NAMESPACE_REGEX,
      (_, kw, quote, name) => `${kw} "${namespace}${name}"`
    );
  } else {
    return sql;
  }
}
