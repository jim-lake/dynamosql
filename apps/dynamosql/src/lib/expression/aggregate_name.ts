import { getValue } from './evaluate';

import type { EvaluationState } from './evaluate';
import type { SourceRow } from '../handler_types';

const EMPTY_ROW: SourceRow = { source: new Map(), result: null, group: null };

export function aggregateName(
  fn: string,
  args: Parameters<typeof getValue>[0][],
  state: EvaluationState
): string {
  const names = args.map(
    (arg) => getValue(arg, { ...state, row: EMPTY_ROW }).name
  );
  return `${fn}(${names.join(', ')})`;
}
