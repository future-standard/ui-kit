import { describe, expect, it } from 'vitest';
import { defaultComparator, getColumnSort, sortRows, toggleColumnSort } from './sorting';

describe('defaultComparator', () => {
  it('orders numbers numerically and strings with numeric awareness', () => {
    expect([10, 2, 1].sort(defaultComparator)).toEqual([1, 2, 10]);
    expect(['item 10', 'item 2', 'Item 1'].sort(defaultComparator)).toEqual([
      'Item 1',
      'item 2',
      'item 10',
    ]);
  });

  it('puts empty values last and treats them as equal to each other', () => {
    // Note: Array#sort never passes `undefined` to a comparator, so it is tested directly.
    expect([null, 'b', '', 'a'].sort(defaultComparator)).toEqual(['a', 'b', null, '']);
    expect(defaultComparator(undefined, 'a')).toBeGreaterThan(0);
    expect(defaultComparator('a', undefined)).toBeLessThan(0);
    expect(defaultComparator(null, '')).toBe(0);
  });

  it('handles dates and booleans', () => {
    const [early, late] = [new Date('2026-01-01'), new Date('2026-02-01')];
    expect([late, early].sort(defaultComparator)).toEqual([early, late]);
    expect([true, false].sort(defaultComparator)).toEqual([false, true]);
  });
});

describe('toggleColumnSort', () => {
  it('cycles unsorted → asc → desc → asc by default', () => {
    const s1 = toggleColumnSort([], 'a');
    const s2 = toggleColumnSort(s1, 'a');
    const s3 = toggleColumnSort(s2, 'a');
    expect(s1).toEqual([{ id: 'a', desc: false }]);
    expect(s2).toEqual([{ id: 'a', desc: true }]);
    expect(s3).toEqual([{ id: 'a', desc: false }]);
  });

  it('clears on the third click when allowClear is set', () => {
    const desc = [{ id: 'a', desc: true }];
    expect(toggleColumnSort(desc, 'a', { allowClear: true })).toEqual([]);
  });

  it('replaces other columns in single mode and keeps them in multi mode', () => {
    const current = [{ id: 'a', desc: false }];
    expect(toggleColumnSort(current, 'b')).toEqual([{ id: 'b', desc: false }]);
    expect(toggleColumnSort(current, 'b', { multi: true })).toEqual([
      { id: 'a', desc: false },
      { id: 'b', desc: false },
    ]);
  });

  it('getColumnSort finds the entry', () => {
    expect(getColumnSort([{ id: 'a', desc: true }], 'a')).toEqual({ id: 'a', desc: true });
    expect(getColumnSort([], 'a')).toBeUndefined();
  });
});

describe('sortRows', () => {
  const rows = [
    { id: 1, name: 'b', n: 2 },
    { id: 2, name: 'a', n: 2 },
    { id: 3, name: 'c', n: 1 },
  ];
  const read = (row: (typeof rows)[number], id: string) => row[id as keyof typeof row];

  it('returns a copy in input order when unsorted', () => {
    const out = sortRows(rows, [], read);
    expect(out).toEqual(rows);
    expect(out).not.toBe(rows);
  });

  it('sorts by one column in either direction without mutating input', () => {
    const asc = sortRows(rows, [{ id: 'name', desc: false }], read).map((r) => r.id);
    const desc = sortRows(rows, [{ id: 'name', desc: true }], read).map((r) => r.id);
    expect(asc).toEqual([2, 1, 3]);
    expect(desc).toEqual([3, 1, 2]);
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('is stable and supports multiple keys', () => {
    const byN = sortRows(rows, [{ id: 'n', desc: false }], read).map((r) => r.id);
    expect(byN).toEqual([3, 1, 2]);
    const multi = sortRows(
      rows,
      [
        { id: 'n', desc: false },
        { id: 'name', desc: false },
      ],
      read
    ).map((r) => r.id);
    expect(multi).toEqual([3, 2, 1]);
  });

  it('keeps empty values last in both directions', () => {
    const withEmpty = [{ v: 2 }, { v: null }, { v: 1 }];
    const read = (row: { v: number | null }) => row.v;
    expect(sortRows(withEmpty, [{ id: 'v', desc: false }], read).map(read)).toEqual([1, 2, null]);
    expect(sortRows(withEmpty, [{ id: 'v', desc: true }], read).map(read)).toEqual([2, 1, null]);
  });

  it('uses a custom comparator when provided', () => {
    const reverse = (a: unknown, b: unknown) => String(b).localeCompare(String(a));
    const out = sortRows(rows, [{ id: 'name', desc: false }], read, { name: reverse });
    expect(out.map((r) => r.id)).toEqual([3, 1, 2]);
  });
});
