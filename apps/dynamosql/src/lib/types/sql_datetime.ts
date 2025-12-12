import { offsetAtTime } from '../helpers/timezone';

const YEAR_MULT = 10000;
const MONTH_MULT = 100;
const DAY_MULT = 1;
const HOUR_MULT = 10000;
const MINUTE_MULT = 100;
const DATE_TIME_MULT = 10000;

export interface SQLDateTimeConstructorParams {
  time: bigint | number;
  fraction?: number;
  decimals?: number;
  timeZone?: string;
}
interface SQLDateTimeToStringParams {
  decimals?: number;
  timeZone?: string;
}
export class SQLDateTime {
  private readonly _time: number;
  private readonly _fraction: number = 0;
  private readonly _decimals: number;
  private _date: Date | null = null;

  constructor(params: SQLDateTimeConstructorParams) {
    this._time =
      typeof params.time === 'number' ? params.time : Number(params.time);
    if (params.timeZone) {
      this._time -= offsetAtTime(params.timeZone, this._time) ?? 0;
    }

    if (params.fraction !== undefined) {
      this._fraction = params.fraction;
    } else {
      this._fraction = parseFloat(
        '0.' +
          (String(params.time).split('.')[1] ?? '').slice(0, 6).padEnd(6, '0')
      );
    }
    this._decimals = params.decimals ?? (this._fraction ? 6 : 0);
    this._fraction = parseFloat(this._fraction.toFixed(this._decimals));
    if (this._fraction >= 1.0) {
      this._fraction = 0;
      this._time += this._time < 0 ? -1 : 1;
    }
  }
  private _makeDate(timeZone?: string): Date {
    let time = this._time;
    if (timeZone) {
      const offset = offsetAtTime(timeZone, this._time) ?? 0;
      time += offset;
    }

    if (timeZone) {
      return new Date(Math.floor(time * 1000));
    } else if (!this._date) {
      return (this._date = new Date(Math.floor(this._time * 1000)));
    }
    return this._date;
  }
  getTime(): number {
    return this._time;
  }
  getFraction(): number {
    return this._fraction;
  }
  getDecimals(): number {
    return this._decimals;
  }
  diff(other: SQLDateTime | null | undefined): number | null {
    if (!other) {
      return null;
    }
    const this_date = Math.floor(this._time / (24 * 60 * 60));
    const other_date = Math.floor(other._time / (24 * 60 * 60));
    return this_date - other_date;
  }
  toString(params?: SQLDateTimeToStringParams): string {
    let ret;
    const date = this._makeDate(params?.timeZone);
    if (isNaN(date.getTime())) {
      ret = '';
    } else {
      ret = date.toISOString().replace('T', ' ');
      ret = ret.replace(/\..*/, '');
      const decimals = params?.decimals ?? this._decimals;
      if (decimals > 0) {
        const dec = Math.min(decimals, 6);
        ret += '.' + this._fraction.toFixed(dec).slice(-dec);
      }
    }
    return ret;
  }
  toDate(timeZone?: string): Date {
    return this._makeDate(timeZone);
  }
  toNumber(): number {
    let ret = 0;
    const date = this._makeDate();
    ret += date.getUTCFullYear() * YEAR_MULT;
    ret += (date.getUTCMonth() + 1) * MONTH_MULT;
    ret += date.getUTCDate() * DAY_MULT;
    ret = ret * DATE_TIME_MULT;
    ret += date.getUTCHours() * HOUR_MULT;
    ret += date.getUTCMinutes() * MINUTE_MULT;
    ret += date.getUTCSeconds();
    if (this._decimals > 0) {
      ret += this._fraction;
    }
    return ret;
  }
  toUTCTime(): number {
    return this._time + this._fraction;
  }
  gt(other: SQLDateTime): boolean {
    const time_diff = this._time - other.getTime();
    if (time_diff === 0) {
      return this._fraction > other.getFraction();
    }
    return time_diff > 0;
  }
  clone(
    params: Omit<SQLDateTimeConstructorParams, 'time' | 'fraction'>
  ): SQLDateTime {
    if (params.decimals === undefined || this._decimals === params.decimals) {
      return this;
    }
    return new SQLDateTime({
      time: this._time,
      fraction: this._fraction,
      decimals: params.decimals,
    });
  }
}
export function createSQLDateTime(
  params: SQLDateTimeConstructorParams
): SQLDateTime | null {
  const time =
    typeof params.time === 'number' ? params.time : Number(params.time);
  if (isNaN(time)) {
    return null;
  } else if (time >= 253402300800) {
    return null;
  } else if (time <= -62167219201) {
    return null;
  } else {
    return new SQLDateTime(params);
  }
}
