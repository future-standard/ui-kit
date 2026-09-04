// Re-export the core so consumers need one import for schema types and helpers.
export type {
  Align,
  Breakpoint,
  CellSchema,
  ColumnSchema,
  ColumnSort,
  Density,
  Emphasis,
  GroupingSchema,
  PinSide,
  Row as TableRow,
  RowGroup,
  RowModel,
  RowSelectionState,
  SelectionMode,
  SortingState,
  TableFeatures,
  TableInstance,
  TableLayout,
  TableOptions,
  TableSchema,
  TableState,
  TableStatus,
} from '@future-standard-ui/table-core';
export {
  assertSchema,
  getEffectiveStatus,
  SchemaError,
  tableClasses,
  validateSchema,
} from '@future-standard-ui/table-core';
export { compositeCell, defaultCellRenderers, resolveCellRenderer, textCell } from './cells';
export {
  type CellActionEvent,
  type CellContext,
  type CellRenderer,
  type CellRenderers,
  defaultLabels,
  type RowHints,
  TableContext,
  type TableContextValue,
  type TableLabels,
  type TableSlots,
  useTableContext,
} from './context';
export { DataTable, type DataTableProps } from './DataTable';
// Primitives are exposed through the `Table` namespace (`Table.Root`, `Table.Row`, …) so their
// names never collide with the core's row-model types when both packages are re-exported together.
export {
  type CellProps,
  type DrawerProps,
  type GroupRowProps,
  type HeaderCellProps,
  type RootProps,
  type RowProps,
  type StatusProps,
  Table,
} from './Table';
export { useTable } from './useTable';
