import { Table, type TableSchema, useTable } from '@future-standard-ui/table';
import { createTableCells } from '@future-standard-ui/table-cells';
import { type Camera, cameras } from './data';

const schema: TableSchema = {
  rowKey: 'id',
  columns: [
    { id: 'name', header: 'Camera', emphasis: 'high' },
    {
      id: 'status',
      header: 'Status',
      cell: {
        type: 'status',
        options: { tones: { online: 'success', degraded: 'warning', offline: 'danger' } },
      },
    },
    { id: 'clips', header: 'Clips', accessor: 'counts.clips', align: 'end' },
  ],
  features: { density: 'compact' },
};

/**
 * Composing the primitives by hand: the grouped-cameras layout mlit-cctv had to fake with a
 * header-only table plus headerless tables. Here each office gets its own body with a group
 * row, inside one table, with one header.
 */
const cells = createTableCells<Camera>();

export function PrimitivesExample() {
  const table = useTable<Camera>({ schema, data: cameras.slice(0, 12) });
  const model = table.getRowModel();
  const offices = [...new Set(model.rows.map((r) => r.original.location.office))];

  return (
    <Table.Root table={table} cells={cells}>
      <Table.Scroll>
        <Table.Element>
          <Table.Head />
          {offices.map((office) => {
            const rows = model.rows.filter((r) => r.original.location.office === office);
            // A synthetic RowGroup drives Table.GroupRow — the same part the grouping feature uses.
            const group = { key: office, value: office, rows, isCollapsed: false };
            return (
              <Table.Body key={office}>
                <Table.GroupRow group={group} />
                {rows.map((row) => (
                  <Table.Row key={row.key} row={row} />
                ))}
              </Table.Body>
            );
          })}
        </Table.Element>
      </Table.Scroll>
    </Table.Root>
  );
}
