/**
 * Date helpers on naive local date-times ("YYYY-MM-DDTHH:mm"). The simulation has no time zones,
 * so all arithmetic is done in UTC on the naive value to stay deterministic.
 */
export function toMs(dateTime: string): number {
  const [d, t = '00:00'] = dateTime.split('T');
  const [y, m, day] = d!.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  return Date.UTC(y!, m! - 1, day!, hh!, mm!);
}

export function fromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16);
}

export function addHours(dateTime: string, hours: number): string {
  return fromMs(toMs(dateTime) + hours * 3_600_000);
}

export function addDays(date: string, days: number): string {
  return fromMs(toMs(`${date}T00:00`) + days * 86_400_000).slice(0, 10);
}

/** Day of week of a YYYY-MM-DD date (0 = Sunday). */
export function weekday(date: string): number {
  return new Date(toMs(`${date}T00:00`)).getUTCDay();
}

export function localNow(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`;
}

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Tue 24 Nov 2026, 20:00" (or without time for a date). */
export function formatDateTime(value: string | null, withTime = true): string {
  if (!value) return '–';
  const d = new Date(toMs(value.length === 10 ? `${value}T00:00` : value));
  const base = `${DAY[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return withTime && value.length > 10 ? `${base}, ${value.slice(11, 16)}` : base;
}

export function dayName(n: number): string {
  return DAY[n]!;
}
