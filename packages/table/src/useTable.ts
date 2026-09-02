import { createTable, type TableInstance, type TableOptions } from '@future-standard-ui/table-core';
import { useState, useSyncExternalStore } from 'react';

/**
 * Bind a `table-core` instance to React. The instance is created once; every render syncs the
 * latest options into it silently (React is already rendering, so no notification is needed),
 * and internal state changes re-render through `useSyncExternalStore`.
 *
 * Controlled slices work the React way: pass `state.sorting` + `onSortingChange` and the table
 * reports changes without touching your state.
 */
export function useTable<TRow>(options: TableOptions<TRow>): TableInstance<TRow> {
  const [table] = useState(() => createTable(options));
  table.setOptions(options, { silent: true });
  useSyncExternalStore(table.subscribe, table.getState, table.getState);
  return table;
}
