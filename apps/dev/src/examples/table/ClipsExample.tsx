import { Button } from '@future-standard-ui/button';
import {
  DataTable,
  type RowSelectionState,
  type SortingState,
  type TableSchema,
  type TableStatus,
} from '@future-standard-ui/table';
import { useEffect, useMemo, useState } from 'react';
import { exampleCells } from './cells';
import { type Clip, fetchClips } from './data';

const schema: TableSchema = {
  id: 'clips',
  rowKey: 'id',
  columns: [
    {
      id: 'thumbnail',
      header: '',
      accessor: 'thumbnailUrl',
      cell: { type: 'thumbnail' },
      width: '80px',
    },
    { id: 'displayName', header: 'Clip name', sortable: true, emphasis: 'high', minWidth: '160px' },
    {
      id: 'camera',
      header: 'Camera',
      accessor: 'camera.displayName',
      sortable: true,
      minWidth: '140px',
    },
    { id: 'fileStatus', header: 'Status', cell: { type: 'status' }, width: '130px' },
    {
      id: 'startTime',
      header: 'Clip start',
      cell: { type: 'timestamp', options: { boldTime: true } },
      sortable: true,
      width: '130px',
    },
    {
      id: 'createdTime',
      header: 'Created',
      cell: { type: 'timestamp' },
      sortable: true,
      width: '130px',
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
      header: 'Actions',
      cell: { type: 'clipActions' },
      align: 'end',
      width: '120px',
      pin: 'end',
    },
  ],
  features: { selection: 'multiple', stickyHeader: true },
};

/**
 * The mlit-cctv pattern: sorting and selection are owned by the screen, the server sorts, and
 * the table only reports. Selecting rows swaps the toolbar for an actions bar.
 */
export function ClipsExample() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'startTime', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [data, setData] = useState<Clip[]>([]);
  const [status, setStatus] = useState<TableStatus>('loading');

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

  const cells = useMemo(
    () => ({
      ...exampleCells,
      clipActions: ({ row }: { row: { original: unknown } }) => {
        const clip = row.original as Clip;
        return (
          <span style={{ display: 'inline-flex', gap: 4 }}>
            <Button size='xsmall' design='text-only' disabled={clip.fileStatus !== 'completed'}>
              Play
            </Button>
            <Button size='xsmall' design='text-only' disabled={clip.fileStatus !== 'completed'}>
              Download
            </Button>
          </span>
        );
      },
    }),
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
