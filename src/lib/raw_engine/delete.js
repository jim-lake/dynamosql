const { convertWhere } = require('../helpers/convert_where');
const { escapeIdentifier } = require('../../tools/dynamodb_helper');

exports.deleteRowList = deleteRowList;

function deleteRowList(params, done) {
  const { dynamodb, table, session, from, where } = params;

  const result = convertWhere(where, { session, from_key: from.key });
  if (result.err) {
    done(result.err);
  } else if (!result.value) {
    done(null, 0);
  } else {
    const sql = `
DELETE FROM ${escapeIdentifier(table)}
WHERE ${result.value}
RETURNING ALL OLD *`;
    dynamodb.queryQL(sql, (err, results) => {
      done(err, results?.length);
    });
  }
}
