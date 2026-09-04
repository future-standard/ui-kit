import { Button } from '@future-standard-ui/button';
import {
  type CellActionEvent,
  DataTable,
  type RowSelectionState,
  type SortingState,
  type TableSchema,
  type TableStatus,
} from '@future-standard-ui/table';
import { createTableCells } from '@future-standard-ui/table-cells';
import { useEffect, useMemo, useState } from 'react';
import { type Clip, fetchClips } from './data';
import { icons } from './icons';

/**
 * Every column uses a standard cell type from @future-standard-ui/table-cells, configured in JSON.
 * Row actions reach the screen through one `onCellAction` handler instead of per-row closures.
 */
const schema: TableSchema = {
  id: 'clips',
  rowKey: 'id',
  columns: [
    {
      id: 'thumbnail',
      header: '',
      accessor: 'thumbnailUrl',
      cell: { type: 'thumbnail', options: { altAccessor: 'displayName' } },
      width: '80px',
    },
    {
      id: 'displayName',
      header: 'Clip name',
      cell: { type: 'truncate', options: { maxWidth: '220px' } },
      sortable: true,
      emphasis: 'high',
      minWidth: '160px',
    },
    {
      id: 'camera',
      header: 'Camera',
      accessor: 'camera.displayName',
      cell: { type: 'link', options: { href: '/cameras/{camera.id}/overview' } },
      sortable: true,
      minWidth: '140px',
    },
    {
      id: 'fileStatus',
      header: 'Status',
      cell: {
        type: 'status',
        options: {
          variant: 'badge',
          tones: { completed: 'success', processing: 'info', failed: 'danger' },
          labels: { completed: 'Ready', processing: 'Processing', failed: 'Failed' },
        },
      },
      width: '130px',
    },
    {
      id: 'startTime',
      header: 'Clip start',
      cell: { type: 'timestamp', options: { bold: true } },
      sortable: true,
      width: '130px',
    },
    {
      id: 'createdTime',
      header: 'Created',
      cell: { type: 'timestamp', options: { secondary: 'relative' } },
      sortable: true,
      width: '140px',
      visibleFrom: 'xl',
    },
    {
      id: 'duration',
      header: 'Length',
      accessor: 'durationSec',
      cell: { type: 'duration' },
      align: 'end',
      sortable: true,
      width: '90px',
    },
    {
      id: 'size',
      header: 'Size',
      accessor: 'sizeBytes',
      cell: { type: 'bytes' },
      align: 'end',
      sortable: true,
      width: '100px',
      visibleFrom: 'md',
    },
    {
      id: 'actions',
      header: '',
      cell: {
        type: 'actions',
        options: {
          actions: [
            {
              id: 'play',
              label: 'Play',
              icon: 'play',
              iconOnly: true,
              enabledWhen: { accessor: 'fileStatus', equals: 'completed' },
            },
            {
              id: 'download',
              label: 'Download',
              icon: 'download',
              iconOnly: true,
              enabledWhen: { accessor: 'fileStatus', equals: 'completed' },
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: 'delete',
              iconOnly: true,
              design: 'danger',
              visibleWhen: { accessor: 'fileStatus', not: 'processing' },
            },
          ],
        },
      },
      align: 'end',
      width: '110px',
      pin: 'end',
    },
  ],
  features: { selection: 'multiple', stickyHeader: true },
};

const cells = createTableCells<Clip>({ locale: 'ja-JP', timeZone: 'Asia/Tokyo', icons });

/**
 * The mlit-cctv pattern: sorting and selection are owned by the screen, the server sorts, and
 * the table only reports. Selecting rows swaps the toolbar for an actions bar.
 */
export function ClipsExample() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'startTime', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [data, setData] = useState<Clip[]>([]);
  const [status, setStatus] = useState<TableStatus>('loading');
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetchClips({ sort: sorting[0], signal: controller.signal })
      .then((rows) => {
        setData(rows);
        setStatus('idle');
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') setStatus('error');
      });
    return () => controller.abort();
  }, [sorting]);

  const selectedCount = Object.keys(rowSelection).length;

  const onCellAction = useMemo(
    () => (event: CellActionEvent<Clip>) =>
      setLastAction(`${event.action} → ${event.row.original.displayName}`),
    []
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 32 }}>
        {selectedCount > 0 ? (
          <>
            <strong>{selectedCount} selected</strong>
            <Button size='small' design='danger'>
              Delete
            </Button>
            <Button size='small' design='text-only' onClick={() => setRowSelection({})}>
              Clear
            </Button>
          </>
        ) : (
          <span style={{ opacity: 0.7 }}>
            Sorted by <code>{sorting[0]?.id}</code> {sorting[0]?.desc ? 'desc' : 'asc'} ·
            server-side, 600 ms latency
            {lastAction && (
              <>
                {' '}
                · last action: <code>{lastAction}</code>
              </>
            )}
          </span>
        )}
      </div>

      <DataTable<Clip>
        schema={schema}
        data={data}
        status={status}
        state={{ sorting, rowSelection }}
        onSortingChange={setSorting}
        onRowSelectionChange={setRowSelection}
        onCellAction={onCellAction}
        cells={cells}
        slots={{
          loading: 'Loading clips…',
          empty: 'No clips found.',
          error: 'Could not load clips.',
        }}
        getRowHints={(row) =>
          row.original.fileStatus === 'processing'
            ? { state: 'pending' }
            : row.original.fileStatus === 'failed'
              ? { tone: 'danger' }
              : undefined
        }
      />
    </div>
  );
}
