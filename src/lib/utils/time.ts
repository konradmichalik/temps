/**
 * All display times use the *location's* timezone from the API response,
 * never the system timezone (original temps showed the city's local time).
 */

export function formatTime(
  date: Date,
  timezone: string,
  hour12 = false,
): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: timezone,
  }).format(date);
}

export function formatDayShort(
  date: Date,
  timezone: string,
  locale = 'en',
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: timezone,
  })
    .format(date)
    .toLowerCase()
    .replace('.', '');
}

export function formatDateLine(
  date: Date,
  timezone: string,
  locale = 'en',
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  })
    .format(date)
    .toLowerCase();
}

export function formatHourLabel(
  date: Date,
  timezone: string,
  locale = 'en',
): string {
  const day = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: timezone,
  })
    .format(date)
    .toLowerCase()
    .replace('.', '');
  const time = formatTime(date, timezone);
  return `${day}, ${time}`;
}
