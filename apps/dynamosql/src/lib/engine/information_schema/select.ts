import { SQLError } from '../../../error';

import type { RowListParams, Row } from '../index';
//import type { ExtendedFrom } from '../../ast_types';

export async function getRowList(
  params: RowListParams
): Promise<{
  source_map: Record<string, Row[]>;
  column_map: Record<string, string[]>;
}> {
  const { list } = params;
  const source_map: Record<string, Row[]> = {};
  const column_map: Record<string, string[]> = {};

  if (list.length > 1) {
    throw new SQLError('unsupported');
  }

  return { source_map, column_map };
}
