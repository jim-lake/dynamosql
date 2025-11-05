import { createDateTime } from './sql_datetime';

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = 24 * HOUR;

export class SQLTime {
  private _time: number;
  private _decimals: number;

  constructor(time: number, decimals?: number) {
    this._time = time;
    this._decimals = decimals || 0;
  }

  getType(): string {
    return 'time';
  }

  getTime(): number {
    return this._time;
  }

  getFraction(): number {
    return 0;
  }

  getDecimals(): number {
    return this._decimals;
  }

  toString(): string {
    let ret;
    if (isNaN(this._time)) {
      ret = '';
    } else {
      let seconds = this._time;
      const neg = seconds < 0 ? '-' : '';
      if (neg) {
        seconds = -seconds;
      }
      const hours = Math.floor(seconds / HOUR);
      seconds -= hours * HOUR;
      const minutes = Math.floor(seconds / MINUTE);
      seconds -= minutes * MINUTE;

      const ret_secs =
        (seconds < 10 ? '0' : '') + seconds.toFixed(this._decimals);
      ret = `${neg}${_pad(hours)}:${_pad(minutes)}:${ret_secs}`;
    }
    return ret;
  }

  toSQLDateTime(decimals?: number): any {
    const now = Date.now() / 1000;
    const time = now - (now % DAY) + this._time;
    return createDateTime(time, 'datetime', decimals ?? this._decimals);
  }

  toNumber(): number {
    let seconds = this._time;
    const hours = Math.floor(seconds / HOUR);
    seconds -= hours * HOUR;
    const minutes = Math.floor(seconds / MINUTE);
    seconds -= minutes * MINUTE;
    return hours * 10000 + minutes * 100 + seconds;
  }
}

export function createSQLTime(time: number, decimals?: number): SQLTime | null {
  let ret;
  if (isNaN(time)) {
    ret = null;
  } else {
    ret = new SQLTime(time, decimals);
  }
  return ret;
}

function _pad(num: number): string {
  return (num < 10 ? '0' : '') + num;
}
