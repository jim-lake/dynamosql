import * as SchemaManager from '../schema_manager';

export function makeEngineGroups(session: any, list: any[]): any[] {
  const ret: any[] = [];
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
