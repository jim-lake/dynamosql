exports.createSQLInterval = createSQLInterval;
const { createSQLDateTime } = require('./sql_datetime');
const { createSQLTime } = require('./sql_time');
const { getDecimals, convertNum } = require('../helpers/sql_conversion');

const SINGLE_TIME = {
  microsecond: 0.000001,
  second: 1,
  minute: 60,
  hour: 60 * 60,
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
};
const DOUBLE_TIME = {
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
const MONTH = {
  month: 1,
  quarter: 3,
  year: 12,
  year_month: [12, 1],
};
const FORCE_DATE = {
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
const DECIMALS = {
  microsecond: 6,
  second_microsecond: 6,
  minute_microsecond: 6,
  hour_microsecond: 6,
  day_microsecond: 6,
};

class SQLInterval {
  constructor(number, decimals, is_month, force_date) {
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
  getNumber() {
    return this._number;
  }
  isMonth() {
    return this._isMonth;
  }
  forceDate() {
    return this._forceDate;
  }
  toString() {
    return null;
  }
  _add(datetime, mult) {
    let old_time = datetime.getTime?.();
    const old_type = datetime?.getType?.();
    let type;
    if (old_type === 'datetime') {
      type = 'datetime';
    } else if (old_type === 'date' && !this._forceDate) {
      type = 'datetime';
    } else if (old_type === 'date') {
      type = 'date';
    } else if (old_type === 'time' && this._forceDate) {
      type = 'datetime';
    } else if (old_type === 'time') {
      type = 'time';
    }
    const decimals = Math.max(datetime.getDecimals?.(), this._decimals);
    const number = this._number * mult;
    let value = null;
    if (type === 'time') {
      value = createSQLTime(old_time + number, decimals);
    } else {
      if (old_type === 'time') {
        const now = Date.now() / 1000;
        old_time += now - (now % (24 * 60 * 60));
      }
      const time = this._isMonth
        ? _addMonth(old_time, number)
        : old_time + number;
      value = createSQLDateTime(time, type, decimals);
    }
    return { type, value };
  }
  add(datetime) {
    return this._add(datetime, 1);
  }
  sub(datetime) {
    return this._add(datetime, -1);
  }
}
exports.SQLInterval = SQLInterval;
function createSQLInterval(value, unit_name) {
  let is_month = false;
  let unit;
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
function _convertNumber(value, unit, unit_name) {
  let ret = null;
  if (Array.isArray(unit)) {
    if (typeof value === 'number') {
      ret = value * unit[1];
    } else {
      const match = String(value).match(/\d+/g);
      if (match.length === 2) {
        ret = parseInt(match[0]) * unit[0] + parseInt(match[1]) * unit[2];
      } else if (match.length === 1) {
        ret = parseInt(match[0]) * unit[1];
      } else if (match.length === 0) {
        ret = 0;
      } else {
        ret = null;
      }
    }
  } else {
    ret = convertNum(value);
    if (ret !== null) {
      if (unit_name !== 'second') {
        ret = Math.trunc(ret);
      }
      ret *= unit;
    }
  }
  return ret;
}
function _addMonth(old_time, number) {
  const date = new Date(old_time * 1000);
  const start_time = date.getTime();
  const new_months = date.getUTCFullYear() * 12 + date.getUTCMonth() + number;
  const year = Math.floor(new_months / 12);
  const month = new_months - year * 12;
  date.setUTCFullYear(year);
  date.setUTCMonth(month);
  const delta = date.getTime() - start_time;
  return old_time + delta / 1000;
}
