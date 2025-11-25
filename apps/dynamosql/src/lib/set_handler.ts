import { logger } from '@dynamosql/shared';
import * as Expression from './expression';
import * as SelectHandler from './select_handler';
import GlobalSettings from '../global_settings';
import { SQLError } from '../error';

import type { Select } from 'node-sql-parser';
import type { HandlerParams } from './handler_types';
import type { EvaluationResult } from './expression';
import type { AssignExpr, SetStatement } from './ast_types';

export async function query(
  params: HandlerParams<SetStatement>
): Promise<void> {
  const { ast } = params;
  const expr = ast?.expr;
  if (Array.isArray(expr)) {
    for (const e of expr) {
      if (e && 'type' in e && e.type === 'assign') {
        await _handleAssignment(e, params);
      } else {
        throw new SQLError('unsupported');
      }
    }
  } else {
    throw new SQLError('unsupported');
  }
}

async function _handleAssignment(
  expr: AssignExpr,
  params: HandlerParams<SetStatement>
): Promise<void> {
  const { session } = params;
  const { left, right } = expr;
  if (left?.type !== 'var') {
    throw new SQLError('unsupported');
  }

  let result: EvaluationResult;
  if (right?.type === 'select') {
    const { rows } = await SelectHandler.internalQuery({
      ...params,
      ast: right as unknown as Select,
    });
    if (rows && rows[0]?.[0]) {
      result = rows[0][0];
    } else {
      result = { err: null, value: null, type: 'null' };
    }
  } else {
    result = Expression.getValue(right, { session });
    if (result.err) {
      throw new SQLError(result.err);
    }
  }
  const { prefix, members } = left;
  const scope = members.length > 0 ? left.name.toLowerCase() : '';
  const firstMember = members[0];
  const name =
    members.length > 0 && typeof firstMember === 'string'
      ? firstMember
      : left.name;

  if (prefix === '@') {
    session.setVariable(left.name, result);
  } else if (prefix === '@@') {
    if (scope === 'global') {
      GlobalSettings.setGlobalVariable(
        typeof name === 'string' ? name : String(name),
        result.value
      );
    } else if (scope === 'session' || !scope) {
      session.setSessionVariable(
        typeof name === 'string' ? name : String(name),
        result.value
      );
    }
  } else {
    logger.error('set_handler._handleAssignment: unsupported left:', left);
    throw new SQLError('unsupported');
  }
}
