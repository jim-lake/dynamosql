import { logger } from '@dynamosql/shared';

import { SQLError } from '../error';
import GlobalSettings from '../global_settings';

import * as Expression from './expression';
import * as SelectHandler from './select_handler';

import type { EvaluationResult } from './expression';
import type { HandlerParams } from './handler_types';
import type {
  SetStatement,
  SetAssign,
  Select,
  ExpressionValue,
  ExtractFunc,
  FulltextSearch,
} from 'node-sql-parser';

interface SelectSubquery {
  ast: Select;
}

function isSelectSubquery(
  value: ExpressionValue | ExtractFunc | FulltextSearch
): value is ExpressionValue & SelectSubquery {
  return 'ast' in value;
}

export async function query(
  params: HandlerParams<SetStatement>
): Promise<void> {
  const { ast } = params;
  const expr = ast.expr;
  for (const e of expr) {
    await _handleAssignment(e, params);
  }
}

async function _handleAssignment(
  expr: SetAssign,
  params: HandlerParams<SetStatement>
): Promise<void> {
  const { session } = params;
  const { left, right } = expr;
  let result: EvaluationResult;
  if (isSelectSubquery(right)) {
    const { rows } = await SelectHandler.internalQuery({
      ...params,
      ast: right.ast,
    });
    if (rows[0]?.[0]) {
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
  } else if (prefix === '@@' || prefix === null) {
    if (scope === 'global') {
      GlobalSettings.setGlobalVariable(String(name), result.value);
    } else if (scope === 'session' || !scope) {
      session.setSessionVariable(String(name), result.value);
    }
  } else {
    logger.error('set_handler._handleAssignment: unsupported left:', left);
    throw new SQLError('unsupported');
  }
}
