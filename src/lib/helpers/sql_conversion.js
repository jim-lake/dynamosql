exports.convertBooleanValue = convertBooleanValue;
exports.convertNum = convertNum;

function convertNum(value) {
  let ret = value;
  if (value === '') {
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
class SQLDate {
  constructor(time) {
    this._time = time;
    this._isMsTime = Math.floor(this._time) !== this._time;
  }
  _date = null;
  _makeDate() {
    if (!this._date) {
      this._date = new Date(this._time * 1000);
    }
  }
  getTime() {
    return this._time;
  }
  toString() {
    let ret;
    this._makeDate();
    if (isNaN(this._date)) {
      ret = null;
    } else {
      ret = this._date.toISOString().replace('T', ' ');
      if (this._isMsTime) {
        ret = ret.replace('Z', '');
      } else {
        ret = ret.replace(/\..*$/, '');
      }
    }
    return ret;
  }
}
exports.SQLDate = SQLDate;
