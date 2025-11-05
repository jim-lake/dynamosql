import * as Storage from './storage';
import type { RowListParams } from '../index';

export function getRowList(
  params: RowListParams,
  done: (
    err?: any,
    source_map?: Record<string, any[]>,
    column_map?: Record<string, string[]>
  ) => void
): void {
  const { list } = params;

  let err: any;
  const source_map: any = {};
  const column_map: any = {};
  list.forEach((from: any) => {
    const result = _getFromTable({ ...params, from });
    if (!err && result.err) {
      err = result.err;
    }
    source_map[from.key] = result.row_list;
    column_map[from.key] = result.column_list;
  });
  done(err, source_map, column_map);
}

function _getFromTable(params: any): any {
  const { session } = params;
  const { db, table } = params.from;
  const data = Storage.getTable(db, table, session);
  return {
    err: data ? null : 'table_not_found',
    row_list: data?.row_list,
    column_list: data?.column_list?.map?.((column: any) => column.name) || [],
  };
}
