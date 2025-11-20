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

export function dateFormat(date: Date, format: string): string {
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
