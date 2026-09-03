import { type CellActionEvent, DataTable, type TableSchema } from '@future-standard-ui/table';
import { createTableCells } from '@future-standard-ui/table-cells';
import { useState } from 'react';
import { icons } from './icons';

type Sample = {
  id: string;
  label: string;
  amount: number | null;
  bytes: number;
  seconds: number | null;
  flag: boolean;
  at: string | null;
  person: { name: string; role: string };
  traffic: { in: number; out: number };
  state: 'online' | 'degraded' | 'offline' | 'unknown';
  image: string | null;
  target: { id: number; slug: string };
  enabled: boolean;
  usage: { used: number; total: number };
  longText: string;
  kind: 'camera' | 'ptz';
  locked: boolean;
};

const samples: Sample[] = [
  {
    id: 's1',
    label: 'Typical',
    amount: 1234.5,
    bytes: 61_800_000,
    seconds: 305,
    flag: true,
    at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    person: { name: 'Ada Lovelace', role: 'Administrator' },
    traffic: { in: 120, out: 80 },
    state: 'online',
    image: 'https://picsum.photos/seed/gallery1/96/54',
    target: { id: 7, slug: 'north-gate' },
    enabled: true,
    usage: { used: 42, total: 100 },
    longText: 'A very long free-text value that will be truncated with the full text in a tooltip',
    kind: 'ptz',
    locked: false,
  },
  {
    id: 's2',
    label: 'Thresholds',
    amount: 0.75,
    bytes: 1_500_000_000,
    seconds: 3725,
    flag: false,
    at: new Date(Date.now() - 26 * 3600_000).toISOString(),
    person: { name: 'Grace Hopper', role: 'Viewer' },
    traffic: { in: 40, out: 15 },
    state: 'degraded',
    image: 'https://picsum.photos/seed/gallery2/96/54',
    target: { id: 8, slug: 'south' },
    enabled: false,
    usage: { used: 88, total: 100 },
    longText: 'Short',
    kind: 'camera',
    locked: false,
  },
  {
    id: 's3',
    label: 'Empty values',
    amount: null,
    bytes: 0,
    seconds: null,
    flag: false,
    at: null,
    person: { name: 'Unassigned', role: '' },
    traffic: { in: 0, out: 0 },
    state: 'unknown',
    image: null,
    target: { id: 9, slug: 'east' },
    enabled: true,
    usage: { used: 97, total: 100 },
    longText: '',
    kind: 'camera',
    locked: true,
  },
];

/**
 * One column per standard cell type. Each column's schema is shown beneath the table, so this
 * page doubles as a visual reference for the JSON that produces each cell.
 */
const schema: TableSchema = {
  id: 'cells-gallery',
  rowKey: 'id',
  columns: [
    { id: 'label', header: 'text', emphasis: 'high', pin: 'start', width: '130px' },
    {
      id: 'amount',
      header: 'number',
      cell: { type: 'number', options: { unit: 'km', digits: 1 } },
      align: 'end',
      width: '110px',
    },
    { id: 'bytes', header: 'bytes', cell: { type: 'bytes' }, align: 'end', width: '100px' },
    { id: 'seconds', header: 'duration', cell: { type: 'duration' }, align: 'end', width: '100px' },
    {
      id: 'flag',
      header: 'boolean',
      cell: { type: 'boolean', options: { yes: 'Yes', no: 'No' } },
      align: 'center',
      width: '90px',
    },
    {
      id: 'at',
      header: 'timestamp',
      cell: { type: 'timestamp', options: { secondary: 'relative', bold: true } },
      width: '150px',
    },
    {
      id: 'person',
      header: 'multiline',
      accessor: 'person.name',
      cell: {
        type: 'multiline',
        options: {
          lines: [{ accessor: 'person.name', emphasis: 'high' }, { accessor: 'person.role' }],
        },
      },
      width: '160px',
    },
    {
      id: 'traffic',
      header: 'composite',
      accessor: 'traffic.in',
      cell: {
        type: 'composite',
        options: {
          parts: [
            { accessor: 'traffic.in', label: '↓', unit: 'Mb/s' },
            { accessor: 'traffic.out', label: '↑', unit: 'Mb/s' },
          ],
        },
      },
      width: '180px',
    },
    {
      id: 'state',
      header: 'status (dot)',
      cell: {
        type: 'status',
        options: { tones: { online: 'success', degraded: 'warning', offline: 'danger' } },
      },
      width: '130px',
    },
    {
      id: 'stateBadge',
      header: 'status (badge)',
      accessor: 'state',
      cell: {
        type: 'status',
        options: {
          variant: 'badge',
          tones: { online: 'success', degraded: 'warning', offline: 'danger' },
          labels: { unknown: 'Unknown' },
        },
      },
      width: '140px',
    },
    {
      id: 'image',
      header: 'thumbnail',
      cell: { type: 'thumbnail', options: { altAccessor: 'label' } },
      width: '90px',
    },
    {
      id: 'link',
      header: 'link',
      accessor: 'target.slug',
      cell: { type: 'link', options: { href: '/devices/{target.id}' } },
      width: '120px',
    },
    {
      id: 'linkAction',
      header: 'link (action)',
      accessor: 'target.slug',
      cell: { type: 'link', options: { action: 'open' } },
      width: '130px',
    },
    {
      id: 'enabled',
      header: 'switch',
      cell: {
        type: 'switch',
        options: { label: 'Enabled', enabledWhen: { accessor: 'locked', truthy: false } },
      },
      align: 'center',
      width: '90px',
    },
    {
      id: 'usage',
      header: 'progress',
      accessor: 'usage.used',
      cell: {
        type: 'progress',
        options: {
          maxAccessor: 'usage.total',
          thresholds: [
            { from: 75, tone: 'warning' },
            { from: 90, tone: 'danger' },
          ],
          label: 'Usage',
        },
      },
      width: '160px',
    },
    {
      id: 'longText',
      header: 'truncate',
      cell: { type: 'truncate', options: { maxWidth: '160px' } },
      width: '180px',
    },
    {
      id: 'kind',
      header: 'icon',
      cell: {
        type: 'icon',
        options: {
          icons: { camera: 'camera', ptz: 'ptz' },
          labels: { camera: 'Fixed camera', ptz: 'PTZ camera' },
        },
      },
      align: 'center',
      width: '80px',
    },
    {
      id: 'actions',
      header: 'actions',
      cell: {
        type: 'actions',
        options: {
          actions: [
            { id: 'edit', label: 'Edit', icon: 'edit', iconOnly: true },
            {
              id: 'download',
              label: 'Download',
              icon: 'download',
              iconOnly: true,
              enabledWhen: { accessor: 'locked', truthy: false },
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: 'delete',
              iconOnly: true,
              design: 'danger',
              visibleWhen: { accessor: 'locked', truthy: false },
            },
          ],
        },
      },
      align: 'end',
      pin: 'end',
      width: '120px',
    },
  ],
  features: { density: 'comfortable', stickyHeader: true },
};

const cells = createTableCells<Sample>({ icons });

export function CellsGalleryExample() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [lastAction, setLastAction] = useState<string | null>(null);
  const data = samples.map((s) =>
    enabled[s.id] === undefined ? s : { ...s, enabled: enabled[s.id] }
  );

  const onCellAction = ({ action, row, detail }: CellActionEvent<Sample>) => {
    if (action === 'switch')
      setEnabled((prev) => ({ ...prev, [row.original.id]: Boolean(detail) }));
    setLastAction(
      `${action} → ${row.original.label}${detail !== undefined ? ` (${String(detail)})` : ''}`
    );
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <DataTable<Sample> schema={schema} data={data} cells={cells} onCellAction={onCellAction} />
      <p style={{ margin: 0, opacity: 0.7 }}>
        Rows: a typical record, one that trips thresholds, and one full of empty values. Last cell
        action: <code>{lastAction ?? '—'}</code>
      </p>
      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Column schemas</h3>
        {schema.columns.map((column) => (
          <details key={column.id}>
            <summary>
              <code>{column.cell?.type ?? 'text'}</code> — {column.header}
            </summary>
            <pre style={{ fontSize: 12, overflow: 'auto' }}>{JSON.stringify(column, null, 2)}</pre>
          </details>
        ))}
      </section>
    </div>
  );
}
