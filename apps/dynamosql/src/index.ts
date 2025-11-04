import * as SqlString from 'sqlstring';
import * as Pool from './pool';
import * as Session from './session';
import * as logger from './tools/logger';

export const createPool = Pool.createPool;
export const createSession = Session.createSession;
export { logger };
export const escape = SqlString.escape;
export const escapeId = SqlString.escapeId;
