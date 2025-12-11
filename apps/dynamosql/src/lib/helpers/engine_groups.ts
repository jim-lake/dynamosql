import * as SchemaManager from '../schema_manager';

import type { Session } from '../../session';
import type { Engine } from '../engine';

interface DatabaseTableObject {
  database: string | null | undefined;
  table: string;
}
interface EngineGroup<T> {
  engine: Engine;
  list: T[];
}
export function makeEngineGroups<T extends DatabaseTableObject>(
  session: Session,
  list: T[]
): EngineGroup<T>[] {
  const ret: EngineGroup<T>[] = [];
  for (const obj of list) {
    const { database, table } = obj;
    const engine = SchemaManager.getEngine(
      database ?? undefined,
      table,
      session
    );
    const found = ret.find((group) => group.engine === engine);
    if (found) {
      found.list.push(obj);
    } else {
      ret.push({ engine, list: [obj] });
    }
  }
  return ret;
}
