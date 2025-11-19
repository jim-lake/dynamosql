const YEAR_MULT = 10000;
const MONTH_MULT = 100;
const DAY_MULT = 1;
const HOUR_MULT = 10000;
const MINUTE_MULT = 100;
const DATE_TIME_MULT = 10000;

export interface SQLDateTimeConstructorParams {
  time: number;
  fraction?: number;
  type: 'date' | 'datetime';
  decimals?: number;
}
export class SQLDateTime {
  private readonly _time: number;
  private readonly _fraction: number = 0;
  private readonly _fractionText: string = '';
  private readonly _type: 'date' | 'datetime';
  private readonly _decimals: number;
  private _date: Date | null = null;

  constructor(params: SQLDateTimeConstructorParams) {
    this._time = params.time;
    if (params?.fraction !== undefined) {
      this._fraction = params.fraction;
    } else {
      this._fraction = parseFloat(
        '0.' +
          (String(params.time).split('.')[1] || '').slice(0, 6).padEnd(6, '0')
      );
    }
    this._type = params.type;
    if (this._type === 'date') {
      this._decimals = 0;
      this._time -= this._time % (24 * 60 * 60);
      this._fraction = 0;
    } else {
      this._decimals = params.decimals ?? (this._fraction ? 6 : 0);
      this._fraction = parseFloat(this._fraction.toFixed(this._decimals));
      let fd = 0;
      if (this._fraction >= 1.0) {
        this._fraction = 0;
        this._time += this._time < 0 ? -1 : 1;
      } else {
        fd = this._fraction;
      }
      if (this._decimals > 0) {
        this._fractionText =
          '.' + fd.toFixed(this._decimals).slice(-this._decimals);
      }
    }
  }
  private _makeDate(): Date {
    if (!this._date) {
      this._date = new Date(Math.floor(this._time * 1000));
    }
    return this._date;
  }
  getType(): 'date' | 'datetime' {
    return this._type;
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
  toString(): string {
    let ret;
    const date = this._makeDate();
    if (isNaN(date.getTime())) {
      ret = '';
    } else {
      ret = date.toISOString().replace('T', ' ');
      if (this._type === 'date') {
        ret = ret.slice(0, 10);
      } else {
        ret = ret.replace(/\..*/, '');
        if (this._decimals > 0) {
          ret = ret + this._fractionText;
        }
      }
    }
    return ret;
  }
  dateFormat(format: string): string {
    const date = this._makeDate();
    if (isNaN(date.getTime())) {
      return '';
    } else {
      return _dateFormat(date, format);
    }
  }
  toDate(): Date {
    return this._makeDate();
  }
  toNumber(): number {
    let ret = 0;
    const date = this._makeDate();
    ret += date.getUTCFullYear() * YEAR_MULT;
    ret += (date.getUTCMonth() + 1) * MONTH_MULT;
    ret += date.getUTCDate() * DAY_MULT;
    if (this._type === 'datetime') {
      ret = ret * DATE_TIME_MULT;
      ret += date.getUTCHours() * HOUR_MULT;
      ret += date.getUTCMinutes() * MINUTE_MULT;
      ret += date.getUTCSeconds();
      if (this._decimals > 0) {
        ret += this._fraction;
      }
    }
    return ret;
  }
}
export function createSQLDateTime(
  params: SQLDateTimeConstructorParams
): SQLDateTime | null {
  if (isNaN(params.time)) {
    return null;
  } else if (params.time >= 253402300800) {
    return null;
  } else if (params.time <= -62167219201) {
    return null;
  } else {
    return new SQLDateTime(params);
  }
}
export function cloneSQLDateTime(
  other: SQLDateTime,
  params: Omit<SQLDateTimeConstructorParams, 'time' | 'fraction'>
): SQLDateTime {
  return new SQLDateTime({
    time: other.getTime(),
    fraction: other.getFraction(),
    decimals: params.decimals ?? other.getDecimals(),
    type: params.type ?? other.getType(),
  });
}

const FORMAT_LONG_NUMBER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hour12: false,
} as any);

const FORMAT_SHORT_NUMBER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  year: '2-digit',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  fractionalSecondDigits: 3,
  hour12: false,
} as any);

const FORMAT_LONG_NUMBER_12H = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hour12: true,
} as any);

const FORMAT_SHORT_NUMBER_12H = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  fractionalSecondDigits: 3,
  hour12: true,
} as any);

const FORMAT_LONG_TEXT = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
});

const FORMAT_SHORT_TEXT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
});

function _dateFormat(date: Date, format: string): string {
  const format_map = new Map();
  function _getPart(formatter: Intl.DateTimeFormat, type: string): string {
    let cached = format_map.get(formatter);
    if (!cached) {
      cached = formatter.formatToParts(date);
      format_map.set(formatter, cached);
    }
    const found = cached.find((part: any) => part.type === type);
    return found?.value || '';
  }
  function _time(formatter: Intl.DateTimeFormat): string {
    return (
      _getPart(formatter, 'hour') +
      ':' +
      _getPart(formatter, 'minute') +
      ':' +
      _getPart(formatter, 'second')
    );
  }
  return format.replace(/%(.)/g, (_ignore: string, part: string) => {
    let ret = part;
    let day;
    switch (part) {
      case '%':
        ret = '%';
        break;
      case 'a':
        ret = _getPart(FORMAT_SHORT_NUMBER, 'weekday');
        break;
      case 'b':
        ret = _getPart(FORMAT_SHORT_TEXT, 'month');
        break;
      case 'c':
        ret = _getPart(FORMAT_SHORT_NUMBER, 'month');
        break;
      case 'D':
        day = date.getDate();
        ret = day + _nthNumber(day);
        break;
      case 'd':
        ret = _getPart(FORMAT_LONG_NUMBER, 'day');
        break;
      case 'e':
        ret = _getPart(FORMAT_SHORT_NUMBER, 'day');
        break;
      case 'f':
        ret = _getPart(FORMAT_LONG_NUMBER, 'fractionalSecond');
        break;
      case 'H':
        ret = _getPart(FORMAT_LONG_NUMBER, 'hour');
        break;
      case 'h':
      case 'I':
        ret = _getPart(FORMAT_LONG_NUMBER_12H, 'hour');
        break;
      case 'i':
        ret = _getPart(FORMAT_LONG_NUMBER, 'minute');
        break;
      case 'j':
        //ret = _getPart(, 'dayOfYear');
        break;
      case 'k':
        ret = _getPart(FORMAT_SHORT_NUMBER, 'hour');
        break;
      case 'l':
        ret = _getPart(FORMAT_SHORT_NUMBER_12H, 'hour');
        break;
      case 'M':
        ret = _getPart(FORMAT_LONG_TEXT, 'month');
        break;
      case 'm':
        ret = _getPart(FORMAT_LONG_NUMBER, 'month');
        break;
      case 'p':
        ret = _getPart(FORMAT_SHORT_NUMBER_12H, 'dayPeriod');
        break;
      case 'r':
        ret =
          _time(FORMAT_LONG_NUMBER_12H) +
          _getPart(FORMAT_LONG_NUMBER_12H, 'dayPeriod');
        break;
      case 'S':
        ret = _getPart(FORMAT_LONG_NUMBER, 'second');
        break;
      case 's':
        ret = _getPart(FORMAT_LONG_NUMBER, 'second');
        break;
      case 'T':
        ret = _time(FORMAT_LONG_NUMBER);
        break;
      case 'U':
        //ret = _getPart(, 'week');
        break;
      case 'u':
        //ret = _getPart(, 'week');
        break;
      case 'V':
        //ret = _getPart(, 'week');
        break;
      case 'v':
        //ret = _getPart(, 'week');
        break;
      case 'W':
        ret = _getPart(FORMAT_LONG_NUMBER, 'weekday');
        break;
      case 'w':
        ret = String(date.getDay());
        break;
      case 'X':
        ret = _getPart(FORMAT_LONG_NUMBER, 'year');
        break;
      case 'x':
        ret = _getPart(FORMAT_LONG_NUMBER, 'year');
        break;
      case 'Y':
        ret = _getPart(FORMAT_LONG_NUMBER, 'year');
        break;
      case 'y':
        ret = _getPart(FORMAT_SHORT_NUMBER, 'year');
        break;
    }
    return ret;
  });
}

function _nthNumber(number: number): string {
  let ret = '';
  if (number > 3 && number < 21) {
    ret = 'th';
  } else {
    const temp = number % 10;
    if (temp === 1) {
      ret = 'st';
    } else if (temp === 2) {
      ret = 'nd';
    } else if (temp === 3) {
      ret = 'rd';
    } else {
      ret = 'th';
    }
  }
  return ret;
}
