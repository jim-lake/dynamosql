import * as dynamodb from '../../tools/dynamodb';
import * as MetadataCache from './metadata_cache';

export { createDynamoDB };

function createDynamoDB(params?: any, done?: any) {
  dynamodb.init(params);

  const self = Object.assign({}, dynamodb, MetadataCache);
  done?.(null, self);
  return self;
}
