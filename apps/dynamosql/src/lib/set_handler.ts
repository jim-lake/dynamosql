import * as Expression from './expression';
import { logger } from '@dynamosql/shared';
import { SQLError } from '../error';
import type { HandlerParams } from './handler_types';

export async function query(params: HandlerParams): Promise<void> {
  const { ast, session } = params;

  const expr = ast?.expr;
  if (expr?.type === 'assign') {
    const { left } = expr;
    const right = Expression.getValue(expr.right, { session });
    if (right.err) {
      throw new SQLError(right.err);
    } else if (left?.type === 'var' && left.prefix === '@') {
      session.setVariable(left.name, right.value);
    } else {
      logger.error('set_handler.query: unsupported left:', left);
      throw new SQLError('unsupported');
    }
  }
}
