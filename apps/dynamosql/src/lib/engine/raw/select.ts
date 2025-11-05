import asyncEach from 'async/each';
import { logger } from '@dynamosql/shared';
import { convertWhere } from '../../helpers/convert_where';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';

export function getRowList(
  params: any,
  done: (err?: any, source_map?: any, column_map?: any) => void
): void {
  const { list } = params;

  const source_map: any = {};
  const column_map: any = {};
  asyncEach(
    list,
    (from: any, done: (err?: any) => void) => {
      _getFromTable({ ...params, from }, (err, results, column_list) => {
        source_map[from.key] = results;
        column_map[from.key] = column_list;
        done(err);
      });
    },
    (err) => done(err, source_map, column_map)
  );
}

function _getFromTable(
  params: any,
  done: (err?: any, results?: any, column_list?: any) => void
): void {
  const { dynamodb, session, from, where } = params;
  const { table, _requestSet, _requestAll } = params.from;
  const request_columns = [..._requestSet];
  const columns =
    _requestAll || request_columns.length === 0
      ? '*'
      : request_columns.map(escapeIdentifier).join(',');
  let sql = `SELECT ${columns} FROM ${escapeIdentifier(table)}`;
  const where_result = where
    ? convertWhere(where, { session, from_key: from.key, default_true: true })
    : null;
  if (!where_result?.err && where_result?.value) {
    sql += ' WHERE ' + where_result.value;
  }
  dynamodb.queryQL(sql, (err: any, results: any) => {
    let column_list;
    if (err === 'resource_not_found') {
      done({ err: 'table_not_found', args: [table] });
    } else if (err) {
      logger.error('raw_engine.getRowList err:', err, results, sql);
    } else {
      if (_requestAll) {
        const response_set = new Set();
        results.forEach((result: any) => {
          for (let key in result) {
            response_set.add(key);
          }
        });
        column_list = [...response_set.keys()];
      } else {
        column_list = request_columns;
      }
    }
    done(err, results, column_list);
  });
}
