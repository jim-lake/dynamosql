import type { AST, From, ExpressionValue } from 'node-sql-parser';

// Missing statement types that node-sql-parser returns but doesn't type

export interface Show {
  type: 'show';
  keyword: string;
  expr?: ExpressionValue;
  from?: From[];
}

export interface VarExpr {
  type: 'var';
  name: string;
  members: ExpressionValue[];
  prefix: string | null;
}

export interface AssignExpr {
  type: 'assign';
  left: VarExpr;
  symbol: '=' | ':=';
  right: ExpressionValue;
}

export interface Set {
  type: 'set';
  keyword: string | null;
  expr: AssignExpr[];
}

export interface UnaryExpr {
  type: 'unary_expr';
  operator: string;
  expr: ExpressionValue;
}

// Extended AST type that includes the missing types
export type ExtendedAST = AST | Show | Set;

// Extended ExpressionValue that includes missing expression types
export type ExtendedExpressionValue = ExpressionValue | VarExpr | UnaryExpr;
