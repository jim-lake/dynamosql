import type { FunctionName } from 'node-sql-parser/types';

// Helper to extract function name from node-sql-parser AST format
export function getFunctionName(nameObj: string | FunctionName): string {
  if (typeof nameObj === 'string') {
    return nameObj;
  }
  if (nameObj?.name && Array.isArray(nameObj.name)) {
    return nameObj.name.map((n: any) => n.value).join('.');
  }
  return String(nameObj);
}

// Helper to extract database name from node-sql-parser AST format
export function getDatabaseName(dbObj: any): string {
  if (typeof dbObj === 'string') {
    return dbObj;
  }
  if (dbObj?.schema && Array.isArray(dbObj.schema)) {
    return dbObj.schema[0]?.value || '';
  }
  return String(dbObj);
}

export function walkColumnRefs(object: any, cb: (obj: any) => void): void {
  if (object?.type === 'column_ref') {
    cb(object);
  } else {
    let array;
    if (Array.isArray(object)) {
      array = object;
    } else if (object && typeof object === 'object') {
      array = Object.values(object);
    }
    array?.forEach?.((child: any) => {
      walkColumnRefs(child, cb);
    });
  }
}
