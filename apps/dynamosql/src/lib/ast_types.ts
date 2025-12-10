import type { EngineValue } from './engine';
import type { EvaluationResult } from './expression';
import type {
  Use,
  Select,
  Insert_Replace,
  Delete,
  Alter,
  Create,
  Drop,
  From,
  ExpressionValue,
  ColumnRef,
  ColumnDefinitionOptList,
  Update,
} from 'node-sql-parser';

// Missing statement types that node-sql-parser returns but doesn't type

export type ExtendedColumnDefinitionOptList = ColumnDefinitionOptList & {
  primary_key?: 'key' | 'primary key';
};
export interface UpdateAST extends Update {
  from?: ExtendedFrom[];
}
export interface DeleteAST extends Delete {
  from: ExtendedFrom[];
}
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

export type ExtendedColumnRef =
  | (ColumnRef & { _resultIndex?: number; from?: { key: string } })
  | { type: 'number'; value: number; _resultIndex?: number };

export interface SetListWithValue {
  column: string;
  value: EvaluationResult;
}
export type ExtendedFrom = From & {
  db: string;
  table: string;
  key: string;
  as?: string;
  join?: string;
  _updateList?: { key: EngineValue[]; set_list: SetListWithValue[] }[];
  _keyList?: string[];
};
export interface AssignExpr {
  type: 'assign';
  left: VarExpr;
  symbol: '=' | ':=';
  right: ExpressionValue;
}

export interface SetStatement {
  type: 'set';
  keyword: string | null;
  expr: AssignExpr[];
}

export interface UnaryExpr {
  type: 'unary_expr';
  operator: string;
  expr: ExpressionValue;
}

export interface Transaction {
  type: 'transaction';
  expr?: { action?: { value?: string } };
}

// Extended AST type that includes the missing types
export type ExtendedAST =
  | Use
  | Select
  | Insert_Replace
  | UpdateAST
  | DeleteAST
  | Alter
  | Create
  | Drop
  | Show
  | SetStatement
  | Transaction;

// Extended ExpressionValue that includes missing expression types
export type ExtendedExpressionValue =
  | ExpressionValue
  | VarExpr
  | UnaryExpr
  | AssignExpr;
