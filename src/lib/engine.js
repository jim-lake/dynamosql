const RawEngine = require('./raw_engine');
const NullEngine = require('./null_engine');

exports.getEngine = getEngine;

function getEngine(database) {
  if (database === '_dynamodb') {
    return RawEngine;
  } else {
    return NullEngine;
  }
}
