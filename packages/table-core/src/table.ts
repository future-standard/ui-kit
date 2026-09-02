import type { Accessor } from './accessor';
import { getHeaderGroups, getVisibleColumns, type HeaderGroup } from './columns';
import {
  type Attributes,
  getCellAttributes,
  getHeaderCellAttributes,
  getRootAttributes,
  getRowAttributes,
  type RowAttributeOptions,
  type TableStatus,
} from './domContract';
import { buildRowModel, type Row, type RowModel } from './rowModel';
import { type ColumnSchema, type PinSide, resolveFeatures, type TableSchema } from './schema';
import {
  getSelectedKeys,
  getSelectionSummary,
  type SelectionSummary,
  setSelectionForKeys,
  toggleRowSelection,
} from './selection';
import { type Comparator, getColumnSort, toggleColumnSort } from './sorting';
import { type ColumnSort, createInitialState, TABLE_STATE_KEYS, type TableState } from './state';
import { createStore, type Listener, resolveUpdater, type Updater } from './store';
import { assertSchema } from './validate';

type SliceChangeHandlers = {
  [K in keyof TableState as `on${Capitalize<K>}Change`]?: (value: TableState[K]) => void;
};

export type TableOptions<TRow = unknown> = SliceChangeHandlers & {
  schema: TableSchema;
  data: readonly TRow[];
  /**
   * Controlled state. Any slice present here is owned by the consumer: the table reports changes
   * through `on<Slice>Change` and does not update it internally. Slices left `undefined` are
   * uncontrolled and managed by the instance.
   */
  state?: Partial<TableState>;
  /** Seeds for uncontrolled slices. */
  initialState?: Partial<TableState>;
  /** Fired with the full resolved state after any change, controlled or not. */
  onStateChange?: (state: TableState) => void;
  /** Async status of `data`, surfaced as `data-status` on the root. */
  status?: TableStatus;
  /** Sort `data` in the core from `state.sorting`. Default `false` (consumer sorts). */
  clientSorting?: boolean;
  comparators?: Record<string, Comparator>;
  accessors?: Record<string, Accessor<TRow>>;
  /** Allow several sorted columns. Default `false`. */
  multiSort?: boolean;
  /** Third header click clears the sort. Default `false`. */
  allowSortClear?: boolean;
  /** Skip schema validation (e.g. already validated at build time). Default `false`. */
  skipValidation?: boolean;
};

export type TableInstance<TRow = unknown> = {
  getSchema: () => TableSchema;
  getOptions: () => TableOptions<TRow>;
  /**
   * Merge new options (new data, new controlled state, …) and notify subscribers.
   * Pass `{ silent: true }` when the caller is already re-rendering (React syncing props
   * during render) and must not be notified again.
   */
  setOptions: (patch: Partial<TableOptions<TRow>>, options?: { silent?: boolean }) => void;

  /** Resolved state: controlled slices from options, everything else from the internal store. */
  getState: () => TableState;
  setState: (updater: Updater<TableState>) => void;
  /** Notified after any state or option change. */
  subscribe: (listener: Listener<TableState>) => () => void;

  getRowModel: () => RowModel<TRow>;
  getVisibleColumns: () => ColumnSchema[];
  getHeaderGroups: () => HeaderGroup[];
  getColumn: (columnId: string) => ColumnSchema | undefined;

  // Sorting
  getColumnSort: (columnId: string) => ColumnSort | undefined;
  toggleSort: (columnId: string) => void;
  setSorting: (updater: Updater<TableState['sorting']>) => void;

  // Selection
  toggleRowSelected: (key: string, value?: boolean) => void;
  /** Select/deselect every row in the current row model. Omit `value` to flip based on the summary. */
  toggleAllRowsSelected: (value?: boolean) => void;
  getSelectionSummary: () => SelectionSummary;
  getSelectedKeys: () => string[];

  // Expansion
  toggleExpanded: (key: string, value?: boolean) => void;

  // Columns
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  pinColumn: (columnId: string, side: PinSide | undefined) => void;

  // Grouping
  toggleGroupCollapsed: (groupKey: string, value?: boolean) => void;

  // DOM contract
  getRootAttributes: () => Attributes;
  getHeaderCellAttributes: (columnId: string) => Attributes;
  getCellAttributes: (columnId: string) => Attributes;
  getRowAttributes: (row: Row<TRow>, options?: RowAttributeOptions) => Attributes;
};

const capitalize = <K extends string>(key: K) =>
  (key.charAt(0).toUpperCase() + key.slice(1)) as Capitalize<K>;

/**
 * Create a table instance. Framework-free: React (or anything else) binds through `subscribe`
 * and `setOptions`. All derived data (`getRowModel`, `getVisibleColumns`) is memoised on the
 * identity of its inputs, so calling the getters repeatedly is cheap.
 */
export function createTable<TRow = unknown>(
  initialOptions: TableOptions<TRow>
): TableInstance<TRow> {
  if (!initialOptions.skipValidation) assertSchema(initialOptions.schema);

  let options = initialOptions;
  const internal = createStore<TableState>(
    createInitialState(options.schema, options.initialState)
  );
  const listeners = new Set<Listener<TableState>>();

  let lastState: TableState | undefined;

  /**
   * Resolved state = internal state with controlled slices laid over it. Memoised on the identity
   * of both inputs so repeated reads (e.g. React's `useSyncExternalStore` snapshot) are stable.
   */
  let resolvedCache:
    | { base: TableState; controlled: Partial<TableState> | undefined; value: TableState }
    | undefined;
  const resolveState = (): TableState => {
    const base = internal.getState();
    const controlled = options.state;
    if (resolvedCache && resolvedCache.base === base && resolvedCache.controlled === controlled) {
      return resolvedCache.value;
    }
    let value = base;
    if (controlled) {
      const merged: TableState = { ...base };
      let changed = false;
      for (const key of TABLE_STATE_KEYS) {
        const slice = controlled[key];
        if (slice !== undefined) {
          (merged as Record<string, unknown>)[key] = slice;
          changed = true;
        }
      }
      value = changed ? merged : base;
    }
    resolvedCache = { base, controlled, value };
    return value;
  };

  const notify = () => {
    const previous = lastState ?? resolveState();
    const next = resolveState();
    lastState = next;
    for (const listener of listeners) listener(next, previous);
  };

  internal.subscribe(notify);

  /**
   * The one write path. Computes the slice's next value, reports it to the consumer, and updates
   * the internal store only when the slice is uncontrolled.
   */
  const updateSlice = <K extends keyof TableState>(key: K, updater: Updater<TableState[K]>) => {
    const current = resolveState();
    const next = resolveUpdater(updater, current[key]);
    if (Object.is(next, current[key])) return;

    const handler = options[`on${capitalize(key)}Change`] as
      | ((value: TableState[K]) => void)
      | undefined;
    handler?.(next);
    options.onStateChange?.({ ...current, [key]: next });

    if (options.state?.[key] === undefined) {
      internal.setState((previous) => ({ ...previous, [key]: next }));
    }
  };

  // --- memoised derivations -------------------------------------------------

  let rowModelCache: { deps: readonly unknown[]; value: RowModel<TRow> } | undefined;
  const getRowModel = (): RowModel<TRow> => {
    const state = resolveState();
    const deps = [
      options.data,
      options.schema,
      options.clientSorting,
      options.comparators,
      options.accessors,
      state.sorting,
      state.rowSelection,
      state.expanded,
      state.collapsedGroups,
    ];
    if (rowModelCache?.deps.every((dep, i) => Object.is(dep, deps[i]))) {
      return rowModelCache.value;
    }
    const value = buildRowModel(options.data, options.schema, state, {
      clientSorting: options.clientSorting,
      comparators: options.comparators,
      accessors: options.accessors,
    });
    rowModelCache = { deps, value };
    return value;
  };

  let columnsCache: { deps: readonly unknown[]; value: ColumnSchema[] } | undefined;
  const getVisibleColumnsMemo = (): ColumnSchema[] => {
    const state = resolveState();
    const deps = [options.schema, state.columnVisibility, state.columnPinning];
    if (columnsCache?.deps.every((dep, i) => Object.is(dep, deps[i]))) {
      return columnsCache.value;
    }
    const value = getVisibleColumns(options.schema, state);
    columnsCache = { deps, value };
    return value;
  };

  const requireColumn = (columnId: string): ColumnSchema => {
    const column = options.schema.columns.find((c) => c.id === columnId);
    if (!column) throw new Error(`Unknown column "${columnId}"`);
    return column;
  };

  // --- instance -------------------------------------------------------------

  return {
    getSchema: () => options.schema,
    getOptions: () => options,
    setOptions: (patch, { silent = false } = {}) => {
      const nextSchema = patch.schema ?? options.schema;
      if (patch.schema && patch.schema !== options.schema && !patch.skipValidation) {
        assertSchema(nextSchema);
      }
      options = { ...options, ...patch };
      if (silent) lastState = resolveState();
      else notify();
    },

    getState: resolveState,
    setState: (updater) => {
      const current = resolveState();
      const next = resolveUpdater(updater, current);
      for (const key of TABLE_STATE_KEYS) {
        if (!Object.is(next[key], current[key])) updateSlice(key, next[key]);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getRowModel,
    getVisibleColumns: getVisibleColumnsMemo,
    getHeaderGroups: () => getHeaderGroups(getVisibleColumnsMemo()),
    getColumn: (columnId) => options.schema.columns.find((c) => c.id === columnId),

    getColumnSort: (columnId) => getColumnSort(resolveState().sorting, columnId),
    toggleSort: (columnId) => {
      const column = requireColumn(columnId);
      if (!column.sortable) return;
      updateSlice('sorting', (sorting) =>
        toggleColumnSort(sorting, columnId, {
          multi: options.multiSort,
          allowClear: options.allowSortClear,
        })
      );
    },
    setSorting: (updater) => updateSlice('sorting', updater),

    toggleRowSelected: (key, value) => {
      const mode = resolveFeatures(options.schema).selection;
      updateSlice('rowSelection', (selection) => toggleRowSelection(selection, key, value, mode));
    },
    toggleAllRowsSelected: (value) => {
      if (resolveFeatures(options.schema).selection !== 'multiple') return;
      const { keys } = getRowModel();
      updateSlice('rowSelection', (selection) => {
        const next = value ?? getSelectionSummary(keys, selection) !== 'all';
        return setSelectionForKeys(selection, keys, next);
      });
    },
    getSelectionSummary: () => getSelectionSummary(getRowModel().keys, resolveState().rowSelection),
    getSelectedKeys: () => getSelectedKeys(resolveState().rowSelection),

    toggleExpanded: (key, value) => {
      if (!options.schema.features?.expandable) return;
      updateSlice('expanded', (expanded) => {
        const next = value ?? !expanded[key];
        if (next === (expanded[key] === true)) return expanded;
        if (!next) {
          const { [key]: _removed, ...rest } = expanded;
          return rest;
        }
        return { ...expanded, [key]: true };
      });
    },

    setColumnVisibility: (columnId, visible) => {
      requireColumn(columnId);
      updateSlice('columnVisibility', (visibility) => {
        if ((visibility[columnId] !== false) === visible) return visibility;
        if (visible) {
          const { [columnId]: _removed, ...rest } = visibility;
          return rest;
        }
        return { ...visibility, [columnId]: false };
      });
    },
    pinColumn: (columnId, side) => {
      requireColumn(columnId);
      updateSlice('columnPinning', (pinning) => {
        const start = pinning.start.filter((id) => id !== columnId);
        const end = pinning.end.filter((id) => id !== columnId);
        if (side === 'start') start.push(columnId);
        if (side === 'end') end.push(columnId);
        return { start, end };
      });
    },

    toggleGroupCollapsed: (groupKey, value) => {
      if (!options.schema.features?.grouping) return;
      updateSlice('collapsedGroups', (collapsed) => {
        const next = value ?? !collapsed[groupKey];
        if (next === (collapsed[groupKey] === true)) return collapsed;
        if (!next) {
          const { [groupKey]: _removed, ...rest } = collapsed;
          return rest;
        }
        return { ...collapsed, [groupKey]: true };
      });
    },

    getRootAttributes: () => getRootAttributes(options.schema, { status: options.status }),
    getHeaderCellAttributes: (columnId) =>
      getHeaderCellAttributes(requireColumn(columnId), resolveState()),
    getCellAttributes: (columnId) => getCellAttributes(requireColumn(columnId), resolveState()),
    getRowAttributes: (row, rowOptions) => getRowAttributes(row, options.schema, rowOptions),
  };
}
