const OFFSET_REGEX = /^([+-])(\d{2}):(\d{2})$/;

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

    const match = OFFSET_REGEX.exec(tzPart.value);
    if (!match) {
      return null;
    }
    const sign = match[1] === '+' ? 1 : -1;
    return (
      sign *
      (parseInt(match[2] ?? '', 10) * 60 + parseInt(match[3] ?? '', 10)) *
      60
    );
  } catch {
    return null;
  }
}
