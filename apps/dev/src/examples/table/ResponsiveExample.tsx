import { DataTable, type TableLayout, type TableSchema } from '@future-standard-ui/table';
import { useState } from 'react';
import { exampleCells } from './cells';

type Device = {
  id: string;
  name: string;
  site: string;
  model: string;
  traffic: { ingress: number; egress: number; total: number; peak: number };
  uptimeDays: number;
  status: 'online' | 'degraded' | 'offline';
};

const devices: Device[] = Array.from({ length: 24 }, (_, i) => {
  const ingress = 40 + ((i * 37) % 900);
  const egress = 10 + ((i * 53) % 400);
  return {
    id: `GW-${String(100 + i)}`,
    name: `Gateway ${String.fromCharCode(65 + (i % 26))}${i > 25 ? i : ''}`,
    site: ['Tokyo', 'Osaka', 'Nagoya', 'Sapporo'][i % 4],
    model: ['FS-2200', 'FS-4400', 'FS-4400X'][i % 3],
    traffic: {
      ingress,
      egress,
      total: ingress + egress,
      peak: ingress + egress + ((i * 11) % 200),
    },
    uptimeDays: (i * 19) % 400,
    status: i % 9 === 4 ? 'degraded' : i % 13 === 7 ? 'offline' : 'online',
  };
});

/**
 * The Notion spec's responsive scenario: ingress and egress as separate columns on large
 * containers, one combined column on small ones; the device identity locked to the start edge,
 * actions to the end edge; a header that sticks either to the table's own scroll area or to the
 * page.
 */
const schema: TableSchema = {
  id: 'traffic',
  rowKey: 'id',
  columns: [
    { id: 'id', header: 'ID', pin: 'start', width: '90px', emphasis: 'low' },
    {
      id: 'name',
      header: 'Device',
      pin: 'start',
      width: '150px',
      emphasis: 'high',
      sortable: true,
    },
    { id: 'site', header: 'Site', width: '110px', sortable: true },
    { id: 'model', header: 'Model', width: '110px', visibleFrom: 'md' },
    { id: 'status', header: 'Status', cell: { type: 'status' }, width: '130px' },
    {
      id: 'ingress',
      header: 'Ingress',
      accessor: 'traffic.ingress',
      cell: { type: 'number', options: { unit: 'Mb/s' } },
      align: 'end',
      sortable: true,
      visibleFrom: 'lg',
      group: 'Traffic',
      width: '120px',
    },
    {
      id: 'egress',
      header: 'Egress',
      accessor: 'traffic.egress',
      cell: { type: 'number', options: { unit: 'Mb/s' } },
      align: 'end',
      sortable: true,
      visibleFrom: 'lg',
      group: 'Traffic',
      width: '120px',
    },
    {
      id: 'traffic',
      header: 'Traffic',
      accessor: 'traffic.total',
      cell: {
        type: 'composite',
        options: {
          parts: [
            { accessor: 'traffic.ingress', label: '↓', unit: 'Mb/s' },
            { accessor: 'traffic.egress', label: '↑', unit: 'Mb/s' },
          ],
        },
      },
      sortable: true,
      visibleUntil: 'lg',
      width: '190px',
    },
    {
      id: 'peak',
      header: 'Peak',
      accessor: 'traffic.peak',
      cell: { type: 'number', options: { unit: 'Mb/s' } },
      align: 'end',
      sortable: true,
      visibleFrom: 'xl',
      width: '120px',
    },
    {
      id: 'uptime',
      header: 'Uptime',
      accessor: 'uptimeDays',
      cell: { type: 'number', options: { unit: 'd' } },
      align: 'end',
      width: '100px',
      visibleFrom: 'md',
    },
    {
      id: 'actions',
      header: '',
      cell: { type: 'deviceActions' },
      align: 'end',
      pin: 'end',
      width: '96px',
    },
  ],
  features: { selection: 'multiple', stickyHeader: true, zebra: true },
};

const cells = {
  ...exampleCells,
  deviceActions: () => (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      <button type='button' style={{ font: 'inherit', fontSize: 12 }}>
        Edit
      </button>
      <button type='button' style={{ font: 'inherit', fontSize: 12 }}>
        ⋯
      </button>
    </span>
  ),
};

export function ResponsiveExample() {
  const [layout, setLayout] = useState<TableLayout>('contained');
  const [contained, setContained] = useState(true);
  const [narrow, setNarrow] = useState(false);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <fieldset
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          border: '1px solid var(--grey-5)',
          borderRadius: 4,
          padding: 12,
        }}
      >
        <legend>Layout controls</legend>
        <label>
          Layout{' '}
          <select value={layout} onChange={(e) => setLayout(e.target.value as TableLayout)}>
            <option value='contained'>contained (own scroll, pins work)</option>
            <option value='page'>page (sticks to page scroll, no pins)</option>
          </select>
        </label>
        <label>
          <input
            type='checkbox'
            checked={contained}
            disabled={layout === 'page'}
            onChange={(e) => setContained(e.target.checked)}
          />{' '}
          maxHeight 360px
        </label>
        <label>
          <input type='checkbox' checked={narrow} onChange={(e) => setNarrow(e.target.checked)} />{' '}
          Narrow container (640px)
        </label>
      </fieldset>

      <div style={{ maxWidth: narrow ? 640 : undefined }}>
        <DataTable<Device>
          schema={schema}
          data={devices}
          layout={layout}
          maxHeight={layout === 'contained' && contained ? '360px' : undefined}
          stickyTop='0px'
          clientSorting
          cells={cells}
          slots={{ empty: 'No devices.' }}
        />
      </div>

      <p style={{ opacity: 0.7, margin: 0 }}>
        Container breakpoints: md 720 · lg 960 · xl 1200 px. Below lg the Ingress and Egress columns
        give way to the combined Traffic column. ID and Device are pinned to the start with
        schema-derived offsets; actions to the end.
      </p>
    </div>
  );
}
