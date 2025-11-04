const SchemaManager = require('../schema_manager');

exports.makeEngineGroups = makeEngineGroups;

function makeEngineGroups(session, list) {
  const ret = [];
  list.forEach((object) => {
    const { database, table } = object;
    const engine = SchemaManager.getEngine(database, table, session);
    let found = ret.find((group) => group.engine === engine);
    if (found) {
      found.list.push(object);
    } else {
      ret.push({ engine, list: [object] });
    }
  });
  return ret;
}
