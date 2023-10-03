const Expression = require('./expression');
const logger = require('../tools/logger');

exports.query = query;

function query(params, done) {
  const { ast, session } = params;

  let err;
  const expr = ast?.expr;
  if (expr?.type === 'assign') {
    const { left } = expr;
    const right = Expression.getValue(expr.right, session);
    if (right.err) {
      err = right.err;
    } else if (left?.type === 'var' && left.prefix === '@') {
      session.setVariable(left.name, right.value);
    } else {
      logger.error('set_handler.query: unsupported left:', left);
      err = 'unsupported';
    }
  }
  done(err);
}
