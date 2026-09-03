/**
 * Formatting helpers shared by the cell renderers. Pure, dependency-free, locale-aware through
 * `Intl`. Every function tolerates `null` / `undefined` by returning `undefined` so renderers can
 * show a placeholder.
 */

export const isEmpty = (value: unknown): value is null | undefined | '' =>
  value === null || value === undefined || value === '';

export type NumberFormatOptions = {
  locale?: string;
  /** Fixed fraction digits. */
  digits?: number;
  /** Any `Intl.NumberFormat` option, e.g. `{ notation: 'compact' }`. */
  intl?: Intl.NumberFormatOptions;
};

export function formatNumber(
  value: unknown,
  options: NumberFormatOptions = {}
): string | undefined {
  if (isEmpty(value)) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  const intl: Intl.NumberFormatOptions = { ...options.intl };
  if (options.digits !== undefined) {
    intl.minimumFractionDigits = options.digits;
    intl.maximumFractionDigits = options.digits;
  }
  return new Intl.NumberFormat(options.locale, intl).format(n);
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** Bytes → human-readable, 1000-based to match the old kit's `bytesToMB`. */
export function formatBytes(
  value: unknown,
  { locale, digits = 1 }: { locale?: string; digits?: number } = {}
): string | undefined {
  if (isEmpty(value)) return undefined;
  let n = Number(value);
  if (Number.isNaN(n)) return String(value);
  let unit = 0;
  while (n >= 1000 && unit < BYTE_UNITS.length - 1) {
    n /= 1000;
    unit += 1;
  }
  const text = new Intl.NumberFormat(locale, {
    minimumFractionDigits: unit === 0 ? 0 : digits,
    maximumFractionDigits: unit === 0 ? 0 : digits,
  }).format(n);
  return `${text} ${BYTE_UNITS[unit]}`;
}

/** Seconds → `mm:ss` or `h:mm:ss`. */
export function formatDuration(value: unknown): string | undefined {
  if (isEmpty(value)) return undefined;
  const total = Math.max(0, Math.round(Number(value)));
  if (Number.isNaN(total)) return String(value);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export type DateInput = string | number | Date;

export function toDate(value: unknown): Date | undefined {
  if (isEmpty(value)) return undefined;
  const date = value instanceof Date ? value : new Date(value as DateInput);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export type TimestampFormatOptions = {
  locale?: string;
  /** `Intl.DateTimeFormat` options for the primary (time) line. */
  time?: Intl.DateTimeFormatOptions;
  /** `Intl.DateTimeFormat` options for the secondary (date) line. */
  date?: Intl.DateTimeFormatOptions;
  timeZone?: string;
};

export function formatTime(date: Date, options: TimestampFormatOptions = {}): string {
  return new Intl.DateTimeFormat(options.locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: options.timeZone,
    ...options.time,
  }).format(date);
}

export function formatDate(date: Date, options: TimestampFormatOptions = {}): string {
  return new Intl.DateTimeFormat(options.locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: options.timeZone,
    ...options.date,
  }).format(date);
}

const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 hours ago" / "in 2 days", via `Intl.RelativeTimeFormat`. `now` is injectable for tests. */
export function formatRelative(
  date: Date,
  { locale, now = Date.now() }: { locale?: string; now?: number } = {}
): string {
  const seconds = Math.round((date.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  // Truncate, not round: 90 seconds is "1 minute ago", 2.5 hours is "2 hours ago".
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit);
  }
  return rtf.format(seconds, 'second');
}

/** `'/cameras/{id}/clips'` + row → `'/cameras/12/clips'`, resolving dot paths inside braces. */
export function fillTemplate(template: string, resolve: (path: string) => unknown): string {
  return template.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const value = resolve(path.trim());
    return isEmpty(value) ? '' : encodeURIComponent(String(value));
  });
}
