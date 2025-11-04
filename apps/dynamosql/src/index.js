const SqlString = require('sqlstring');
const Pool = require('./pool');
const Session = require('./session');
const logger = require('./tools/logger');

exports.createPool = Pool.createPool;
exports.createSession = Session.createSession;
exports.logger = logger;
exports.escape = SqlString.escape;
exports.escapeId = SqlString.escapeId;
