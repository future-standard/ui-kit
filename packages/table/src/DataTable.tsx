import type { TableOptions } from '@future-standard-ui/table-core';
import { type RootProps, Table } from './Table';
import { useTable } from './useTable';

type CoreOptions<TRow> = Omit<TableOptions<TRow>, 'skipValidation'>;

export type DataTableProps<TRow> = CoreOptions<TRow> & Omit<RootProps<TRow>, 'table' | 'children'>;

const CORE_OPTION_KEYS = [
  'schema',
  'data',
  'state',
  'initialState',
  'onStateChange',
  'onSortingChange',
  'onRowSelectionChange',
  'onExpandedChange',
  'onColumnVisibilityChange',
  'onColumnPinningChange',
  'onCollapsedGroupsChange',
  'status',
  'clientSorting',
  'comparators',
  'accessors',
  'multiSort',
  'allowSortClear',
] as const satisfies readonly (keyof CoreOptions<unknown>)[];

function splitProps<TRow>(props: DataTableProps<TRow>) {
  const core: Record<string, unknown> = {};
  const root: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if ((CORE_OPTION_KEYS as readonly string[]).includes(key)) core[key] = value;
    else root[key] = value;
  }
  return {
    core: core as unknown as CoreOptions<TRow>,
    root: root as unknown as Omit<RootProps<TRow>, 'table' | 'children'>,
  };
}

/**
 * The schema-driven table for the common case: pass a schema and data, wire up the state you
 * want to control, and get a full table. Compose the primitives directly when you need a
 * different structure.
 */
export function DataTable<TRow>(props: DataTableProps<TRow>) {
  const { core, root } = splitProps(props);
  const table = useTable<TRow>(core);

  return (
    <Table.Root table={table} {...root}>
      <Table.Scroll>
        <Table.Element>
          <Table.Head />
          <Table.Body />
        </Table.Element>
      </Table.Scroll>
    </Table.Root>
  );
}
