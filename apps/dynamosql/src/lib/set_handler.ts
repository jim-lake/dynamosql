import * as Expression from './expression';
import * as SelectHandler from './select_handler';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';

import type { Select } from 'node-sql-parser';
import type { HandlerParams } from './handler_types';
import type { ExpressionValue } from './expression';

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

  let result: ExpressionValue|undefined;

  if (right?.type === 'select') {
    const { rows, columns } = await SelectHandler.internalQuery({
      ...params,
      ast: right as Select,
    });
    if (rows && rows[0]?.[0]) {
      result = rows[0][0];
    } else {
      result = { value: null, type: 'null' };
    }
  } else {
    result = Expression.getValue(right, { session });
    if (result.err) {
      throw new SQLError(result.err);
    }
  }

  if (result && left?.type === 'var' && left.prefix === '@') {
    session.setVariable(left.name, result);
  } else {
    logger.error('set_handler._handleAssignment: unsupported left:', left);
    throw new SQLError('unsupported');
  }
}
