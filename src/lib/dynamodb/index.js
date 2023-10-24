const dynamodb = require('../../tools/dynamodb');

const MetadataCache = require('./metadata_cache');

exports.newDynamoDB = newDynamoDB;

function newDynamoDB(params, done) {
  dynamodb.init(params);

  const self = Object.assign({}, dynamodb, MetadataCache);
  done?.(null, self);
  return self;
}
