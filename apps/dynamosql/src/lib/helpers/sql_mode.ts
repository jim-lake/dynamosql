import { EventEmitter } from 'node:events';

export class SQLMode extends EventEmitter {
  private _sqlMode: string;
  private _modeAnsiQuotes = false;
  constructor(sql_mode: string) {
    super();
    this._sqlMode = sql_mode;
    this._parseSQLMode();
  }
  public get sqlMode() {
    return this._sqlMode;
  }
  public get modeAnsiQuotes() {
    return this._modeAnsiQuotes;
  }
  public set sqlMode(sql_mode: string) {
    this._sqlMode = sql_mode;
    this._parseSQLMode();
  }
  private _parseSQLMode() {
    const mode = this._sqlMode.toLowerCase();
    this._modeAnsiQuotes = mode.includes('ansi_quotes');
  }
}
