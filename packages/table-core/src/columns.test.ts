import { describe, expect, it } from 'vitest';
import { getColumnPin, getHeaderGroups, getVisibleColumns, hasHeaderGroups } from './columns';
import { createInitialState } from './state';
import { cameraSchema } from './table.fixtures';

const ids = (columns: { id: string }[]) => columns.map((c) => c.id);

describe('getVisibleColumns', () => {
  it('keeps schema order and pins seeded from the schema', () => {
    const state = createInitialState(cameraSchema);
    expect(ids(getVisibleColumns(cameraSchema, state))).toEqual([
      'name',
      'route',
      'kmPost',
      'status',
      'clipCount',
      'lastSeen',
    ]);
  });

  it('moves pinned columns to the edges in pinning order', () => {
    const state = createInitialState(cameraSchema, {
      columnPinning: { start: ['kmPost', 'name'], end: ['route'] },
    });
    expect(ids(getVisibleColumns(cameraSchema, state))).toEqual([
      'kmPost',
      'name',
      'status',
      'clipCount',
      'lastSeen',
      'route',
    ]);
  });

  it('drops hidden columns, including pinned ones', () => {
    const state = createInitialState(cameraSchema, {
      columnVisibility: { name: false, status: false },
    });
    expect(ids(getVisibleColumns(cameraSchema, state))).toEqual([
      'route',
      'kmPost',
      'clipCount',
      'lastSeen',
    ]);
  });

  it('does not apply breakpoint visibility (that is CSS-driven)', () => {
    const state = createInitialState(cameraSchema);
    expect(ids(getVisibleColumns(cameraSchema, state))).toContain('lastSeen');
  });
});

describe('getColumnPin', () => {
  it('reads the runtime pin side', () => {
    const pinning = { start: ['a'], end: ['b'] };
    expect(getColumnPin('a', pinning)).toBe('start');
    expect(getColumnPin('b', pinning)).toBe('end');
    expect(getColumnPin('c', pinning)).toBeUndefined();
  });
});

describe('getHeaderGroups', () => {
  it('merges adjacent columns with the same group title', () => {
    const groups = getHeaderGroups(cameraSchema.columns);
    expect(groups.map((g) => [g.title, g.span])).toEqual([
      [undefined, 1],
      ['Location', 2],
      [undefined, 1],
      [undefined, 1],
      [undefined, 1],
    ]);
    expect(groups[1].columnIds).toEqual(['route', 'kmPost']);
  });

  it('does not merge equal titles that are not adjacent', () => {
    const columns = [
      { id: 'a', header: '', group: 'G' },
      { id: 'b', header: '' },
      { id: 'c', header: '', group: 'G' },
    ];
    expect(getHeaderGroups(columns).map((g) => g.span)).toEqual([1, 1, 1]);
  });

  it('hasHeaderGroups detects any group', () => {
    expect(hasHeaderGroups(cameraSchema.columns)).toBe(true);
    expect(hasHeaderGroups([{ id: 'a', header: 'A' }])).toBe(false);
  });
});
