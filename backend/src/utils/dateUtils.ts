/**
 * Date utilities — all operations assume and produce UTC values.
 * All timestamps stored in DB are UTC; display conversion happens on the client.
 */

/** Format a Date to 'YYYY-MM-DD' string in UTC. */
export function getDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Return today's date string in UTC. */
export function todayUTC(): string {
  return getDateString(new Date());
}

/**
 * Return a new Date on the same UTC date as `base` but with the given
 * UTC hours and minutes.
 */
export function setTimeOnDate(base: Date, hours: number, minutes = 0): Date {
  const d = new Date(base);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

/** Round a duration in minutes to the nearest 30-minute increment. */
export function roundToHalfHour(minutes: number): number {
  return Math.round(minutes / 30) * 30;
}

/** Convert milliseconds to hours (float). */
export function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

/** Return the larger of two dates. */
export function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

/** Return the smaller of two dates. */
export function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}
