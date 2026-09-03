import { type CellActionEvent, DataTable, type TableSchema } from '@future-standard-ui/table';
import { createTableCells } from '@future-standard-ui/table-cells';
import { useMemo, useState } from 'react';
import { type Camera, cameras } from './data';
import { icons } from './icons';

type Controls = {
  density: 'compact' | 'normal' | 'comfortable';
  zebra: boolean;
  stickyHeader: boolean;
  selection: 'none' | 'single' | 'multiple';
  expandable: boolean;
  grouped: boolean;
  status: 'idle' | 'loading' | 'empty' | 'error';
};

const cells = createTableCells<Camera>({ icons });

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
  const [ptz, setPtz] = useState<Record<number, boolean>>({});
  const [lastAction, setLastAction] = useState<string | null>(null);

  const schema = useMemo<TableSchema>(
    () => ({
      id: 'cameras',
      rowKey: 'id',
      columns: [
        {
          id: 'kind',
          header: '',
          cell: {
            type: 'icon',
            options: {
              icons: { fixed: 'camera', ptz: 'ptz' },
              labels: { fixed: 'Fixed camera', ptz: 'PTZ camera' },
            },
          },
          width: '44px',
          pin: 'start',
        },
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
          cell: {
            type: 'status',
            options: { tones: { online: 'success', degraded: 'warning', offline: 'danger' } },
          },
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
          id: 'storage',
          header: 'Storage',
          accessor: 'storage.usedGb',
          cell: {
            type: 'progress',
            options: {
              maxAccessor: 'storage.totalGb',
              thresholds: [
                { from: 75, tone: 'warning' },
                { from: 90, tone: 'danger' },
              ],
              label: 'Storage used',
            },
          },
          sortable: true,
          width: '150px',
          visibleFrom: 'md',
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
          id: 'ptz',
          header: 'PTZ',
          cell: { type: 'switch', options: { label: 'PTZ enabled' } },
          align: 'center',
          width: '80px',
        },
        {
          id: 'lastSeen',
          header: 'Last seen',
          cell: { type: 'timestamp', options: { secondary: 'relative' } },
          sortable: true,
          visibleFrom: 'xl',
          width: '150px',
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

  // The switch cell is controlled by the screen: apply the emitted state to the data.
  const data = useMemo(() => {
    const withPtz = cameras.map((c) => (ptz[c.id] === undefined ? c : { ...c, ptz: ptz[c.id] }));
    return controls.grouped
      ? [...withPtz].sort((a, b) => a.status.localeCompare(b.status))
      : withPtz;
  }, [controls.grouped, ptz]);

  const onCellAction = ({ action, row, detail }: CellActionEvent<Camera>) => {
    if (action === 'switch') setPtz((prev) => ({ ...prev, [row.original.id]: Boolean(detail) }));
    setLastAction(
      `${action} → ${row.original.name}${detail !== undefined ? ` (${String(detail)})` : ''}`
    );
  };

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
        cells={cells}
        onCellAction={onCellAction}
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

      {lastAction && (
        <p style={{ margin: 0, opacity: 0.7 }}>
          Last cell action: <code>{lastAction}</code>
        </p>
      )}

      <details>
        <summary>Schema (JSON)</summary>
        <pre style={{ fontSize: 12, overflow: 'auto' }}>{JSON.stringify(schema, null, 2)}</pre>
      </details>
    </div>
  );
}
