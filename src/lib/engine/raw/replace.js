const { convertError } = require('../../../tools/dynamodb_helper');

exports.replaceRowList = replaceRowList;

function replaceRowList(params, done) {
  const { dynamodb, table, list } = params;
  const opts = {
    table,
    list,
  };
  dynamodb.putItems(opts, (err) => {
    if (err) {
      err = convertError(err);
    }
    done(err, err ? undefined : { affectedRows: list.length });
  });
}
