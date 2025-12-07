import { SQLDateTime } from '../types/sql_datetime';
import { SQLDate } from '../types/sql_date';
import { createSQLTime, SQLTime } from '../types/sql_time';
import { toBigInt } from '../../tools/safe_convert';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface ConvertTimeResult {
  time: number;
  fraction?: number;
  type?: string;
}
export interface ConvertStringParams {
  value: unknown;
  decimals?: number;
  timeZone: string;
}
export function convertString(params: ConvertStringParams): string | null {
  const { value, decimals, timeZone } = params;
  if (value === null) {
    return null;
  }
  if (
    value instanceof SQLDateTime ||
    value instanceof SQLDate ||
    value instanceof SQLTime
  ) {
    return value.toString({ decimals, timeZone });
  }
  if (typeof value === 'number' && decimals !== undefined) {
    return value.toFixed(decimals);
  }
  return String(value);
}
export function convertNum(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  } else if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'bigint') {
    return Number(value);
  } else if (value === '') {
    return 0;
  } else if (typeof value === 'string') {
    const ret = parseFloat(value);
    return isNaN(ret) ? 0 : ret;
  } else if (_isToNumber(value)) {
    return value.toNumber();
  }
  return null;
}
export function convertBigInt(value: unknown): bigint | null {
  if (value === null || value === undefined) {
    return null;
  } else if (typeof value === 'bigint') {
    return value;
  } else if (typeof value === 'number') {
    return BigInt(Math.floor(value));
  } else if (value === '') {
    return 0n;
  } else if (typeof value === 'string') {
    const s = value.match(/-?\d*/)?.[0] ?? '';
    return toBigInt(s) ?? 0n;
  }
  return null;
}
export function convertBooleanValue(value: unknown): number | null {
  if (value === null) {
    return null;
  } else if (typeof value === 'number') {
    return value ? 1 : 0;
  } else {
    return convertNum(value) ? 1 : 0;
  }
}

const SEP = `[-^\\][!@#$%&*()_+={}\\|/\\\\<>,.:;"']+`;
const DATE_RS = `^([0-9]{1,4})${SEP}([0-2]?[0-9])${SEP}([0-3]?[0-9])`;
const DEC_RS = `(\\.[0-9]{1,6})?`;
const DIGIT_RS = `(${SEP}([0-5]?[0-9]))?`;
const DT_RS = `${DATE_RS}(\\s+|T)([0-2]?[0-9])${DIGIT_RS}${DIGIT_RS}${DEC_RS}`;
const DATE4_RS = `^([0-9]{4})([0-1][0-9])([0-3][0-9])`;
const DATETIME4_RS = `${DATE4_RS}([0-2][0-9])([0-5][0-9])(([0-5][0-9])${DEC_RS})?`;
const DATE2_RS = `^([0-9]{2})([0-1][0-9])([0-3][0-9])`;
const DATETIME2_RS = `${DATE2_RS}([0-2][0-9])([0-5][0-9])(([0-5][0-9])${DEC_RS})?`;

const DATE_REGEX = new RegExp(DATE_RS + '$');
const DATETIME_REGEX = new RegExp(DT_RS);
const DATE4_REGEX = new RegExp(DATE4_RS);
const DATETIME4_REGEX = new RegExp(DATETIME4_RS);
const DATE2_REGEX = new RegExp(DATE2_RS);
const DATETIME2_REGEX = new RegExp(DATETIME2_RS);

export interface ConvertDateTimeParams {
  value: unknown;
  decimals?: number;
  timeZone: string;
}
export function convertDateTimeOrDate(
  params: ConvertDateTimeParams
): SQLDateTime | SQLDate | null {
  const { value, decimals, timeZone } = params;
  if (value === null) {
    return null;
  } else if (value instanceof SQLDateTime) {
    return value.clone({ decimals });
  } else if (value instanceof SQLTime) {
    return value.toSQLDateTime(decimals);
  } else {
    let convert_result: ConvertTimeResult | undefined;
    if (typeof value === 'string') {
      convert_result = _stringToDateTime(value);
      if (convert_result === undefined) {
        convert_result = _stringToDate(value);
        if (convert_result !== undefined) {
          return new SQLDate({ time: convert_result.time, timeZone });
        }
        convert_result = _numToDateTime(value);
      }
    } else if (typeof value === 'number') {
      convert_result = _numToDateTime(value);
    }
    if (convert_result) {
      const { type, ...time_fraction } = convert_result;
      if (type === 'date') {
        return new SQLDate({ ...time_fraction, timeZone });
      } else {
        return new SQLDateTime({ ...time_fraction, decimals, timeZone });
      }
    }
  }
  return null;
}
export function convertDateTime(params: ConvertDateTimeParams) {
  const { value, decimals, timeZone } = params;
  if (value === null) {
    return null;
  } else if (value instanceof SQLDateTime) {
    return value.clone({ decimals });
  } else if (value instanceof SQLDate) {
    return new SQLDateTime({ time: value.getTime(), decimals });
  } else if (value instanceof SQLTime) {
    return value.toSQLDateTime(decimals);
  } else {
    let convert_result: ConvertTimeResult | undefined;
    if (typeof value === 'string') {
      convert_result =
        _stringToDateTime(value) ??
        _stringToDate(value) ??
        _numToDateTime(value);
    } else if (typeof value === 'number') {
      convert_result = _numToDateTime(value);
    }
    if (convert_result) {
      return new SQLDateTime({ ...convert_result, decimals, timeZone });
    }
  }
  return null;
}
export interface ConvertDateParams {
  value: unknown;
  timeZone: string;
}
export function convertDate(params: ConvertDateParams): SQLDate | null {
  const { value, timeZone } = params;
  if (value === null) {
    return null;
  } else if (value instanceof SQLDate) {
    return value;
  } else if (value instanceof SQLDateTime) {
    return new SQLDate({ time: value.getTime(), timeZone });
  } else if (value instanceof SQLTime) {
    return new SQLDate({ time: Date.now() / 1000, timeZone });
  } else {
    let convert_result: ConvertTimeResult | undefined;
    if (typeof value === 'string') {
      convert_result =
        _stringToDateTime(value) ??
        _stringToDate(value) ??
        _numToDateTime(value);
    } else if (typeof value === 'number') {
      convert_result = _numToDateTime(value);
    }
    if (convert_result) {
      return new SQLDate({ time: convert_result.time, timeZone });
    }
  }
  return null;
}

const DAY_TIME_REGEX =
  /^(-)?([0-9]+)\s+([0-9]*)(:([0-9]{1,2}))?(:([0-9]{1,2}))?(\.[0-9]+)?/;
const TIME_REGEX = /^(-)?([0-9]*):([0-9]{1,2})(:([0-9]{1,2}))?(\.[0-9]+)?/;

export interface ConvertTimeParams {
  value: unknown;
  decimals?: number;
  timeZone?: string;
}
export function convertTime(params: ConvertTimeParams): SQLTime | null {
  const { value } = params;
  let { decimals } = params;
  if (value instanceof SQLTime) {
    return value;
  } else if (value instanceof SQLDateTime) {
    const time = (value.getTime() % DAY) + value.getFraction();
    return createSQLTime({ time, decimals: value.getDecimals() });
  } else if (typeof value === 'string') {
    let time = _stringToTime(value);
    if (time === undefined) {
      const result = _stringToDateTime(value);
      if (result !== undefined) {
        time = (result.time % DAY) + (result.fraction ?? 0);
      }
    }
    if (time === undefined) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        time = _numToTime(num);
      }
    }

    if (time === undefined) {
      return null;
    } else {
      return createSQLTime({ time, decimals });
    }
  } else if (typeof value === 'number') {
    const time = _numToTime(value);
    decimals ??= getDecimals(value);
    return createSQLTime({ time, decimals });
  }
  return null;
}
function _stringToTime(value: string): number | undefined {
  let ret;
  value = value.trim();
  let match = value.match(DAY_TIME_REGEX);
  if (match && match[2] && match[3]) {
    const negative = match[1];
    const days = parseInt(match[2]);
    const hours = parseInt(match[3]);
    const mins = parseInt(match[5] ?? '0');
    const secs = parseInt(match[7] ?? '0');
    const fraction = parseFloat('0' + (match[8] ?? ''));
    ret = days * DAY + hours * HOUR + mins * MINUTE + secs + fraction;
    if (negative) {
      ret = -ret;
    }
  }
  if (ret === undefined) {
    match = value.match(TIME_REGEX);
    if (match && match[2] && match[3]) {
      const negative = match[1];
      const hours = parseInt(match[2]);
      const mins = parseInt(match[3]);
      const secs = parseInt(match[5] ?? '0');
      const fraction = parseFloat('0' + (match[6] ?? ''));
      ret = hours * HOUR + mins * MINUTE + secs + fraction;
      if (negative) {
        ret = -ret;
      }
    }
  }
  return ret;
}
function _stringToDate(value: string): ConvertTimeResult | undefined {
  let ret;
  const match = value.trim().match(DATE_REGEX);
  if (match && match[1] && match[2] && match[3]) {
    const year = _fix2year(match[1]);
    const month = match[2];
    const day = match[3];
    ret = _partsToTime('date', year, month, day, 0, 0, 0);
  }
  return ret;
}
function _stringToDateTime(value: string): ConvertTimeResult | undefined {
  let ret;
  const match = value.trim().match(DATETIME_REGEX);
  if (match && match[1] && match[2] && match[3] && match[5]) {
    const year = _fix2year(match[1]);
    const month = match[2];
    const day = match[3];
    const hour = match[5];
    const min = match[7] ?? '0';
    const sec = match[9] ?? '0';
    const fraction = parseFloat('0' + match[10]);
    ret = _partsToTime('datetime', year, month, day, hour, min, sec, fraction);
  }
  return ret;
}
function _numToDateTime(number: unknown): ConvertTimeResult | undefined {
  let ret;
  let s = String(number);

  // Pad short numbers to 6 digits for YYMMDD format
  if (/^[0-9]+$/.test(s) && s.length < 6) {
    s = s.padStart(6, '0');
  }

  let match = s.match(DATETIME4_REGEX);
  if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    const hour = match[4];
    const min = match[5];
    const sec = match[7] ?? '0';
    const fraction = parseFloat('0' + match[8]);
    ret = _partsToTime('datetime', year, month, day, hour, min, sec, fraction);
  }
  if (ret === undefined) {
    match = s.match(DATETIME2_REGEX);
    if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
      const year = _fix2year(match[1]);
      const month = match[2];
      const day = match[3];
      const hour = match[4];
      const min = match[5];
      const sec = match[7] ?? '0';
      const fraction = parseFloat('0' + match[8]);
      ret = _partsToTime(
        'datetime',
        year,
        month,
        day,
        hour,
        min,
        sec,
        fraction
      );
    }
  }
  if (ret === undefined) {
    match = s.match(DATE4_REGEX);
    if (match && match[1] && match[2] && match[3]) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      ret = _partsToTime('date', year, month, day, 0, 0, 0);
    }
  }
  if (ret === undefined) {
    match = s.match(DATE2_REGEX);
    if (match && match[1] && match[2] && match[3]) {
      const year = _fix2year(match[1]);
      const month = match[2];
      const day = match[3];
      ret = _partsToTime('date', year, month, day, 0, 0, 0);
    }
  }
  return ret;
}
function _numToTime(number: number): number {
  const hours = Math.floor(number / 10000);
  number -= hours * 10000;
  const minutes = Math.floor(number / 100);
  number -= minutes * 100;
  return hours * HOUR + minutes * MINUTE + number;
}
export function getDecimals(value: unknown, max?: number): number {
  let ret = 0;
  if (typeof value === 'number') {
    ret = String(value).split('.')?.[1]?.length ?? 0;
  } else if (typeof value === 'string') {
    ret = value.split('.')?.[1]?.length ?? 0;
  }
  if (max !== undefined) {
    ret = Math.min(max, ret);
  }
  return ret;
}
function _pad2(num: unknown): string {
  return String(num).padStart(2, '0');
}
function _pad4(num: unknown): string {
  return String(num).padStart(4, '0');
}
function _fix2year(num: unknown): string | number {
  let ret: string | number = num as string | number;
  if (typeof num === 'string' && num.length <= 2) {
    const parsed = parseInt(num, 10);
    if (parsed >= 0 && parsed <= 69) {
      ret = parsed + 2000;
    } else if (parsed >= 70 && parsed <= 99) {
      ret = parsed + 1900;
    }
  }
  return ret;
}
function _partsToTime(
  type: string,
  year: string | number,
  month: string | number,
  day: string | number,
  hour: string | number,
  min: string | number,
  sec: string | number,
  fraction?: number
): ConvertTimeResult | undefined {
  const iso = `${_pad4(year)}-${_pad2(month)}-${_pad2(day)}T${_pad2(
    hour
  )}:${_pad2(min)}:${_pad2(sec)}Z`;
  const time = Date.parse(iso);
  let ret: ConvertTimeResult | undefined;
  if (!isNaN(time)) {
    ret = { type, time: time / 1000, fraction };
  }
  return ret;
}
interface ToNumber {
  toNumber(): number | null;
}
function _isToNumber(value: unknown): value is ToNumber {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'toNumber' in value &&
      typeof value.toNumber === 'function'
  );
}
