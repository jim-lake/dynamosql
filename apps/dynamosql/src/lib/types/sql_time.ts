import { SQLDateTime } from './sql_datetime';
import { offsetAtTime } from '../helpers/timezone';

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = 24 * HOUR;

export interface SQLTimeConstructorParams {
  time: number;
  decimals?: number;
  timeZone?: string;
}
interface SQLTimeToStringParams {
  decimals?: number;
  timeZone?: string;
}
export class SQLTime {
  private readonly _time: number;
  private readonly _decimals: number;

  constructor(params: SQLTimeConstructorParams) {
    this._time = params.time;
    this._decimals = params.decimals ?? 0;
  }
  getType(): string {
    return 'time';
  }
  getTime(): number {
    return this._time;
  }
  getFraction(): number {
    return this._time % 1;
  }
  getDecimals(): number {
    return this._decimals;
  }
  toString(params?: SQLTimeToStringParams): string {
    let ret;
    if (isNaN(this._time)) {
      ret = '';
    } else {
      let seconds = this._time;
      if (params?.timeZone) {
        const remainder = seconds - (seconds % (24 * 60 * 60));
        seconds -= remainder;
        seconds += offsetAtTime(params.timeZone, Date.now() / 1000) ?? 0;
        seconds = seconds % (24 * 60 * 60);
        seconds += remainder;
      }

      const neg = seconds < 0 ? '-' : '';
      if (neg) {
        seconds = -seconds;
      }
      const hours = Math.floor(seconds / HOUR);
      seconds -= hours * HOUR;
      const minutes = Math.floor(seconds / MINUTE);
      seconds -= minutes * MINUTE;

      const decimals = Math.min(params?.decimals ?? this._decimals, 6);
      let ret_secs = seconds.toFixed(decimals);
      if (ret_secs.length < (decimals > 0 ? decimals + 3 : 2)) {
        ret_secs = '0' + ret_secs;
      }
      ret = `${neg}${_pad(hours)}:${_pad(minutes)}:${ret_secs}`;
    }
    return ret;
  }
  toSQLDateTime(decimals?: number): SQLDateTime {
    const now = Date.now() / 1000;
    const time = now - (now % DAY) + this._time;
    return new SQLDateTime({ time, decimals: decimals ?? this._decimals });
  }
  toNumber(): number {
    let seconds = this._time;
    const hours = Math.floor(seconds / HOUR);
    seconds -= hours * HOUR;
    const minutes = Math.floor(seconds / MINUTE);
    seconds -= minutes * MINUTE;
    return hours * 10000 + minutes * 100 + seconds;
  }
  gt(other: SQLTime): boolean {
    return this._time > other.getTime();
  }
}
export function createSQLTime(
  params: SQLTimeConstructorParams
): SQLTime | null {
  if (isNaN(params.time)) {
    return null;
  } else {
    return new SQLTime(params);
  }
}
function _pad(num: number): string {
  return (num < 10 ? '0' : '') + num;
}
