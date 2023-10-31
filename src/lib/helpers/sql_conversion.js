const { createSQLDateTime, SQLDateTime } = require('../types/sql_datetime');
const { createSQLTime, SQLTime } = require('../types/sql_time');

exports.convertBooleanValue = convertBooleanValue;
exports.convertNum = convertNum;
exports.convertDateTime = convertDateTime;
exports.convertTime = convertTime;
exports.getDecimals = getDecimals;

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
const SEP = `[-^\\][!@#$%&*()_+={}\\|<>,.:;"']+`;
const DATE_RS = `^([0-9]{1,4})${SEP}([0-2]?[0-9])${SEP}([0-3]?[0-9])`;
const DEC_RS = `(\\.[0-9]{1,6})?`;
const DIGIT_RS = `(${SEP}([0-5]?[0-9]))?`;
const DT_RS = `${DATE_RS}(\\s+|T)([0-2]?[0-9])${DIGIT_RS}${DIGIT_RS}${DEC_RS}`;
const DATE_REGEX = new RegExp(DATE_RS);
const DATETIME_REGEX = new RegExp(DT_RS);
const DATE4_RS = `^([0-9]{4})([0-1][0-9])([0-3][0-9])`;
const DATETIME4_RS = `${DATE4_RS}([0-2][0-9])([0-5][0-9])(([0-5][0-9])${DEC_RS})?`;
const DATE2_RS = `^([0-9]{2})([0-1][0-9])([0-3][0-9])`;
const DATETIME2_RS = `${DATE2_RS}([0-2][0-9])([0-5][0-9])(([0-5][0-9])${DEC_RS})?`;

const DATE4_REGEX = new RegExp(DATE4_RS);
const DATETIME4_REGEX = new RegExp(DATETIME4_RS);
const DATE2_REGEX = new RegExp(DATE2_RS);
const DATETIME2_REGEX = new RegExp(DATETIME2_RS);

function convertDateTime(value, type, decimals) {
  let ret;
  if (value === null) {
    ret = null;
  } else if (value instanceof SQLDateTime) {
    ret = value;
  } else if (typeof value === 'string') {
    let time = _stringToDateTime(value);
    if (time === undefined) {
      time = _stringToDate(value);
    }

    if (time === undefined) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        time = _numToDateTime(value);
      }
    }
    if (time === undefined) {
      ret = null;
    } else {
      ret = createSQLDateTime(time, type, decimals);
    }
  } else if (typeof value === 'number') {
    const time = _numToDateTime(value);
    if (time === undefined) {
      ret = null;
    } else {
      ret = createSQLDateTime(time, type, decimals);
    }
  }
  return ret;
}
const DAY_TIME_REGEX =
  /^(-)?([0-9]+)\s+([0-9]*)(:([0-9]{1,2}))?(:([0-9]{1,2}))?(\.[0-9]+)?/;
const TIME_REGEX = /^(-)?([0-9]*):([0-9]{1,2})(:([0-9]{1,2}))?(\.[0-9]+)?/;
function convertTime(value, decimals) {
  let ret;
  if (value instanceof SQLTime) {
    ret = value;
  } else if (typeof value === 'string') {
    let time = _stringToTime(value);
    if (time === undefined) {
      time = _stringToDateTime(value);
      if (time !== undefined) {
        time %= 24 * 60 * 60;
      }
    }
    if (time === undefined) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        time = _numToTime(num);
      }
    }

    if (time === undefined) {
      ret = null;
    } else {
      ret = createSQLTime(time, decimals);
    }
  } else if (typeof value === 'number') {
    const time = _numToTime(value);
    ret = createSQLTime(time, decimals);
  }
  return ret;
}
function _stringToTime(value) {
  let ret;
  value = value.trim();
  let match = value.match(DAY_TIME_REGEX);
  if (match) {
    const negative = match[1];
    const days = parseInt(match[2]);
    const hours = parseInt(match[3]);
    const mins = parseInt(match[5] || '0');
    const secs = parseInt(match[7] || '0');
    const fraction = parseFloat('0' + match[8]);
    ret = days * DAY + hours * HOUR + mins * MINUTE + secs + fraction;
    if (negative) {
      ret = -ret;
    }
  }
  if (ret === undefined) {
    match = value.match(TIME_REGEX);
    if (match) {
      const negative = match[1];
      const hours = parseInt(match[2]);
      const mins = parseInt(match[3] || '0');
      const secs = parseInt(match[5] || '0');
      const fraction = parseFloat('0' + match[6]);
      ret = hours * HOUR + mins * MINUTE + secs + fraction;
      if (negative) {
        ret = -ret;
      }
    }
  }
  return ret;
}
function _stringToDate(value) {
  let ret;
  const match = value.trim().match(DATE_REGEX);
  if (match) {
    const year = _fix2year(match[1]);
    const month = match[2];
    const day = match[3];
    ret = _partsToTime(year, month, day, 0, 0, 0);
  }
  return ret;
}
function _stringToDateTime(value) {
  let ret;
  const match = value.trim().match(DATETIME_REGEX);
  if (match) {
    const year = _fix2year(match[1]);
    const month = match[2];
    const day = match[3];
    const hour = match[5];
    const min = match[7] || '0';
    const sec = match[9] || '0';
    const fraction = parseFloat('0' + match[10]);
    ret = _partsToTime(year, month, day, hour, min, sec);
    if (ret !== undefined) {
      ret += fraction;
    }
  }
  return ret;
}
function _numToDateTime(number) {
  let ret;
  const s = String(number);
  let match = s.match(DATETIME4_REGEX);
  if (match) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    const hour = match[4];
    const min = match[5];
    const sec = match[7] || '0';
    const fraction = parseFloat('0' + match[8]);
    ret = _partsToTime(year, month, day, hour, min, sec);
    if (ret !== undefined) {
      ret += fraction;
    }
  }
  if (ret === undefined) {
    match = s.match(DATETIME2_REGEX);
    if (match) {
      const year = _fix2year(match[1]);
      const month = match[2];
      const day = match[3];
      const hour = match[4];
      const min = match[5];
      const sec = match[7] || '0';
      const fraction = parseFloat('0' + match[8]);
      ret = _partsToTime(year, month, day, hour, min, sec);
      if (ret !== undefined) {
        ret += fraction;
      }
    }
  }
  if (ret === undefined) {
    match = s.match(DATE4_REGEX);
    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      ret = _partsToTime(year, month, day, 0, 0, 0);
    }
  }
  if (ret === undefined) {
    match = s.match(DATE2_REGEX);
    if (match) {
      const year = _fix2year(match[1]);
      const month = match[2];
      const day = match[3];
      ret = _partsToTime(year, month, day, 0, 0, 0);
    }
  }
  return ret;
}
function _numToTime(number) {
  const hours = Math.floor(number / 10000);
  number -= hours * 10000;
  const minutes = Math.floor(number / 100);
  number -= minutes * 100;
  return hours * HOUR + minutes * MINUTE + number;
}
function getDecimals(value, max) {
  let ret = 0;
  if (typeof value === 'number') {
    ret = String(value).split('.')?.[1]?.length || 0;
  } else if (typeof value === 'string') {
    ret = value.split('.')?.[1]?.length || 0;
  }
  if (max !== undefined) {
    ret = Math.min(max, ret);
  }
  return ret;
}
function _pad2(num) {
  return String(num).padStart(2, '0');
}
function _pad4(num) {
  return String(num).padStart(4, '0');
}
function _fix2year(num) {
  if (typeof num === 'string') {
    num = parseInt(num);
  }
  if (num >= 10 && num <= 69) {
    num += 2000;
  } else if (num >= 70 && num <= 99) {
    num += 1900;
  }
  return num;
}
function _partsToTime(year, month, day, hour, min, sec) {
  const iso = `${_pad4(year)}-${_pad2(month)}-${_pad2(day)}T${_pad2(
    hour
  )}:${_pad2(min)}:${_pad2(sec)}Z`;
  const time = Date.parse(iso);
  return isNaN(time) ? undefined : time / 1000;
}
