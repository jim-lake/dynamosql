import * as Expression from './expression';
import * as SelectHandler from './select_handler';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';
import type { HandlerParams } from './handler_types';
import type { Select } from 'node-sql-parser';

export async function query(params: HandlerParams): Promise<void> {
  const { ast } = params;

  const expr = ast?.expr;

  // Handle single assignment
  if (expr?.type === 'assign') {
    await _handleAssignment(expr, params);
    return;
  }

  // Handle multiple assignments (expr is an array)
  if (Array.isArray(expr)) {
    for (const e of expr) {
      if (e?.type === 'assign') {
        await _handleAssignment(e, params);
      }
    }
    return;
  }

  logger.error('set_handler.query: unsupported expr:', expr);
  throw new SQLError('unsupported');
}

async function _handleAssignment(
  expr: any,
  params: HandlerParams
): Promise<void> {
  const { session } = params;
  const { left, right } = expr;

  let value: unknown;

  // Check if right side is a subquery
  if (right?.type === 'select') {
    const { rows } = await SelectHandler.query({
      ...params,
      ast: right as Select,
    });
    // Get the first column of the first row
    if (rows && rows.length > 0 && rows[0]) {
      const firstRow = rows[0] as Record<string, any>;
      const firstKey = Object.keys(firstRow)[0];
      value = firstKey !== undefined ? firstRow[firstKey] : null;
    } else {
      value = null;
    }
  } else {
    const result = Expression.getValue(right, { session });
    if (result.err) {
      throw new SQLError(result.err);
    }
    value = result.value;
  }

  if (left?.type === 'var' && left.prefix === '@') {
    session.setVariable(left.name, value);
  } else {
    logger.error('set_handler._handleAssignment: unsupported left:', left);
    throw new SQLError('unsupported');
  }
}
