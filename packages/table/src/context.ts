import type { ColumnSchema, Row, RowGroup, TableInstance } from '@future-standard-ui/table-core';
import { createContext, type ReactNode, useContext } from 'react';

/** Everything a cell renderer can see. */
export type CellContext<TRow = unknown> = {
  value: unknown;
  row: Row<TRow>;
  column: ColumnSchema;
  table: TableInstance<TRow>;
  /** `column.cell.options` from the schema, or `{}`. */
  options: Record<string, unknown>;
};

export type CellRenderer<TRow = unknown> = (context: CellContext<TRow>) => ReactNode;

/** Cell type name → renderer. Looked up by `column.cell.type`. */
export type CellRenderers<TRow = unknown> = Record<string, CellRenderer<TRow>>;

/** Content for the non-idle states. Rendered inside the table (or as an overlay while rows are present). */
export type TableSlots = {
  loading?: ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
};

/** Per-row presentation hints surfaced as `data-tone` / `data-state` on the row. */
export type RowHints = {
  tone?: string;
  state?: string;
};

/**
 * Accessible names for controls that have no visible text. English defaults are provided
 * because these are never shown; override them for localised products.
 */
export type TableLabels = {
  selectAll: string;
  selectRow: (row: Row<never>) => string;
  expandRow: string;
  collapseRow: string;
  expandColumn: string;
};

export const defaultLabels: TableLabels = {
  selectAll: 'Select all rows',
  selectRow: (row) => `Select row ${row.key}`,
  expandRow: 'Expand row',
  collapseRow: 'Collapse row',
  expandColumn: 'Expand',
};

export type TableContextValue<TRow = unknown> = {
  table: TableInstance<TRow>;
  cells: CellRenderers<TRow>;
  slots: TableSlots;
  labels: TableLabels;
  getRowHints?: (row: Row<TRow>) => RowHints | undefined;
  renderDrawer?: (row: Row<TRow>) => ReactNode;
  renderGroupHeader?: (group: RowGroup<TRow>) => ReactNode;
};

// biome-ignore lint/suspicious/noExplicitAny: the row type is erased at the context boundary and re-applied by useTableContext<TRow>().
export const TableContext = createContext<TableContextValue<any> | null>(null);

export function useTableContext<TRow = unknown>(): TableContextValue<TRow> {
  const value = useContext(TableContext);
  if (!value) {
    throw new Error('Table primitives must be rendered inside <Table.Root>.');
  }
  return value as TableContextValue<TRow>;
}
