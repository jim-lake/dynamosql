exports.createSQLTime = createSQLTime;
const { createDateTime } = require('./sql_datetime');

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = 24 * HOUR;

class SQLTime {
  constructor(time, decimals) {
    this._time = time;
    this._decimals = decimals || 0;
  }
  getType() {
    return 'time';
  }
  getTime() {
    return this._time;
  }
  getFraction() {
    return 0;
  }
  getDecimals() {
    return this._decimals;
  }
  toString() {
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
  toSQLDateTime(decimals) {
    const now = Date.now() / 1000;
    const time = now - (now % DAY) + this._time;
    return createDateTime(time, 'datetime', decimals ?? this._decimals);
  }
  toNumber() {
    let seconds = this._time;
    const hours = Math.floor(seconds / HOUR);
    seconds -= hours * HOUR;
    const minutes = Math.floor(seconds / MINUTE);
    seconds -= minutes * MINUTE;
    return hours * 10000 + minutes * 100 + seconds;
  }
}
exports.SQLTime = SQLTime;
function createSQLTime(time, decimals) {
  let ret;
  if (isNaN(time)) {
    ret = null;
  } else {
    ret = new SQLTime(time, decimals);
  }
  return ret;
}
function _pad(num) {
  return (num < 10 ? '0' : '') + num;
}
