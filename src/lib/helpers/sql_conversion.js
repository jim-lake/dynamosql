const { createSQLDateTime, SQLDateTime } = require('../types/sql_datetime');
const { createSQLTime, SQLTime } = require('../types/sql_time');

exports.convertBooleanValue = convertBooleanValue;
exports.convertNum = convertNum;
exports.convertDateTime = convertDateTime;
exports.convertTime = convertTime;

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function convertNum(value) {
  let ret = value;
  if (value === null) {
    ret = null;
  } else if (value === '') {
    ret = 0;
  } else if (typeof value === 'string') {
    ret = parseFloat(value);
    if (isNaN(ret)) {
      ret = 0;
    }
  }
  return ret;
}
function convertBooleanValue(value) {
  let ret;
  if (value === null) {
    ret = null;
  } else if (typeof value === 'number') {
    ret = value ? 1 : 0;
  } else {
    ret = convertNum(value) ? 1 : 0;
  }
  return ret;
}
function convertDateTime(value, type, decimals) {
  let ret;
  if (value === null) {
    ret = null;
  } else if (value instanceof SQLDateTime) {
    ret = value;
  } else if (typeof value === 'string') {
    const time = Date.parse(value);
    if (isNaN(time)) {
      ret = null;
    } else {
      ret = createSQLDateTime(time / 1000, type, decimals);
    }
  } else if (typeof value === 'number') {
    ret = createSQLDateTime(value, type, decimals);
  }
  return ret;
}
const TIME_REGEX = /^[0-9]*:[0-9]*/;
const NUM_REGEX = /^[0-9.]*$/;
function convertTime(value, decimals) {
  let ret;
  if (value instanceof SQLTime) {
    ret = value;
  } else if (typeof value === 'string') {
    value = value.trim();
    if (TIME_REGEX.test(value)) {
      const parts = value.split(':');
      const hours = Math.floor(parseFloat(parts[0] || '0'));
      const minutes = Math.floor(parseFloat(parts[1] || '0'));
      const seconds = parseFloat(parts[2] || '0');
      const time = hours * HOUR + minutes * MINUTE + seconds;
      ret = createSQLTime(time, decimals);
    } else if (NUM_REGEX.test(value)) {
      const num = convertNum(value);
      ret = convertTime(num, decimals);
    } else {
      const datetime = convertDateTime(value + ' UTC', 'datetime', decimals);
      if (datetime) {
        const time = datetime.getTime();
        ret = createSQLTime(time % DAY, decimals);
      } else {
        const num = convertNum(value);
        ret = convertTime(num, decimals);
      }
    }
  } else if (typeof value === 'number') {
    const hours = Math.floor(value / 10000);
    value -= hours * 10000;
    const minutes = Math.floor(value / 100);
    value -= minutes * 100;
    const time = hours * HOUR + minutes * MINUTE + value;
    ret = createSQLTime(time, decimals);
  }
  return ret;
}
