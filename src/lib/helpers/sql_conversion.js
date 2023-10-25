const { SQLDate } = require('../types/sql_date');

exports.convertBooleanValue = convertBooleanValue;
exports.convertNum = convertNum;
exports.convertDate = convertDate;

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
function convertDate(value) {
  let ret;
  if (value instanceof SQLDate) {
    ret = value;
  } else {
    ret = null;
  }
  return ret;
}
