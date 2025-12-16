import type { AST, CreateTable } from 'node-sql-parser';
import type { FunctionName, BaseFrom, From } from 'node-sql-parser';

function isBaseFrom(from: From): from is BaseFrom {
  return 'table' in from && typeof from.table === 'string';
}

function isCreateTable(ast: AST): ast is CreateTable {
  return ast.type === 'create' && 'table' in ast;
}

export function getDatabaseFromTable(ast: AST): string | undefined {
  if (isCreateTable(ast)) {
    return ast.table[0]?.db ?? undefined;
  }
  return undefined;
}
export function getTableFromTable(ast: AST): string | undefined {
  if (isCreateTable(ast)) {
    return ast.table[0]?.table;
  }
  return undefined;
}
export function getDatabaseFromUpdate(ast: AST): string | undefined {
  if (ast.type === 'update') {
    if (Array.isArray(ast.table) && ast.table[0] && isBaseFrom(ast.table[0])) {
      return ast.table[0].db ?? '';
    }
  }
  return undefined;
}

// Helper to extract function name from node-sql-parser AST format
export function getFunctionName(nameObj: string | FunctionName): string {
  if (typeof nameObj === 'string') {
    return nameObj;
  }
  if (Array.isArray(nameObj.name)) {
    return nameObj.name.map((n) => n.value).join('.');
  }
  return String(nameObj);
}

// Helper to extract database name from node-sql-parser AST format
export function getDatabaseName(
  dbObj: string | { schema?: { value: string }[] }
): string {
  if (typeof dbObj === 'string') {
    return dbObj;
  }
  if (dbObj.schema && Array.isArray(dbObj.schema)) {
    return dbObj.schema[0]?.value ?? '';
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
    array?.forEach((child) => {
      walkColumnRefs(child, cb);
    });
  }
}
