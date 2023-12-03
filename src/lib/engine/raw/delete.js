const asyncEach = require('async/each');
const { convertWhere } = require('../../helpers/convert_where');
const { escapeIdentifier } = require('../../../tools/dynamodb_helper');
const logger = require('../../../tools/logger');

exports.singleDelete = singleDelete;
exports.multipleDelete = multipleDelete;

function singleDelete(params, done) {
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
    dynamodb.queryQL(sql, (err, results) => {
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
function multipleDelete(params, done) {
  const { dynamodb, list } = params;

  let affectedRows = 0;
  asyncEach(
    list,
    (object, done) => {
      const { table, key_list, delete_list } = object;
      dynamodb.deleteItems(
        { table, key_list, list: delete_list },
        (err, data) => {
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
