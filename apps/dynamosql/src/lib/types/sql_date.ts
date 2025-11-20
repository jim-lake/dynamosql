import { offsetAtTime } from '../helpers/timezone';

const YEAR_MULT = 10000;
const MONTH_MULT = 100;
const DAY_MULT = 1;

export interface SQLDateConstructorParams {
  time: bigint | number;
  timeZone: string;
}
export class SQLDate {
  private readonly _time: number;
  private _date: Date | null = null;

  constructor(params: SQLDateConstructorParams) {
    this._time =
      typeof params.time === 'number' ? params.time : Number(params.time);
    const offset = offsetAtTime(params.timeZone, this._time) ?? 0;
    this._time -= this._time % (24 * 60 * 60);
    this._time -= offset;
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
    return 0;
  }
  getDecimals(): number {
    return 0;
  }
  diff(other: SQLDate | null | undefined): number | null {
    if (!other) {
      return null;
    }
    const this_date = Math.floor(this._time / (24 * 60 * 60));
    const other_date = Math.floor(other._time / (24 * 60 * 60));
    return this_date - other_date;
  }
  toString(timeZone?: string): string {
    const date = this._makeDate(timeZone);
    if (isNaN(date.getTime())) {
      return '';
    } else {
      return date.toISOString().slice(0, 10);
    }
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
    return ret;
  }
}
export function createSQLDate(
  params: SQLDateConstructorParams
): SQLDate | null {
  const time =
    typeof params.time === 'number' ? params.time : Number(params.time);
  if (isNaN(time)) {
    return null;
  } else if (time >= 253402300800) {
    return null;
  } else if (time <= -62167219201) {
    return null;
  } else {
    return new SQLDate(params);
  }
}
