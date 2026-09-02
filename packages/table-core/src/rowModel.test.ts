import { describe, expect, it } from 'vitest';
import { buildRowModel, groupAdjacentRows } from './rowModel';
import { createInitialState } from './state';
import { type Camera, cameraSchema, cameras } from './table.fixtures';

describe('buildRowModel', () => {
  it('resolves cell values through schema accessors and defaults', () => {
    const model = buildRowModel(cameras, cameraSchema, createInitialState(cameraSchema));
    const first = model.rows[0];
    expect(first.key).toBe('3');
    expect(first.getValue('name')).toBe('Camera 10');
    expect(first.getValue('route')).toBe('R2');
    expect(first.getValue('kmPost')).toBe(12.5);
    expect(first.cells.map((c) => c.columnId)).toEqual(cameraSchema.columns.map((c) => c.id));
    expect(model.keys).toEqual(['3', '1', '2']);
    expect(model.rowsByKey.get('1')?.original).toBe(cameras[1]);
  });

  it('keeps the consumer order by default even when sorting state is set', () => {
    const state = createInitialState(cameraSchema, { sorting: [{ id: 'name', desc: false }] });
    const model = buildRowModel(cameras, cameraSchema, state);
    expect(model.keys).toEqual(['3', '1', '2']);
  });

  it('sorts in the core when clientSorting is on', () => {
    const state = createInitialState(cameraSchema, { sorting: [{ id: 'name', desc: false }] });
    const model = buildRowModel(cameras, cameraSchema, state, { clientSorting: true });
    expect(model.rows.map((r) => r.getValue('name'))).toEqual([
      'Camera 1',
      'Camera 2',
      'Camera 10',
    ]);
    expect(model.rows.map((r) => r.index)).toEqual([0, 1, 2]);
    // empty values last in either direction
    const byKm = buildRowModel(
      cameras,
      cameraSchema,
      createInitialState(cameraSchema, { sorting: [{ id: 'kmPost', desc: true }] }),
      { clientSorting: true }
    );
    expect(byKm.rows.map((r) => r.getValue('kmPost'))).toEqual([12.5, 3, null]);
  });

  it('derives selection and expansion flags from state', () => {
    const state = createInitialState(cameraSchema, {
      rowSelection: { '1': true },
      expanded: { '2': true },
    });
    const model = buildRowModel(cameras, cameraSchema, state);
    expect(model.rowsByKey.get('1')?.isSelected).toBe(true);
    expect(model.rowsByKey.get('2')?.isSelected).toBe(false);
    expect(model.rowsByKey.get('2')?.isExpanded).toBe(true);
  });

  it('applies runtime accessor overrides', () => {
    const model = buildRowModel(cameras, cameraSchema, createInitialState(cameraSchema), {
      accessors: { name: (row: Camera) => row.name.toUpperCase() },
    });
    expect(model.rows[0].getValue('name')).toBe('CAMERA 10');
  });

  it('does not mutate the data', () => {
    const snapshot = JSON.stringify(cameras);
    buildRowModel(
      cameras,
      cameraSchema,
      createInitialState(cameraSchema, { sorting: [{ id: 'clipCount', desc: true }] }),
      { clientSorting: true }
    );
    expect(JSON.stringify(cameras)).toBe(snapshot);
  });

  it('throws a clear error when a row has no key', () => {
    const broken = [{ ...cameras[0], id: undefined as unknown as number }];
    expect(() => buildRowModel(broken, cameraSchema, createInitialState(cameraSchema))).toThrow(
      /missing a key/
    );
  });

  it('groups adjacent rows when grouping is configured', () => {
    const grouped = {
      ...cameraSchema,
      features: { ...cameraSchema.features, grouping: { by: 'route' } },
    };
    const state = createInitialState(grouped, {
      sorting: [{ id: 'route', desc: false }],
      collapsedGroups: { R1: true },
    });
    const model = buildRowModel(cameras, grouped, state, { clientSorting: true });
    expect(model.groups?.map((g) => [g.key, g.rows.length, g.isCollapsed])).toEqual([
      ['R1', 2, true],
      ['R2', 1, false],
    ]);
  });

  it('has no groups without grouping', () => {
    const model = buildRowModel(cameras, cameraSchema, createInitialState(cameraSchema));
    expect(model.groups).toBeUndefined();
  });
});

describe('groupAdjacentRows', () => {
  it('fragments groups when rows are not sorted, by design', () => {
    const model = buildRowModel(cameras, cameraSchema, createInitialState(cameraSchema));
    const groups = groupAdjacentRows(model.rows, 'route', {});
    expect(groups.map((g) => g.key)).toEqual(['R2', 'R1']);
    expect(groups[1].rows).toHaveLength(2);
  });
});
