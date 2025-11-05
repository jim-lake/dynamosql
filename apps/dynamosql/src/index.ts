import * as SqlString from 'sqlstring';
import * as Pool from './pool';
import * as Session from './session';

export const createPool = Pool.createPool;
export const createSession = Session.createSession;
export const escape = SqlString.escape;
export const escapeId = SqlString.escapeId;
