import { type Accessor, createAccessor, getRowKey } from './accessor';
import type { ColumnSchema, TableSchema } from './schema';
import { type Comparator, sortRows } from './sorting';
import type { TableState } from './state';

export type Cell = {
  columnId: string;
  column: ColumnSchema;
  value: unknown;
};

export type Row<TRow = unknown> = {
  /** Stable key from `schema.rowKey`. */
  key: string;
  /** Position in the (possibly sorted) row list. */
  index: number;
  original: TRow;
  cells: Cell[];
  getValue: (columnId: string) => unknown;
  isSelected: boolean;
  isExpanded: boolean;
};

export type RowGroup<TRow = unknown> = {
  /** `String(value)` of the grouping column. */
  key: string;
  value: unknown;
  rows: Row<TRow>[];
  isCollapsed: boolean;
};

export type RowModel<TRow = unknown> = {
  rows: Row<TRow>[];
  rowsByKey: Map<string, Row<TRow>>;
  /** Keys in render order. Handy for select-all. */
  keys: string[];
  /** Present only when `schema.features.grouping` is set. */
  groups: RowGroup<TRow>[] | undefined;
};

export type RowModelOptions<TRow = unknown> = {
  /**
   * Sort rows in the core from `state.sorting`. Default `false`: the table is controlled-first
   * and the consumer sorts (server-side or otherwise) and passes sorted data.
   */
  clientSorting?: boolean;
  /** Per-column comparators for client sorting. Keyed by column id. */
  comparators?: Record<string, Comparator>;
  /** Per-column accessor functions overriding the schema's string paths. Keyed by column id. */
  accessors?: Record<string, Accessor<TRow>>;
};

/** Build column accessors once per model build: runtime override → schema path → column id. */
export function buildAccessors<TRow>(
  schema: TableSchema,
  overrides: Record<string, Accessor<TRow>> = {}
): Map<string, Accessor<TRow>> {
  return new Map(
    schema.columns.map((column) => [
      column.id,
      overrides[column.id] ?? createAccessor<TRow>(column.accessor ?? column.id),
    ])
  );
}

/**
 * Turn raw data into rows with resolved cell values and derived flags. Pure: the same inputs
 * produce an equivalent model. Data is never mutated.
 */
export function buildRowModel<TRow>(
  data: readonly TRow[],
  schema: TableSchema,
  state: Pick<TableState, 'sorting' | 'rowSelection' | 'expanded' | 'collapsedGroups'>,
  options: RowModelOptions<TRow> = {}
): RowModel<TRow> {
  const accessors = buildAccessors(schema, options.accessors);
  const read = (row: TRow, columnId: string) => accessors.get(columnId)?.(row);

  const ordered = options.clientSorting
    ? sortRows(data, state.sorting, read, options.comparators)
    : [...data];

  const rows: Row<TRow>[] = ordered.map((original, index) => {
    const key = getRowKey(original, schema);
    const values = new Map<string, unknown>();
    const cells: Cell[] = schema.columns.map((column) => {
      const value = read(original, column.id);
      values.set(column.id, value);
      return { columnId: column.id, column, value };
    });
    return {
      key,
      index,
      original,
      cells,
      getValue: (columnId) => values.get(columnId),
      isSelected: state.rowSelection[key] === true,
      isExpanded: state.expanded[key] === true,
    };
  });

  const rowsByKey = new Map(rows.map((row) => [row.key, row]));
  const grouping = schema.features?.grouping;

  return {
    rows,
    rowsByKey,
    keys: rows.map((row) => row.key),
    groups: grouping ? groupAdjacentRows(rows, grouping.by, state.collapsedGroups) : undefined,
  };
}

/**
 * Group *adjacent* rows by a column's value. Rows are expected to be sorted by that column
 * (that is what "sorted by a category" means in the spec); unsorted data yields fragmented groups
 * by design rather than silently reordering the consumer's data.
 */
export function groupAdjacentRows<TRow>(
  rows: readonly Row<TRow>[],
  columnId: string,
  collapsed: TableState['collapsedGroups']
): RowGroup<TRow>[] {
  const groups: RowGroup<TRow>[] = [];
  for (const row of rows) {
    const value = row.getValue(columnId);
    const key = String(value);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.rows.push(row);
    } else {
      groups.push({ key, value, rows: [row], isCollapsed: collapsed[key] === true });
    }
  }
  return groups;
}
