import { describe, expect, it } from 'vitest';
import {
  compactAttributes,
  getCellAttributes,
  getHeaderCellAttributes,
  getRootAttributes,
  getRowAttributes,
  PARTS,
} from './domContract';
import { buildRowModel } from './rowModel';
import { createInitialState } from './state';
import { cameraSchema, cameras } from './table.fixtures';

describe('getRootAttributes', () => {
  it('emits feature flags as presence attributes and enums as values', () => {
    expect(compactAttributes(getRootAttributes(cameraSchema, { status: 'loading' }))).toEqual({
      'data-ui': 'table',
      'data-table-id': 'cameras',
      'data-density': 'normal',
      'data-selection': 'multiple',
      'data-zebra': 'true',
      'data-expandable': 'true',
      'data-status': 'loading',
    });
  });

  it('omits selection when none and defaults status to idle', () => {
    const attrs = getRootAttributes({ rowKey: 'id', columns: [{ id: 'a', header: 'A' }] });
    expect(attrs['data-selection']).toBeUndefined();
    expect(attrs['data-status']).toBe('idle');
    expect(attrs['data-zebra']).toBeUndefined();
  });
});

describe('getHeaderCellAttributes', () => {
  const state = createInitialState(cameraSchema, { sorting: [{ id: 'name', desc: true }] });

  it('describes sortable, sorted columns with aria-sort', () => {
    const attrs = getHeaderCellAttributes(cameraSchema.columns[0], state);
    expect(attrs).toMatchObject({
      'data-ui': PARTS.headerCell,
      'data-column': 'name',
      'data-align': 'start',
      'data-emphasis': 'high',
      'data-pin': 'start',
      'data-sortable': 'true',
      'data-sort': 'desc',
      'aria-sort': 'descending',
    });
  });

  it('uses aria-sort="none" for sortable-but-unsorted and omits it for unsortable', () => {
    const km = getHeaderCellAttributes(cameraSchema.columns[2], state);
    expect(km['aria-sort']).toBe('none');
    expect(km['data-sort']).toBeUndefined();
    expect(km['data-align']).toBe('end');
    const route = getHeaderCellAttributes(cameraSchema.columns[1], state);
    expect(route['aria-sort']).toBeUndefined();
    expect(route['data-sortable']).toBeUndefined();
  });

  it('carries breakpoint visibility for CSS', () => {
    const status = getHeaderCellAttributes(cameraSchema.columns[3], state);
    expect(status['data-visible-from']).toBe('md');
  });
});

describe('getCellAttributes', () => {
  it('mirrors column attributes and adds the cell type', () => {
    const state = createInitialState(cameraSchema);
    expect(compactAttributes(getCellAttributes(cameraSchema.columns[2], state))).toEqual({
      'data-ui': PARTS.cell,
      'data-column': 'kmPost',
      'data-align': 'end',
      'data-emphasis': 'normal',
      'data-cell-type': 'number',
    });
    expect(getCellAttributes(cameraSchema.columns[1], state)['data-cell-type']).toBe('text');
  });
});

describe('getRowAttributes', () => {
  it('exposes key, index, selection, expansion and consumer hints', () => {
    const state = createInitialState(cameraSchema, { rowSelection: { '3': true } });
    const model = buildRowModel(cameras, cameraSchema, state);
    const attrs = getRowAttributes(model.rows[0], cameraSchema, {
      tone: 'warning',
      state: 'pending',
    });
    expect(compactAttributes(attrs)).toEqual({
      'data-ui': PARTS.row,
      'data-key': '3',
      'data-index': '0',
      'data-selected': 'true',
      'data-tone': 'warning',
      'data-state': 'pending',
      'aria-selected': 'true',
      'aria-expanded': 'false',
    });
  });

  it('omits aria-selected / aria-expanded when the features are off', () => {
    const plain = { rowKey: 'id', columns: [{ id: 'name', header: 'Name' }] };
    const model = buildRowModel(cameras, plain, createInitialState(plain));
    const attrs = getRowAttributes(model.rows[0], plain);
    expect(attrs['aria-selected']).toBeUndefined();
    expect(attrs['aria-expanded']).toBeUndefined();
  });
});

describe('compactAttributes', () => {
  it('drops undefined values', () => {
    expect(compactAttributes({ a: '1', b: undefined })).toEqual({ a: '1' });
  });
});
