import type { TableSchema } from './schema';

export type ColumnSort = {
  id: string;
  desc: boolean;
};

/** Array-shaped so multi-column sort is additive later. v1 keeps at most one entry. */
export type SortingState = ColumnSort[];

/** Row key → selected. Absent keys are unselected. */
export type RowSelectionState = Record<string, boolean>;

/** Row key → drawer open. */
export type ExpandedState = Record<string, boolean>;

/** Column id → visible. Absent columns are visible; only `false` hides. */
export type ColumnVisibilityState = Record<string, boolean>;

export type ColumnPinningState = {
  start: string[];
  end: string[];
};

/** Group key → collapsed. */
export type CollapsedGroupsState = Record<string, boolean>;

export type TableState = {
  sorting: SortingState;
  rowSelection: RowSelectionState;
  expanded: ExpandedState;
  columnVisibility: ColumnVisibilityState;
  columnPinning: ColumnPinningState;
  collapsedGroups: CollapsedGroupsState;
};

export type TableStateKey = keyof TableState;

export const TABLE_STATE_KEYS: readonly TableStateKey[] = [
  'sorting',
  'rowSelection',
  'expanded',
  'columnVisibility',
  'columnPinning',
  'collapsedGroups',
];

/**
 * Initial state for a schema. Pinning is seeded from the columns' `pin` declarations so the
 * schema is the default and runtime state can move columns later.
 */
export function createInitialState(
  schema: TableSchema,
  overrides: Partial<TableState> = {}
): TableState {
  const start = schema.columns.filter((c) => c.pin === 'start').map((c) => c.id);
  const end = schema.columns.filter((c) => c.pin === 'end').map((c) => c.id);
  return {
    sorting: [],
    rowSelection: {},
    expanded: {},
    columnVisibility: {},
    columnPinning: { start, end },
    collapsedGroups: {},
    ...overrides,
  };
}
