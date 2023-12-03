const asyncEach = require('async/each');
const { convertWhere } = require('../../helpers/convert_where');
const {
  escapeIdentifier,
  escapeValue,
  valueToNative,
} = require('../../../tools/dynamodb_helper');
const logger = require('../../../tools/logger');

exports.singleUpdate = singleUpdate;
exports.multipleUpdate = multipleUpdate;

function singleUpdate(params, done) {
  const { dynamodb, session } = params;
  const { set, from, where } = params.ast;

  const where_result = convertWhere(where, {
    session,
    from_key: from?.[0]?.key,
  });
  let no_single = where_result.err;
  if (from.length > 1 || !where_result.value) {
    no_single = true;
  }
  const value_list = set.map((object) => {
    const { value } = object;
    let ret;
    const result = convertWhere(value, { session, from_key: from?.[0]?.key });
    if (result.err) {
      no_single = true;
    } else {
      ret = result.value;
    }
    return ret;
  });

  if (no_single) {
    done('no_single');
  } else {
    const sets = set
      .map(
        (object, i) => escapeIdentifier(object.column) + ' = ' + value_list[i]
      )
      .join(', ');

    const sql = `
UPDATE ${escapeIdentifier(from[0].table)}
SET ${sets}
WHERE ${where_result.value}
RETURNING MODIFIED OLD *
`;
    dynamodb.queryQL(sql, (err, results) => {
      let result;
      if (err?.name === 'ValidationException') {
        err = 'no_single';
      } else if (err?.name === 'ConditionalCheckFailedException') {
        err = null;
        result = { affectedRows: 0, changedRows: 0 };
      } else if (err) {
        logger.error('singleUpdate: err:', err);
      } else {
        result = { affectedRows: 1, changedRows: 0 };
        set.forEach((object, i) => {
          const { column } = object;
          const value = value_list[i];
          if (value !== escapeValue(valueToNative(results?.[0]?.[column]))) {
            result.changedRows = 1;
          }
        });
      }
      done(err, result);
    });
  }
}
function multipleUpdate(params, done) {
  const { dynamodb, list } = params;

  let affectedRows = 0;
  let changedRows = 0;
  asyncEach(
    list,
    (object, done) => {
      const { table, key_list, update_list } = object;
      update_list.forEach((item) =>
        item.set_list.forEach((set) => (set.value = set.value.value))
      );
      dynamodb.updateItems(
        { table, key_list, list: update_list },
        (err, data) => {
          if (err) {
            logger.error(
              'multipleUpdate: updateItems: err:',
              err,
              'table:',
              table,
              data
            );
          } else {
            affectedRows += list.length;
            changedRows += list.length;
          }
          done(err);
        }
      );
    },
    (err) => done(err, { affectedRows, changedRows })
  );
}
