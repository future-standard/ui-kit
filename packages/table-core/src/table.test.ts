import { describe, expect, it, vi } from 'vitest';
import type { SortingState } from './state';
import { createTable } from './table';
import { type Camera, cameraSchema, cameras } from './table.fixtures';
import { SchemaError } from './validate';

const make = (overrides: Partial<Parameters<typeof createTable<Camera>>[0]> = {}) =>
  createTable<Camera>({ schema: cameraSchema, data: cameras, ...overrides });

describe('createTable', () => {
  it('validates the schema on creation', () => {
    expect(() => createTable({ schema: { columns: [] } as never, data: [] })).toThrow(SchemaError);
  });

  it('seeds state from the schema and initialState', () => {
    const table = make({ initialState: { sorting: [{ id: 'name', desc: false }] } });
    expect(table.getState().columnPinning).toEqual({ start: ['name'], end: [] });
    expect(table.getState().sorting).toEqual([{ id: 'name', desc: false }]);
  });

  describe('uncontrolled', () => {
    it('toggles sorting only on sortable columns and notifies subscribers', () => {
      const table = make();
      const listener = vi.fn();
      table.subscribe(listener);

      table.toggleSort('route'); // not sortable
      expect(table.getState().sorting).toEqual([]);
      expect(listener).not.toHaveBeenCalled();

      table.toggleSort('name');
      expect(table.getColumnSort('name')).toEqual({ id: 'name', desc: false });
      expect(listener).toHaveBeenCalledTimes(1);
      table.toggleSort('name');
      expect(table.getColumnSort('name')).toEqual({ id: 'name', desc: true });
    });

    it('throws for unknown columns', () => {
      expect(() => make().toggleSort('nope')).toThrow(/Unknown column "nope"/);
    });

    it('selects rows and all rows with summary', () => {
      const table = make();
      expect(table.getSelectionSummary()).toBe('none');
      table.toggleRowSelected('1');
      expect(table.getSelectedKeys()).toEqual(['1']);
      expect(table.getSelectionSummary()).toBe('some');
      table.toggleAllRowsSelected();
      expect(table.getSelectionSummary()).toBe('all');
      expect(table.getRowModel().rows.every((r) => r.isSelected)).toBe(true);
      table.toggleAllRowsSelected();
      expect(table.getSelectionSummary()).toBe('none');
    });

    it('ignores select-all when selection is not multiple', () => {
      const table = make({
        schema: { ...cameraSchema, features: { selection: 'single' } },
      });
      table.toggleAllRowsSelected(true);
      expect(table.getSelectedKeys()).toEqual([]);
      table.toggleRowSelected('1');
      table.toggleRowSelected('2');
      expect(table.getSelectedKeys()).toEqual(['2']);
    });

    it('expands rows only when the feature is on', () => {
      const table = make();
      table.toggleExpanded('1');
      expect(table.getRowModel().rowsByKey.get('1')?.isExpanded).toBe(true);
      table.toggleExpanded('1');
      expect(table.getState().expanded).toEqual({});

      const noExpand = make({ schema: { ...cameraSchema, features: {} } });
      noExpand.toggleExpanded('1');
      expect(noExpand.getState().expanded).toEqual({});
    });

    it('hides, shows and pins columns', () => {
      const table = make();
      table.setColumnVisibility('status', false);
      expect(table.getVisibleColumns().map((c) => c.id)).not.toContain('status');
      table.setColumnVisibility('status', true);
      expect(table.getState().columnVisibility).toEqual({});

      table.pinColumn('lastSeen', 'end');
      expect(table.getVisibleColumns().at(-1)?.id).toBe('lastSeen');
      table.pinColumn('name', undefined);
      expect(table.getState().columnPinning).toEqual({ start: [], end: ['lastSeen'] });
    });

    it('collapses groups only when grouping is configured', () => {
      const grouped = make({
        schema: {
          ...cameraSchema,
          features: { ...cameraSchema.features, grouping: { by: 'route' } },
        },
      });
      grouped.toggleGroupCollapsed('R1');
      expect(grouped.getRowModel().groups?.find((g) => g.key === 'R1')?.isCollapsed).toBe(true);

      const plain = make();
      plain.toggleGroupCollapsed('R1');
      expect(plain.getState().collapsedGroups).toEqual({});
    });

    it('exposes header groups for the visible columns', () => {
      const table = make();
      expect(table.getHeaderGroups().find((g) => g.title === 'Location')?.span).toBe(2);
      table.setColumnVisibility('route', false);
      expect(table.getHeaderGroups().find((g) => g.title === 'Location')?.span).toBe(1);
    });
  });

  describe('controlled', () => {
    it('reports changes without updating internal state, then follows setOptions', () => {
      const onSortingChange = vi.fn<(s: SortingState) => void>();
      const onStateChange = vi.fn();
      const table = make({ state: { sorting: [] }, onSortingChange, onStateChange });

      table.toggleSort('name');
      expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ sorting: [{ id: 'name', desc: false }] })
      );
      // still controlled at [] until the consumer passes it back
      expect(table.getState().sorting).toEqual([]);

      const listener = vi.fn();
      table.subscribe(listener);
      table.setOptions({ state: { sorting: [{ id: 'name', desc: false }] } });
      expect(table.getState().sorting).toEqual([{ id: 'name', desc: false }]);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('mixes controlled and uncontrolled slices', () => {
      const onRowSelectionChange = vi.fn();
      const table = make({ state: { rowSelection: { '1': true } }, onRowSelectionChange });
      // uncontrolled slice still works internally
      table.toggleSort('name');
      expect(table.getState().sorting).toEqual([{ id: 'name', desc: false }]);
      // controlled slice reports only
      table.toggleRowSelected('2');
      expect(onRowSelectionChange).toHaveBeenCalledWith({ '1': true, '2': true });
      expect(table.getState().rowSelection).toEqual({ '1': true });
    });

    it('setState fans out to per-slice handlers', () => {
      const onExpandedChange = vi.fn();
      const table = make({ onExpandedChange });
      table.setState((s) => ({ ...s, expanded: { '3': true } }));
      expect(onExpandedChange).toHaveBeenCalledWith({ '3': true });
      expect(table.getState().expanded).toEqual({ '3': true });
    });
  });

  describe('options and memoisation', () => {
    it('re-reads data and status through setOptions', () => {
      const table = make({ status: 'loading' });
      expect(table.getRootAttributes()['data-status']).toBe('loading');
      table.setOptions({ data: cameras.slice(0, 1), status: 'idle' });
      expect(table.getRowModel().rows).toHaveLength(1);
      expect(table.getRootAttributes()['data-status']).toBe('idle');
    });

    it('returns the same row model while inputs are unchanged', () => {
      const table = make();
      const a = table.getRowModel();
      expect(table.getRowModel()).toBe(a);
      table.toggleRowSelected('1');
      expect(table.getRowModel()).not.toBe(a);
      const columns = table.getVisibleColumns();
      table.toggleRowSelected('2');
      expect(table.getVisibleColumns()).toBe(columns);
    });

    it('sorts client-side when asked and re-sorts on toggle', () => {
      const table = make({ clientSorting: true });
      table.toggleSort('clipCount');
      expect(table.getRowModel().rows.map((r) => r.getValue('clipCount'))).toEqual([0, 4, 12]);
      table.toggleSort('clipCount');
      expect(table.getRowModel().rows.map((r) => r.getValue('clipCount'))).toEqual([12, 4, 0]);
    });

    it('validates a replaced schema', () => {
      const table = make();
      expect(() => table.setOptions({ schema: { rowKey: '', columns: [] } })).toThrow(SchemaError);
    });

    it('produces DOM contract attributes from the current state', () => {
      const table = make();
      table.toggleSort('name');
      expect(table.getHeaderCellAttributes('name')['aria-sort']).toBe('ascending');
      expect(table.getCellAttributes('kmPost')['data-align']).toBe('end');
      const row = table.getRowModel().rows[0];
      expect(table.getRowAttributes(row, { tone: 'muted' })['data-tone']).toBe('muted');
    });
  });
});
