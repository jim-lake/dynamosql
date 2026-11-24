import type { ColumnValue } from './values';

/** MySQL types after normalization, as used in the schema catalog. */
export type MysqlType =
  | 'TINYINT'
  | 'SMALLINT'
  | 'MEDIUMINT'
  | 'INT'
  | 'BIGINT'
  | 'BIT'
  | 'DECIMAL'
  | 'FLOAT'
  | 'DOUBLE'
  | 'CHAR'
  | 'VARCHAR'
  | 'TINYTEXT'
  | 'TEXT'
  | 'MEDIUMTEXT'
  | 'LONGTEXT'
  | 'BINARY'
  | 'VARBINARY'
  | 'TINYBLOB'
  | 'BLOB'
  | 'MEDIUMBLOB'
  | 'LONGBLOB'
  | 'JSON'
  | 'DATE'
  | 'DATETIME'
  | 'TIMESTAMP'
  | 'TIME'
  | 'YEAR';

export interface NoDefault {
  kind: 'none';
}

export interface LiteralDefault {
  kind: 'literal';
  value: ColumnValue;
}

export type ColumnDefault = NoDefault | LiteralDefault;

export interface ColumnDef {
  column_name: string;
  dynamodb_name: string;
  mysql_type: MysqlType;
  nullable: boolean;
  unsigned: boolean;
  auto_increment: boolean;
  length: number | null;
  precision: number | null;
  scale: number | null;
  fsp: number | null;
  charset: string | null;
  collation: string | null;
  default: ColumnDefault;
  comment: string;
}

/** The PRIMARY key. Its `dynamodb_name` selects the data partition-key attribute. */
export interface PrimaryIndexDef {
  index_name: 'PRIMARY';
  unique: true;
  columns: string[];
  dynamodb_name: string;
}

/** A secondary index, stored in its own table. `index_type` selects the key layout. */
export interface SecondaryIndexDef {
  index_name: string;
  index_uuid: string;
  index_type: 'BTREE' | 'HASH';
  unique: boolean;
  columns: string[];
  dynamodb_table: string;
}

export type IndexDef = PrimaryIndexDef | SecondaryIndexDef;

export interface TableDef {
  table_uuid: string;
  name: string;
  dynamodb_table: string;
  charset: string;
  collation: string;
  columns: ColumnDef[];
  indexes: IndexDef[];
}

export interface DatabaseDef {
  name: string;
  charset: string;
  collation: string;
  tables: TableDef[];
}

/** Decoded `payload_zstd` for a schema item: one complete catalog. */
export interface SchemaCatalog {
  tx_domain: string;
  databases: DatabaseDef[];
  schema_id: number;
}
