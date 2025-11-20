import type { FunctionName } from 'node-sql-parser';

// Helper to extract function name from node-sql-parser AST format
export function getFunctionName(nameObj: string | FunctionName): string {
  if (typeof nameObj === 'string') {
    return nameObj;
  }
  if (nameObj?.name && Array.isArray(nameObj.name)) {
    return nameObj.name.map((n) => n.value).join('.');
  }
  return String(nameObj);
}

// Helper to extract database name from node-sql-parser AST format
export function getDatabaseName(
  dbObj: string | { schema?: Array<{ value: string }> }
): string {
  if (typeof dbObj === 'string') {
    return dbObj;
  }
  if (dbObj?.schema && Array.isArray(dbObj.schema)) {
    return dbObj.schema[0]?.value || '';
  }
  return String(dbObj);
}

export function walkColumnRefs(
  object: unknown,
  cb: (obj: unknown) => void
): void {
  if (
    object &&
    typeof object === 'object' &&
    'type' in object &&
    object.type === 'column_ref'
  ) {
    cb(object);
  } else {
    let array;
    if (Array.isArray(object)) {
      array = object;
    } else if (object && typeof object === 'object') {
      array = Object.values(object);
    }
    array?.forEach?.((child) => {
      walkColumnRefs(child, cb);
    });
  }
}
