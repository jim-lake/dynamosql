const OFFSET_REGEX = /^([+-])(\d{2}):(\d{2})$/;
const FLEX_OFFSET_REGEX = /([+-])(\d{1,2})(?::(\d{2}))?$/;

export function offsetAtTime(
  time_zone: string,
  unix_time: number
): number | null {
  const simple_match = OFFSET_REGEX.exec(time_zone);
  if (simple_match) {
    const sign = simple_match[1] === '+' ? 1 : -1;
    return (
      sign *
      (parseInt(simple_match[2] ?? '', 10) * 60 +
        parseInt(simple_match[3] ?? '', 10)) *
      60
    );
  }
  try {
    const date = new Date(unix_time * 1000);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: time_zone,
      timeZoneName: 'shortOffset',
    });
    const parts = fmt.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (!tzPart) {
      return null;
    }
    const m = FLEX_OFFSET_REGEX.exec(tzPart.value);
    if (!m) {
      return null;
    }
    const sign = m[1] === '+' ? 1 : -1;
    const hours = parseInt(m[2] ?? '', 10);
    const minutes = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (hours * 3600 + minutes * 60);
  } catch {
    return null;
  }
}
