import { userInfo } from 'node:os';

import { ALL_PRIVILEGES, CLASSIC_PRIVILEGES } from '../constants/privileges';
import { REPLICA_STATUS_COLUMNS } from '../constants/replica_status';
import { SYSTEM_VARIABLE_TYPES } from '../constants/system_variables';
import { SQLError } from '../error';
import GlobalSettings from '../global_settings';

import { convertType } from './helpers/column_type_helper';
import { likeToRegExp } from './helpers/like_helper';
import * as SchemaManager from './schema_manager';

import type { FieldInfo } from '../types';
import type { HandlerParams } from './handler_types';
import type { Show } from 'node-sql-parser/build/mysql';

export interface ShowResult {
  rows: string[][];
  columns: FieldInfo[];
}
// The parser's ShowTables type omits the runtime 'from' property.
type ShowTablesWithFrom = Show & { from?: string };
interface ShowVariables {
  keyword: 'variables';
  scope?: 'global' | 'session';
  expr?: { right?: { value?: unknown } } | null;
}
export async function query(params: HandlerParams<Show>): Promise<ShowResult> {
  const { ast, session, dynamodb } = params;

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
