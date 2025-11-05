import asyncEach from 'async/each';
import { convertWhere } from '../../helpers/convert_where';
import { escapeIdentifier } from '../../../tools/dynamodb_helper';
import * as logger from '../../../tools/logger';

export function singleDelete(params: any, done: (err?: any, result?: any) => void): void {
  const { dynamodb, session } = params;
  const { from, where } = params.ast;

  let no_single = false;
  const result = convertWhere(where, { session, from_key: from?.[0]?.key });
  if (result.err) {
    no_single = true;
  } else if (from.length > 1) {
    no_single = true;
  } else if (!result.value) {
    no_single = true;
  }

  if (no_single) {
    done('no_single');
  } else {
    const sql = `
DELETE FROM ${escapeIdentifier(from[0].table)}
WHERE ${result.value}
RETURNING ALL OLD *
`;
    dynamodb.queryQL(sql, (err: any, results: any) => {
      let affectedRows = results?.length;
      if (err?.name === 'ValidationException') {
        err = 'no_single';
      } else if (err?.name === 'ConditionalCheckFailedException') {
        err = null;
        affectedRows = 0;
      } else if (err) {
        logger.error('singleDelete: query err:', err);
      }
      done(err, { affectedRows });
    });
  }
}

export function multipleDelete(params: any, done: (err?: any, result?: any) => void): void {
  const { dynamodb, list } = params;

  let affectedRows = 0;
  asyncEach(
    list,
    (object: any, done: (err?: any) => void) => {
      const { table, key_list, delete_list } = object;
      dynamodb.deleteItems(
        { table, key_list, list: delete_list },
        (err: any, data: any) => {
          if (err) {
            logger.error('multipleDelete: deleteItems: err:', err, table, data);
          } else {
            affectedRows += delete_list.length;
          }
          done(err);
        }
      );
    },
    (err) => done(err, { affectedRows })
  );
}
