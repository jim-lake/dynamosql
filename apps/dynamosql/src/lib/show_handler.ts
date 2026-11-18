import { userInfo } from 'node:os';

import { COLLATIONS } from '../constants/mysql';
import { ALL_PRIVILEGES, CLASSIC_PRIVILEGES } from '../constants/privileges';
import { REPLICA_STATUS_COLUMNS } from '../constants/replica_status';
import { SYSTEM_VARIABLE_TYPES } from '../constants/system_variables';
import { SQLError } from '../error';
import GlobalSettings from '../global_settings';

import {
  CHARSET_DEFAULT_COLLATION_MAP,
  COLLATION_CHARSET_MAP,
} from './helpers/charset';
import { convertType } from './helpers/column_type_helper';
import { likeToRegExp } from './helpers/like_helper';
import { convertString } from './helpers/sql_conversion';
import * as SchemaManager from './schema_manager';

import type { FieldInfo } from '../types';
import type { ColumnDef, IndexType, TableInfo } from './engine';
import type { HandlerParams } from './handler_types';
import type { Show } from 'node-sql-parser/build/mysql';

export interface ShowResult {
  rows: (string | null)[][];
  columns: FieldInfo[];
}
// The parser's ShowTables type omits the runtime 'from' property.
type ShowTablesWithFrom = Show & { from?: string };
interface ShowVariables {
  keyword: 'variables';
  scope?: 'global' | 'session';
  expr?: { right?: { value?: unknown } } | null;
}
interface TableRef {
  db: string | null;
  table: string;
}
interface ShowDetail {
  keyword: string;
  suffix?: string;
  full?: string;
  from?: TableRef[];
  table?: TableRef;
}
interface ShowIndex {
  name: string;
  unique: boolean;
  column_list: string[];
  type: IndexType;
}

export async function query(params: HandlerParams<Show>): Promise<ShowResult> {
  const { ast, session, dynamodb } = params;
  const detail = ast as unknown as ShowDetail;

  if (ast.keyword === 'databases') {
    const column = Object.assign(convertType('string'), {
      table: 'SCHEMATA',
      orgTable: 'schemata',
      name: 'Database',
      orgName: 'Database',
    });
    const list = SchemaManager.getDatabaseList();
    const rows = list.map((item: string) => [item]);
    return { rows, columns: [column] };
  } else if (ast.keyword === 'tables') {
    const fromDatabase = (ast as ShowTablesWithFrom).from;
    if (fromDatabase && !SchemaManager.getDatabase(fromDatabase)) {
      throw new SQLError({ err: 'db_not_found', args: [fromDatabase] });
    }
    const database = fromDatabase ?? session.getCurrentDatabase();
    if (!database) {
      throw new SQLError('no_current_database');
    }

    const name = 'Tables_in_' + database;
    const column = Object.assign(convertType('string'), {
      db: database,
      table: 'TABLES',
      orgTable: 'tables',
      name,
      orgName: name,
    });
    const list = await SchemaManager.getTableList({ dynamodb, database });
    const rows = list.map((item: string) => [item]);
    return { rows, columns: [column] };
  } else if ((ast as { keyword: string }).keyword === 'variables') {
    const variables = ast as unknown as ShowVariables;
    const pattern = variables.expr?.right?.value;
    const regex =
      typeof pattern === 'string' ? likeToRegExp(pattern, true) : null;
    const useSession = variables.scope !== 'global';
    const names = Object.keys(SYSTEM_VARIABLE_TYPES)
      .map((name) => name.toLowerCase())
      .sort();
    const rows: string[][] = [];
    for (const lower of names) {
      const name = lower.toUpperCase();
      if (regex && !regex.test(lower)) {
        continue;
      }
      const val =
        (useSession ? session.getSessionVariable(name) : undefined) ??
        GlobalSettings.getGlobalVariable(name);
      if (val) {
        rows.push([lower, String(val.value)]);
      }
    }
    const columns = [
      Object.assign(convertType('string'), {
        table: '',
        orgTable: '',
        name: 'Variable_name',
        orgName: 'Variable_name',
      }),
      Object.assign(convertType('string'), {
        table: '',
        orgTable: '',
        name: 'Value',
        orgName: 'Value',
      }),
    ];
    return { rows, columns };
  } else if (ast.keyword === 'warnings') {
    const columns = [
      Object.assign(convertType('string'), {
        table: '',
        orgTable: '',
        name: 'Level',
        orgName: 'Level',
      }),
      Object.assign(convertType({ mysqlType: 'INT' }), {
        table: '',
        orgTable: '',
        name: 'Code',
        orgName: 'Code',
      }),
      Object.assign(convertType('string'), {
        table: '',
        orgTable: '',
        name: 'Message',
        orgName: 'Message',
      }),
    ];
    return { rows: [], columns };
  } else if (ast.keyword === 'grants') {
    const user = userInfo().username;
    const account = `${user}@localhost`;
    const column = Object.assign(convertType('string'), {
      table: '',
      orgTable: '',
      name: `Grants for ${account}`,
      orgName: `Grants for ${account}`,
    });
    const rows = [
      [
        `GRANT ${CLASSIC_PRIVILEGES} ON *.* TO \`${user}\`@\`localhost\` WITH GRANT OPTION`,
      ],
      [
        `GRANT ${ALL_PRIVILEGES} ON *.* TO \`${user}\`@\`localhost\` WITH GRANT OPTION`,
      ],
      [
        `GRANT PROXY ON \`\`@\`\` TO \`${user}\`@\`localhost\` WITH GRANT OPTION`,
      ],
    ];
    return { rows, columns: [column] };
  } else if (detail.keyword === 'columns') {
    const target = detail.from?.[0];
    if (!target) {
      throw new SQLError('bad_table_name');
    }
    const { info } = await _tableInfo(params, target);
    const indexes = _showIndexList(info);
    const nullable = _nullableNames(info, indexes);
    const rows = info.column_list.map((col) => {
      let key = '';
      for (const index of indexes) {
        if (index.name === 'PRIMARY' && index.column_list.includes(col.name)) {
          key = 'PRI';
        } else if (index.column_list[0] === col.name && key !== 'PRI') {
          if (index.unique && index.column_list.length === 1) {
            key = 'UNI';
          } else {
            key ||= 'MUL';
          }
        }
      }
      const row: (string | null)[] = [
        col.name,
        _columnType(col),
        nullable.has(col.name) ? 'YES' : 'NO',
        key,
        col.defaultValue === undefined || col.defaultValue.value === null
          ? null
          : convertString({
              value: col.defaultValue.value,
              decimals:
                col.type === 'number' ? (col.decimals ?? undefined) : undefined,
              timeZone: session.timeZone,
            }),
        'NULL',
      ];
      if (detail.full) {
        const collation =
          col.collation === undefined ? null : COLLATIONS[col.collation];
        row.push(
          collation?.toLowerCase() ?? null,
          'select,insert,update,references',
          col.comment ?? ''
        );
      }
      return row;
    });
    const names = ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'];
    if (detail.full) {
      names.push('Collation', 'Privileges', 'Comment');
    }
    const columns = names.map((name) => _stringColumn(name));
    return { rows, columns };
  } else if (detail.keyword === 'index' || detail.keyword === 'indexes') {
    const target = detail.from?.[0];
    if (!target) {
      throw new SQLError('bad_table_name');
    }
    const { info } = await _tableInfo(params, target);
    const indexes = _showIndexList(info);
    const nullable = _nullableNames(info, indexes);
    const rows: (string | null)[][] = [];
    for (const index of indexes) {
      const btree = index.type === 'btree';
      for (const [i, column] of index.column_list.entries()) {
        rows.push([
          info.table,
          index.unique ? '0' : '1',
          index.name,
          String(i + 1),
          column,
          btree ? 'A' : null,
          btree ? null : '0',
          null,
          null,
          nullable.has(column) ? 'YES' : '',
          index.type ? index.type.toUpperCase() : 'HASH',
          '',
          '',
          'YES',
          null,
        ]);
      }
    }
    const names = [
      'Table',
      'Non_unique',
      'Key_name',
      'Seq_in_index',
      'Column_name',
      'Collation',
      'Cardinality',
      'Sub_part',
      'Packed',
      'Null',
      'Index_type',
      'Comment',
      'Index_comment',
      'Visible',
      'Expression',
    ];
    const columns = names.map((name) => _stringColumn(name));
    return { rows, columns };
  } else if (detail.keyword === 'create' && detail.suffix === 'table') {
    const target = detail.table;
    if (!target) {
      throw new SQLError('bad_table_name');
    }
    const { database, info } = await _tableInfo(params, target);
    const temp = session.getTempTable(database, info.table) !== undefined;
    const collation = info.collation;
    if (
      collation === null ||
      (!temp && database.toLowerCase() === 'information_schema')
    ) {
      throw new SQLError('unsupported');
    }
    const indexes = _showIndexList(info);
    const nullable = _nullableNames(info, indexes);
    const lines: string[] = [];
    for (const col of info.column_list) {
      let line = `  \`${col.name}\` ${_columnType(col)}`;
      if (col.collation !== undefined && col.collation !== collation) {
        const col_charset = COLLATION_CHARSET_MAP[col.collation];
        line += ` CHARACTER SET ${col_charset.toLowerCase()}`;
        if (col.collation !== CHARSET_DEFAULT_COLLATION_MAP[col_charset]) {
          line += ` COLLATE ${COLLATIONS[col.collation].toLowerCase()}`;
        }
      }
      line += nullable.has(col.name) ? ' DEFAULT NULL' : ' NOT NULL';
      lines.push(line);
    }
    const ordered = [
      ...indexes.filter((index) => index.name === 'PRIMARY'),
      ...indexes.filter((index) => index.name !== 'PRIMARY' && index.unique),
      ...indexes.filter((index) => !index.unique),
    ];
    for (const index of ordered) {
      const cols = index.column_list.map((name) => `\`${name}\``).join(',');
      let def: string;
      if (index.name === 'PRIMARY') {
        def = `PRIMARY KEY (${cols})`;
      } else if (index.unique) {
        def = `UNIQUE KEY \`${index.name}\` (${cols})`;
      } else {
        def = `KEY \`${index.name}\` (${cols})`;
      }
      lines.push(
        `  ${def}${index.type ? ` USING ${index.type.toUpperCase()}` : ''}`
      );
    }
    const charset = COLLATION_CHARSET_MAP[collation].toLowerCase();
    const engine =
      database.toLowerCase() === '_dynamodb' && !temp ? 'RAW' : 'MEMORY';
    const body = lines.join(',\n');
    const text = [
      `CREATE ${temp ? 'TEMPORARY ' : ''}TABLE \`${info.table}\` (`,
      body,
      `) ENGINE=${engine} DEFAULT CHARSET=${charset} COLLATE=${COLLATIONS[collation].toLowerCase()}`,
    ].join('\n');
    const columns = [_stringColumn('Table'), _stringColumn('Create Table')];
    return { rows: [[info.table, text]], columns };
  } else if (
    (ast as { keyword: string }).keyword === 'replica' &&
    'suffix' in ast &&
    ast.suffix === 'status'
  ) {
    const columns = REPLICA_STATUS_COLUMNS.map((name) => {
      return Object.assign(convertType('string'), {
        table: '',
        orgTable: '',
        name,
        orgName: name,
      });
    });
    return { rows: [], columns };
  } else if (
    'suffix' in ast &&
    (ast.suffix === 'logs' || ast.suffix === 'status')
  ) {
    throw new SQLError('ER_NO_BINARY_LOGGING');
  } else {
    throw new SQLError('unsupported');
  }
}

function _stringColumn(name: string): FieldInfo {
  return Object.assign(convertType('string'), {
    table: '',
    orgTable: '',
    name,
    orgName: name,
  });
}

async function _tableInfo(
  params: HandlerParams<Show>,
  target: TableRef
): Promise<{ database: string; info: TableInfo }> {
  const { session, dynamodb } = params;
  const database = target.db ?? session.getCurrentDatabase();
  if (!database) {
    throw new SQLError('no_current_database');
  }
  const engine = SchemaManager.getEngine(database, target.table, session);
  const info = await engine.getTableInfo({
    dynamodb,
    session,
    database,
    table: target.table,
  });
  return { database, info };
}

function _columnType(col: ColumnDef): string {
  const name = col.mysqlType.toLowerCase();
  switch (col.mysqlType) {
    case 'VARCHAR':
    case 'CHAR':
      return `${name}(${col.length ?? 1})`;
    case 'DECIMAL':
      return `decimal(${col.length ?? 10},${col.decimals ?? 0})`;
    case 'BOOLEAN':
      return 'tinyint(1)';
    case 'TIME':
    case 'DATETIME':
    case 'TIMESTAMP':
      return col.length ? `${name}(${col.length})` : name;
    default:
      return name;
  }
}

function _showIndexList(info: TableInfo): ShowIndex[] {
  const names = new Map(
    info.column_list.map((col) => [col.name.toLowerCase(), col.name] as const)
  );
  const primary = info.primary_key
    .filter((name) => names.has(name.toLowerCase()))
    .map((name) => names.get(name.toLowerCase()) ?? name);
  const list: ShowIndex[] = [];
  if (primary.length > 0) {
    list.push({
      name: 'PRIMARY',
      unique: true,
      column_list: primary,
      type: info.primaryType,
    });
  }
  for (const index of info.indexList) {
    list.push({
      name: index.name,
      unique: index.unique,
      column_list: index.column_list.map(
        (name) => names.get(name.toLowerCase()) ?? name
      ),
      type: index.type,
    });
  }
  return list;
}

function _nullableNames(info: TableInfo, indexes: ShowIndex[]): Set<string> {
  const primary =
    indexes.find((index) => index.name === 'PRIMARY')?.column_list ?? [];
  return new Set(
    info.column_list
      .filter((col) => col.nullable === true && !primary.includes(col.name))
      .map((col) => col.name)
  );
}
