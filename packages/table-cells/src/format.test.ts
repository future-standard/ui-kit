import { describe, expect, it } from 'vitest';
import {
  fillTemplate,
  formatBytes,
  formatDuration,
  formatNumber,
  formatRelative,
  toDate,
} from './format';

describe('formatNumber', () => {
  it('formats with locale and fixed digits, tolerating empties', () => {
    expect(formatNumber(1234.5, { locale: 'en-US' })).toBe('1,234.5');
    expect(formatNumber(1234.5, { locale: 'en-US', digits: 2 })).toBe('1,234.50');
    expect(formatNumber('12', { locale: 'en-US' })).toBe('12');
    expect(formatNumber(null)).toBeUndefined();
    expect(formatNumber('abc')).toBe('abc');
  });
});

describe('formatBytes', () => {
  it('humanises 1000-based units', () => {
    expect(formatBytes(0, { locale: 'en-US' })).toBe('0 B');
    expect(formatBytes(4_000_000, { locale: 'en-US' })).toBe('4.0 MB');
    expect(formatBytes(61_800_000, { locale: 'en-US' })).toBe('61.8 MB');
    expect(formatBytes(1_500_000_000, { locale: 'en-US', digits: 2 })).toBe('1.50 GB');
    expect(formatBytes(undefined)).toBeUndefined();
  });
});

describe('formatDuration', () => {
  it('renders mm:ss and h:mm:ss', () => {
    expect(formatDuration(30)).toBe('00:30');
    expect(formatDuration(305)).toBe('05:05');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(null)).toBeUndefined();
  });
});

describe('toDate / formatRelative', () => {
  it('parses ISO strings and rejects garbage', () => {
    expect(toDate('2026-09-01T10:00:00Z')?.toISOString()).toBe('2026-09-01T10:00:00.000Z');
    expect(toDate('nope')).toBeUndefined();
    expect(toDate('')).toBeUndefined();
  });

  it('picks the largest fitting unit', () => {
    const now = Date.UTC(2026, 8, 3, 12, 0, 0);
    const at = (deltaSeconds: number) => new Date(now + deltaSeconds * 1000);
    expect(formatRelative(at(-45), { locale: 'en', now })).toBe('45 seconds ago');
    expect(formatRelative(at(-3 * 3600), { locale: 'en', now })).toBe('3 hours ago');
    expect(formatRelative(at(-2 * 86400), { locale: 'en', now })).toBe('2 days ago');
    expect(formatRelative(at(90), { locale: 'en', now })).toBe('in 1 minute');
    expect(formatRelative(at(-2.5 * 3600), { locale: 'en', now })).toBe('2 hours ago');
  });
});

describe('fillTemplate', () => {
  it('substitutes dot paths and encodes values', () => {
    const row = { id: 12, camera: { slug: 'north gate' } };
    expect(
      fillTemplate('/cameras/{id}/clips?c={camera.slug}', (p) =>
        p.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], row)
      )
    ).toBe('/cameras/12/clips?c=north%20gate');
    expect(fillTemplate('/x/{missing}', () => undefined)).toBe('/x/');
  });
});
