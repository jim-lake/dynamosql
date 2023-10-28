const { isNativeError } = require('node:util').types;

class SQLError extends Error {
  constructor(args, sql) {
    if (isNativeError(args)) {
      super(undefined, { cause: args });
    } else {
      super();
    }
    if (sql) {
      this.sql = sql;
    }
  }
}

function sub() {
  return new Error('foo');
}

console.log(new SQLError());
console.log(new SQLError(sub(), 'bar'));
