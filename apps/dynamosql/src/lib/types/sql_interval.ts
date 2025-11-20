import { createSQLDateTime, SQLDateTime } from './sql_datetime';
import { createSQLDate, SQLDate } from './sql_date';
import { createSQLTime, SQLTime } from './sql_time';
import { getDecimals, convertNum } from '../helpers/sql_conversion';

import type { EvaluationValue } from '../expression';

const SINGLE_TIME: Record<string, number> = {
  microsecond: 0.000001,
  second: 1,
  minute: 60,
  hour: 60 * 60,
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
};

const DOUBLE_TIME: Record<string, number[]> = {
  second_microsecond: [1, 0.000001],
  minute_microsecond: [60, 0.000001],
  minute_second: [60, 1],
  hour_microsecond: [60 * 60, 0.000001],
  hour_second: [60 * 60, 1],
  hour_minute: [60 * 60, 60],
  day_microsecond: [24 * 60 * 60, 0.000001],
  day_second: [24 * 60 * 60, 1],
  day_minute: [24 * 60 * 60, 60],
  day_hour: [24 * 60 * 60, 60 * 60],
};

const MONTH: Record<string, number | number[]> = {
  month: 1,
  quarter: 3,
  year: 12,
  year_month: [12, 1],
};

const FORCE_DATE: Record<string, boolean> = {
  day: true,
  week: true,
  month: true,
  quarter: true,
  year: true,
  day_microsecond: true,
  day_second: true,
  day_minute: true,
  day_hour: true,
  year_month: true,
};

const DECIMALS: Record<string, number> = {
  microsecond: 6,
  second_microsecond: 6,
  minute_microsecond: 6,
  hour_microsecond: 6,
  day_microsecond: 6,
};

export class SQLInterval {
  private readonly _number: number;
  private readonly _decimals: number;
  private readonly _isMonth: boolean;
  private readonly _forceDate: boolean;

  constructor(
    number: number,
    decimals: number,
    is_month: boolean,
    force_date: boolean
  ) {
    this._isMonth = is_month;
    this._forceDate = force_date;
    this._decimals = decimals || 0;
    if (this._decimals > 0) {
      this._number = parseFloat(
        number.toFixed(this._decimals + 1).slice(0, -1)
      );
    } else {
      this._number = Math.trunc(number);
    }
  }

  getNumber(): number {
    return this._number;
  }
  isMonth(): boolean {
    return this._isMonth;
  }
  forceDate(): boolean {
    return this._forceDate;
  }
  toString(): null {
    return null;
  }

  private _add(
    datetime: SQLDateTime | SQLDate | SQLTime,
    mult: number,
    timeZone: string
  ): EvaluationValue {
    let old_time = datetime.getTime();
    let fraction = datetime.getFraction();
    let type: 'datetime' | 'date' | 'time' | undefined = undefined;
    if (datetime instanceof SQLDateTime) {
      type = 'datetime';
    } else if (datetime instanceof SQLDate && !this._forceDate) {
      type = 'datetime';
    } else if (datetime instanceof SQLDate) {
      type = 'date';
    } else if (this._forceDate) {
      type = 'datetime';
    } else {
      type = 'time';
    }
    const decimals = Math.max(datetime.getDecimals(), this._decimals);
    const number = this._number * mult;
    let value = null;
    if (type === 'time') {
      value = createSQLTime({ time: old_time + number, decimals });
    } else {
      let time;
      if (datetime instanceof SQLTime) {
        const now = Date.now() / 1000;
        old_time += now - (now % (24 * 60 * 60));
      }
      if (this._isMonth) {
        time = _addMonth(old_time, number);
      } else {
        const add_time = Math.floor(number);
        time = old_time + add_time;
        fraction += number - add_time;
        const overflow = Math.floor(fraction);
        time += overflow;
        fraction -= overflow;
      }
      if (type === 'date') {
        value = createSQLDate({ time, timeZone });
      } else {
        value = createSQLDateTime({ time, fraction, decimals });
      }
    }
    return { type: type ?? 'datetime', value };
  }
  add(
    datetime: SQLDateTime | SQLDate | SQLTime,
    timeZone: string
  ): EvaluationValue {
    return this._add(datetime, 1, timeZone);
  }
  sub(
    datetime: SQLDateTime | SQLDate | SQLTime,
    timeZone: string
  ): EvaluationValue {
    return this._add(datetime, -1, timeZone);
  }
}

export function createSQLInterval(
  value: any,
  unit_name: string
): SQLInterval | null {
  let is_month = false;
  let unit: number | number[] | undefined;
  if (unit_name in MONTH) {
    is_month = true;
    unit = MONTH[unit_name];
  } else {
    unit = SINGLE_TIME[unit_name] ?? DOUBLE_TIME[unit_name];
  }
  let ret = null;
  const number = unit ? _convertNumber(value, unit, unit_name) : null;
  if (number !== null) {
    const force_date = unit_name in FORCE_DATE;
    let decimals = DECIMALS[unit_name] || 0;
    if (!decimals && unit_name.endsWith('second')) {
      decimals = getDecimals(value, 6);
      if (typeof value === 'string' && decimals) {
        decimals = 6;
      }
    }
    ret = new SQLInterval(number, decimals, is_month, force_date);
  }
  return ret;
}

function _convertNumber(
  value: any,
  unit: number | number[],
  unit_name: string
): number | null {
  let ret: number | null = null;
  if (Array.isArray(unit)) {
    if (typeof value === 'number') {
      const unitValue = unit[1];
      if (unitValue !== undefined) {
        ret = value * unitValue;
      }
    } else {
      const match = String(value).match(/\d+/g);
      if (
        match &&
        match.length === 2 &&
        match[0] &&
        match[1] &&
        unit[0] !== undefined &&
        unit[2] !== undefined
      ) {
        ret = parseInt(match[0]) * unit[0] + parseInt(match[1]) * unit[2];
      } else if (
        match &&
        match.length === 1 &&
        match[0] &&
        unit[1] !== undefined
      ) {
        ret = parseInt(match[0]) * unit[1];
      } else if (match && match.length === 0) {
        ret = 0;
      } else {
        ret = null;
      }
    }
  } else {
    ret = Number(convertNum(value));
    if (ret !== null) {
      if (unit_name !== 'second') {
        ret = Math.trunc(ret);
      }
      ret *= unit;
    }
  }
  return ret;
}

function _addMonth(old_time: number, number: number): number {
  const date = new Date(old_time * 1000);
  const start_time = date.getTime();
  const new_months = date.getUTCFullYear() * 12 + date.getUTCMonth() + number;
  const year = Math.floor(new_months / 12);
  const month = new_months - year * 12;
  let day = date.getUTCDate();
  date.setUTCFullYear(year);
  date.setUTCMonth(month);
  while (date.getUTCMonth() !== month) {
    date.setUTCMonth(0);
    date.setUTCDate(day--);
    date.setUTCMonth(month);
  }
  const delta = date.getTime() - start_time;
  return old_time + delta / 1000;
}
