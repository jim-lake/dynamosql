import { SYSTEM_VARIABLE_TYPES } from './constants/system_variables';
import { SQLError } from './error';

import type { EvaluationValue } from './lib/expression';

const SYSTEM_TIME_ZONE = _getSystemTimezone();

class GlobalSettings {
  private _collationConnection = 'utf8mb4_0900_ai_ci';
  private _divPrecisionIncrement = 4;
  private _sqlMode = 'NO_ENGINE_SUBSTITUTION';
  private _timeZone = process.env.TZ ?? SYSTEM_TIME_ZONE;

  public get collationConnection() {
    return this._collationConnection;
  }
  public get divPrecisionIncrement() {
    return this._divPrecisionIncrement;
  }
  public get timeZone() {
    return this._timeZone;
  }
  public get sqlMode() {
    return this._sqlMode;
  }
  public get systemTimeZone() {
    return SYSTEM_TIME_ZONE;
  }

  public getGlobalVariable(name: string): EvaluationValue | undefined {
    const name_uc = name.toUpperCase();
    const type =
      SYSTEM_VARIABLE_TYPES[name_uc as keyof typeof SYSTEM_VARIABLE_TYPES];
    switch (name_uc) {
      case 'COLLATION_CONNECTION':
        return { value: this.collationConnection, type };
      case 'DIV_PRECISION_INCREMENT':
        return { value: this.divPrecisionIncrement, type };
      case 'TIME_ZONE':
        return { value: this.timeZone, type };
      case 'SQL_MODE':
        return { value: this.sqlMode, type };
      case 'SYSTEM_TIME_ZONE':
        return { value: this.systemTimeZone, type };
    }
    return undefined;
  }
  public setGlobalVariable(name: string, value: unknown) {
    const name_uc = name.toUpperCase();
    switch (name_uc) {
      case 'COLLATION_CONNECTION':
        this._collationConnection = String(value);
        return;
      case 'DIV_PRECISION_INCREMENT':
        this._divPrecisionIncrement = Number(value);
        return;
      case 'TIME_ZONE':
        this._timeZone = String(value);
        return;
      case 'SQL_MODE':
        this._sqlMode = String(value);
        return;
    }
    throw new SQLError({ err: 'ER_UNKNOWN_SYSTEM_VARIABLE', args: [name] });
  }
}
export default new GlobalSettings();

function _getSystemTimezone(): string {
  try {
    const local = new Date()
      .toLocaleString('en-US', { timeZoneName: 'short' })
      .split(' ')
      ?.pop()
      ?.trim();
    if (local && local.length === 3) {
      return local;
    }
  } catch {
    // noop
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
