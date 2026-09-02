import type { TableInstance, TableStatus } from '@future-standard-ui/table-core';

/**
 * The status the table should *show*. `options.status` wins; with no explicit status an empty
 * row model means `empty`. Shared by the root (`data-status`) and the body (status row) so
 * they never disagree.
 */
export function getEffectiveStatus<TRow>(table: TableInstance<TRow>): TableStatus {
  const explicit = table.getOptions().status ?? 'idle';
  if (explicit !== 'idle') return explicit;
  return table.getRowModel().rows.length === 0 ? 'empty' : 'idle';
}
