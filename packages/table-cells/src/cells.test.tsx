import { type CellActionEvent, DataTable, type TableSchema } from '@future-standard-ui/table';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTableCells, evaluateCondition } from './createTableCells';

type Clip = {
  id: string;
  name: string;
  camera: { id: number; name: string };
  status: 'completed' | 'processing' | 'failed';
  start: string | null;
  sizeBytes: number;
  durationSec: number | null;
  thumb: string | null;
  enabled: boolean;
  storage: { used: number; total: number };
  kind: 'video' | 'snapshot';
};

const clips: Clip[] = [
  {
    id: 'c1',
    name: 'Incident 1000 with a very long descriptive name that will not fit',
    camera: { id: 7, name: 'North gate' },
    status: 'completed',
    start: '2026-09-03T09:00:00Z',
    sizeBytes: 61_800_000,
    durationSec: 305,
    thumb: 'https://example.test/t.jpg',
    enabled: true,
    storage: { used: 85, total: 100 },
    kind: 'video',
  },
  {
    id: 'c2',
    name: 'Incident 1001',
    camera: { id: 8, name: 'South' },
    status: 'processing',
    start: null,
    sizeBytes: 0,
    durationSec: null,
    thumb: null,
    enabled: false,
    storage: { used: 10, total: 100 },
    kind: 'snapshot',
  },
];

const schema: TableSchema = {
  rowKey: 'id',
  columns: [
    {
      id: 'thumb',
      header: 'Preview',
      cell: { type: 'thumbnail', options: { altAccessor: 'name' } },
    },
    { id: 'name', header: 'Clip', cell: { type: 'truncate', options: { maxWidth: '160px' } } },
    {
      id: 'camera',
      header: 'Camera',
      accessor: 'camera.name',
      cell: { type: 'link', options: { href: '/cameras/{camera.id}/overview' } },
    },
    { id: 'owner', header: 'Owner', accessor: 'camera.name', cell: { type: 'link' } },
    {
      id: 'status',
      header: 'Status',
      cell: {
        type: 'status',
        options: {
          tones: { completed: 'success', processing: 'info', failed: 'danger' },
          labels: { processing: 'Processing…' },
          variant: 'badge',
        },
      },
    },
    {
      id: 'start',
      header: 'Start',
      cell: {
        type: 'timestamp',
        options: { locale: 'en-GB', timeZone: 'UTC', secondary: 'relative', bold: true },
      },
    },
    {
      id: 'size',
      header: 'Size',
      accessor: 'sizeBytes',
      cell: { type: 'bytes', options: { locale: 'en-US' } },
    },
    { id: 'length', header: 'Length', accessor: 'durationSec', cell: { type: 'duration' } },
    {
      id: 'lines',
      header: 'Camera / Clip',
      cell: {
        type: 'multiline',
        options: {
          lines: [
            { accessor: 'camera.name', emphasis: 'high' },
            { accessor: 'id', prefix: '#' },
          ],
        },
      },
    },
    {
      id: 'storage',
      header: 'Storage',
      accessor: 'storage.used',
      cell: {
        type: 'progress',
        options: {
          maxAccessor: 'storage.total',
          thresholds: [{ from: 80, tone: 'warning' }],
          label: 'Storage used',
        },
      },
    },
    {
      id: 'enabled',
      header: 'Enabled',
      cell: {
        type: 'switch',
        options: { enabledWhen: { accessor: 'status', equals: 'completed' } },
      },
    },
    {
      id: 'kind',
      header: 'Type',
      cell: { type: 'icon', options: { labels: { video: 'Video clip' } } },
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
              enabledWhen: { accessor: 'status', equals: 'completed' },
            },
            {
              id: 'delete',
              label: 'Delete',
              design: 'danger',
              visibleWhen: { accessor: 'status', not: 'processing' },
            },
          ],
        },
      },
    },
  ],
};

const now = () => Date.UTC(2026, 8, 3, 12, 0, 0);
const cells = createTableCells<Clip>({
  now,
  icons: { play: <svg data-testid='play-icon' />, video: <svg data-testid='video-icon' /> },
});

const rows = () => screen.getAllByRole('row').filter((r) => r.dataset.ui === 'table-row');
const cell = (rowIndex: number, column: string) =>
  within(rows()[rowIndex])
    .getAllByRole('cell')
    .find((c) => c.dataset.column === column) as HTMLElement;

describe('standard cells', () => {
  it('renders every kind from schema options', () => {
    const onCellAction = vi.fn<(e: CellActionEvent<Clip>) => void>();
    render(<DataTable schema={schema} data={clips} cells={cells} onCellAction={onCellAction} />);

    // thumbnail + placeholder
    expect(within(cell(0, 'thumb')).getByRole('img')).toHaveAttribute('alt', clips[0].name);
    expect(cell(1, 'thumb').querySelector('img')).toBeNull();

    // truncate keeps the full text as a tooltip
    const truncated = within(cell(0, 'name')).getByTitle(clips[0].name);
    expect(truncated).toHaveAttribute('data-ui', 'cell-truncate');

    // link with template → anchor; without → button that emits
    expect(within(cell(0, 'camera')).getByRole('link')).toHaveAttribute(
      'href',
      '/cameras/7/overview'
    );
    fireEvent.click(within(cell(0, 'owner')).getByRole('button'));
    expect(onCellAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'navigate:owner',
        row: expect.objectContaining({ key: 'c1' }),
      })
    );

    // status tones and labels
    const status = cell(1, 'status').querySelector('[data-ui="cell-status"]');
    expect(status).toHaveAttribute('data-tone', 'info');
    expect(status).toHaveAttribute('data-variant', 'badge');
    expect(status).toHaveTextContent('Processing…');
    expect(cell(0, 'status').querySelector('[data-ui="cell-status"]')).toHaveAttribute(
      'data-tone',
      'success'
    );

    // timestamp: time primary, relative secondary, machine-readable <time>
    const time = within(cell(0, 'start')).getByText('09:00');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', '2026-09-03T09:00:00.000Z');
    expect(cell(0, 'start')).toHaveTextContent('3 hours ago');
    expect(cell(1, 'start')).toHaveTextContent('—');

    // bytes / duration
    expect(cell(0, 'size')).toHaveTextContent('61.8 MB');
    expect(cell(1, 'size')).toHaveTextContent('0 B');
    expect(cell(0, 'length')).toHaveTextContent('05:05');
    expect(cell(1, 'length')).toHaveTextContent('—');

    // multiline
    expect(cell(0, 'lines')).toHaveTextContent('North gate#c1');
    expect(cell(0, 'lines').querySelector('[data-emphasis="high"]')).toHaveTextContent(
      'North gate'
    );

    // progress with thresholds
    const bar = within(cell(0, 'storage')).getByRole('progressbar', { name: 'Storage used' });
    expect(bar).toHaveAttribute('aria-valuenow', '85');
    expect(cell(0, 'storage').querySelector('[data-ui="cell-progress"]')).toHaveAttribute(
      'data-tone',
      'warning'
    );
    expect(cell(1, 'storage').querySelector('[data-ui="cell-progress"]')).not.toHaveAttribute(
      'data-tone'
    );
    expect(cell(0, 'storage')).toHaveTextContent('85%');

    // switch emits with the new state; disabled by condition
    const sw = within(cell(0, 'enabled')).getByRole('switch');
    expect(sw).toBeChecked();
    fireEvent.click(sw);
    expect(onCellAction).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'switch', detail: false })
    );
    expect(within(cell(1, 'enabled')).getByRole('switch')).toBeDisabled();

    // icon by name with label
    expect(within(cell(0, 'kind')).getByTestId('video-icon')).toBeInTheDocument();
    expect(cell(0, 'kind').querySelector('[data-ui="cell-icon"]')).toHaveAttribute(
      'title',
      'Video clip'
    );

    // actions: icon-only accessible name, conditions, emit
    const play = within(cell(0, 'actions')).getByRole('button', { name: 'Play' });
    expect(within(play).getByTestId('play-icon')).toBeInTheDocument();
    fireEvent.click(within(cell(0, 'actions')).getByRole('button', { name: 'Delete' }));
    expect(onCellAction).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'delete' }));
    expect(within(cell(1, 'actions')).getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(within(cell(1, 'actions')).queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('falls back to text for unknown cell types and exposes text/composite', () => {
    expect(Object.keys(cells)).toEqual(
      expect.arrayContaining(['text', 'composite', 'number', 'status', 'actions', 'switch'])
    );
  });
});

describe('evaluateCondition', () => {
  const row = { a: 1, b: 'x', c: null };
  it('supports equals, not, in, truthy and defaults to truthiness', () => {
    expect(evaluateCondition(undefined, row)).toBe(true);
    expect(evaluateCondition({ accessor: 'a', equals: 1 }, row)).toBe(true);
    expect(evaluateCondition({ accessor: 'b', not: 'x' }, row)).toBe(false);
    expect(evaluateCondition({ accessor: 'b', in: ['x', 'y'] }, row)).toBe(true);
    expect(evaluateCondition({ accessor: 'c', truthy: false }, row)).toBe(true);
    expect(evaluateCondition({ accessor: 'c' }, row)).toBe(false);
  });
});
