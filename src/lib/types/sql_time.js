exports.createSQLTime = createSQLTime;

class SQLTime {
  constructor(time, decimals) {
    this._time = time;
    this._decimals = decimals || 0;
  }
  getTime() {
    return this._time;
  }
  toString() {
    let ret;
    if (isNaN(this._time)) {
      ret = '';
    } else {
      let seconds = this._time;
      const hours = Math.floor(seconds / 60 / 60);
      seconds -= hours * 60 * 60;
      const minutes = Math.floor(seconds / 60);
      seconds -= minutes * 60;

      const ret_secs =
        (seconds < 10 ? '0' : '') + seconds.toFixed(this._decimals);
      ret = `${_pad(hours)}:${_pad(minutes)}:${ret_secs}`;
    }
    return ret;
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
