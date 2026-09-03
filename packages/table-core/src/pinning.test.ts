import { describe, expect, it } from 'vitest';
import { getPinLayout, getPinStyle, getUtilityColumnCount } from './columns';
import { getCellAttributes, getHeaderCellAttributes, getRootAttributes } from './domContract';
import type { TableSchema } from './schema';
import { createInitialState } from './state';
import { createTable } from './table';
import { validateSchema } from './validate';

const schema: TableSchema = {
  rowKey: 'id',
  columns: [
    { id: 'code', header: 'ID', pin: 'start', width: '64px' },
    { id: 'name', header: 'Name', pin: 'start' },
    { id: 'a', header: 'A' },
    { id: 'b', header: 'B' },
    { id: 'more', header: 'More', pin: 'end', width: '48px' },
    { id: 'actions', header: 'Actions', pin: 'end', width: '120px' },
  ],
  features: { selection: 'multiple', expandable: true },
};

describe('getPinLayout', () => {
  it('accumulates utility columns and declared widths on the start side', () => {
    const layout = getPinLayout(schema, createInitialState(schema));
    expect(getUtilityColumnCount(schema)).toBe(2);
    expect(layout.get('code')).toEqual({
      side: 'start',
      offset: 'calc(var(--_utility-width) * 2)',
      edge: false,
    });
    expect(layout.get('name')).toEqual({
      side: 'start',
      offset: 'calc(var(--_utility-width) * 2 + 64px)',
      edge: true,
    });
    expect(layout.has('a')).toBe(false);
  });

  it('accumulates from the right on the end side', () => {
    const layout = getPinLayout(schema, createInitialState(schema));
    expect(layout.get('actions')).toEqual({ side: 'end', offset: '0px', edge: false });
    expect(layout.get('more')).toEqual({ side: 'end', offset: '120px', edge: true });
  });

  it('starts at zero without utility columns', () => {
    const plain = { ...schema, features: {} };
    const layout = getPinLayout(plain, createInitialState(plain));
    expect(layout.get('code')?.offset).toBe('0px');
    expect(layout.get('name')?.offset).toBe('64px');
  });

  it('follows runtime pinning and visibility state', () => {
    const state = createInitialState(schema, {
      columnPinning: { start: ['name'], end: [] },
      columnVisibility: { code: false },
    });
    const layout = getPinLayout(schema, state);
    expect([...layout.keys()]).toEqual(['name']);
    expect(layout.get('name')?.edge).toBe(true);
  });

  it('produces an inline style for renderers', () => {
    const layout = getPinLayout(schema, createInitialState(schema));
    expect(getPinStyle(layout.get('name'))).toEqual({
      '--_pin-offset': 'calc(var(--_utility-width) * 2 + 64px)',
    });
    expect(getPinStyle(undefined)).toBeUndefined();
  });
});

describe('pin attributes', () => {
  it('marks the edge column and carries the side', () => {
    const state = createInitialState(schema);
    const layout = getPinLayout(schema, state);
    const name = getHeaderCellAttributes(schema.columns[1], state, layout.get('name'));
    expect(name['data-pin']).toBe('start');
    expect(name['data-pin-edge']).toBe('true');
    const code = getCellAttributes(schema.columns[0], state, layout.get('code'));
    expect(code['data-pin']).toBe('start');
    expect(code['data-pin-edge']).toBeUndefined();
  });

  it('exposes layout on the root and defaults to contained', () => {
    expect(getRootAttributes(schema)['data-layout']).toBe('contained');
    expect(getRootAttributes(schema, { layout: 'page' })['data-layout']).toBe('page');
  });
});

describe('table instance pinning', () => {
  it('memoises the pin layout and ignores pins in page layout', () => {
    const table = createTable({ schema, data: [] });
    const a = table.getPinLayout();
    expect(table.getPinLayout()).toBe(a);
    expect(table.getColumnPinLayout('name')?.edge).toBe(true);
    expect(table.getHeaderCellAttributes('name')['data-pin-edge']).toBe('true');

    table.setOptions({ layout: 'page' });
    expect(table.getPinLayout().size).toBe(0);
    expect(table.getCellAttributes('name')['data-pin']).toBe('start');
    expect(table.getCellAttributes('name')['data-pin-edge']).toBeUndefined();
    expect(table.getRootAttributes()['data-layout']).toBe('page');
  });
});

describe('pinned column validation', () => {
  it('requires widths on inner pinned columns', () => {
    const bad = {
      rowKey: 'id',
      columns: [
        { id: 'a', header: 'A', pin: 'start' },
        { id: 'b', header: 'B', pin: 'start' },
        { id: 'c', header: 'C' },
        { id: 'd', header: 'D', pin: 'end' },
        { id: 'e', header: 'E', pin: 'end' },
      ],
    };
    expect(validateSchema(bad).map((i) => i.path)).toEqual([
      'columns[0].width',
      'columns[4].width',
    ]);
    expect(validateSchema(schema)).toEqual([]);
  });

  it('rejects breakpoint visibility on pinned columns', () => {
    const bad = {
      rowKey: 'id',
      columns: [{ id: 'a', header: 'A', pin: 'start', visibleFrom: 'md' }],
    };
    expect(validateSchema(bad).map((i) => i.path)).toEqual(['columns[0].pin']);
  });
});
