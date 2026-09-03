import { DataTable, type TableSchema } from '@future-standard-ui/table';
import { useMemo, useState } from 'react';
import { exampleCells } from './cells';
import { type Camera, cameras } from './data';

type Controls = {
  density: 'compact' | 'normal' | 'comfortable';
  zebra: boolean;
  stickyHeader: boolean;
  selection: 'none' | 'single' | 'multiple';
  expandable: boolean;
  grouped: boolean;
  status: 'idle' | 'loading' | 'empty' | 'error';
};

/**
 * Uncontrolled, client-sorted table. Everything visible here is driven by the JSON schema
 * shown beneath it — the controls edit the schema, not the component.
 */
export function CamerasExample() {
  const [controls, setControls] = useState<Controls>({
    density: 'normal',
    zebra: false,
    stickyHeader: true,
    selection: 'multiple',
    expandable: true,
    grouped: false,
    status: 'idle',
  });

  const schema = useMemo<TableSchema>(
    () => ({
      id: 'cameras',
      rowKey: 'id',
      columns: [
        {
          id: 'name',
          header: 'Camera',
          sortable: true,
          emphasis: 'high',
          width: '180px',
          pin: 'start',
        },
        {
          id: 'status',
          header: 'Status',
          cell: { type: 'status' },
          sortable: true,
          width: '140px',
        },
        {
          id: 'route',
          header: 'Route',
          accessor: 'location.route',
          sortable: true,
          group: 'Location',
          width: '90px',
        },
        {
          id: 'kmPost',
          header: 'KM Post',
          accessor: 'location.kmPost',
          cell: { type: 'number', options: { unit: 'km', digits: 1 } },
          align: 'end',
          sortable: true,
          group: 'Location',
          width: '110px',
        },
        {
          id: 'office',
          header: 'Office',
          accessor: 'location.office',
          group: 'Location',
          width: '100px',
        },
        {
          id: 'clips',
          header: 'Clips',
          accessor: 'counts.clips',
          align: 'end',
          sortable: true,
          width: '90px',
        },
        {
          id: 'snapshots',
          header: 'Snapshots',
          accessor: 'counts.snapshots',
          align: 'end',
          sortable: true,
          width: '110px',
          visibleFrom: 'md',
        },
        {
          id: 'ptz',
          header: 'PTZ',
          cell: { type: 'boolean', options: { yes: 'PTZ' } },
          align: 'center',
          width: '70px',
          emphasis: 'low',
        },
        {
          id: 'lastSeen',
          header: 'Last seen',
          cell: { type: 'timestamp', options: { relative: true } },
          sortable: true,
          visibleFrom: 'xl',
          width: '140px',
        },
      ],
      features: {
        density: controls.density,
        zebra: controls.zebra,
        stickyHeader: controls.stickyHeader,
        selection: controls.selection,
        expandable: controls.expandable,
        grouping: controls.grouped
          ? { by: 'status', collapsible: true, stickyGroupHeader: true }
          : undefined,
      },
    }),
    [controls]
  );

  // Grouping wants rows sorted by the group column; a real screen would sort on the server.
  const data = useMemo(
    () =>
      controls.grouped ? [...cameras].sort((a, b) => a.status.localeCompare(b.status)) : cameras,
    [controls.grouped]
  );

  const set = <K extends keyof Controls>(key: K, value: Controls[K]) =>
    setControls((c) => ({ ...c, [key]: value }));

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
        <legend>Schema controls</legend>
        <label>
          Density{' '}
          <select
            value={controls.density}
            onChange={(e) => set('density', e.target.value as Controls['density'])}
          >
            <option>compact</option>
            <option>normal</option>
            <option>comfortable</option>
          </select>
        </label>
        <label>
          Selection{' '}
          <select
            value={controls.selection}
            onChange={(e) => set('selection', e.target.value as Controls['selection'])}
          >
            <option>none</option>
            <option>single</option>
            <option>multiple</option>
          </select>
        </label>
        <label>
          Status{' '}
          <select
            value={controls.status}
            onChange={(e) => set('status', e.target.value as Controls['status'])}
          >
            <option>idle</option>
            <option>loading</option>
            <option>empty</option>
            <option>error</option>
          </select>
        </label>
        <label>
          <input
            type='checkbox'
            checked={controls.zebra}
            onChange={(e) => set('zebra', e.target.checked)}
          />{' '}
          Zebra
        </label>
        <label>
          <input
            type='checkbox'
            checked={controls.stickyHeader}
            onChange={(e) => set('stickyHeader', e.target.checked)}
          />{' '}
          Sticky header
        </label>
        <label>
          <input
            type='checkbox'
            checked={controls.expandable}
            onChange={(e) => set('expandable', e.target.checked)}
          />{' '}
          Expandable
        </label>
        <label>
          <input
            type='checkbox'
            checked={controls.grouped}
            onChange={(e) => set('grouped', e.target.checked)}
          />{' '}
          Group by status
        </label>
      </fieldset>

      <DataTable<Camera>
        schema={schema}
        data={controls.status === 'empty' ? [] : data}
        status={controls.status === 'empty' ? 'idle' : controls.status}
        clientSorting
        cells={exampleCells}
        maxHeight='420px'
        slots={{
          loading: 'Loading cameras…',
          empty: 'No cameras found.',
          error: 'Could not load cameras.',
        }}
        getRowHints={(row) =>
          row.original.status === 'offline' ? { state: 'pending' } : undefined
        }
        renderDrawer={(row) => (
          <div style={{ display: 'grid', gap: 4 }}>
            <strong>{row.original.name}</strong>
            <span>
              {row.original.location.route} · {row.original.location.office} ·{' '}
              {row.original.counts.clips} clips, {row.original.counts.snapshots} snapshots
            </span>
          </div>
        )}
      />

      <details>
        <summary>Schema (JSON)</summary>
        <pre style={{ fontSize: 12, overflow: 'auto' }}>{JSON.stringify(schema, null, 2)}</pre>
      </details>
    </div>
  );
}
