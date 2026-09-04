import type { TableSchema } from '@future-standard-ui/table-core';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable } from './DataTable';

type Device = {
  id: number;
  name: string;
  site: string;
  traffic: { ingress: number; egress: number; total: number };
};

const devices: Device[] = [
  { id: 1, name: 'Gateway A', site: 'Tokyo', traffic: { ingress: 120, egress: 80, total: 200 } },
  { id: 2, name: 'Gateway B', site: 'Osaka', traffic: { ingress: 40, egress: 15, total: 55 } },
];

const schema: TableSchema = {
  rowKey: 'id',
  columns: [
    { id: 'id', header: 'ID', pin: 'start', width: '60px' },
    { id: 'name', header: 'Device', pin: 'start', width: '160px' },
    { id: 'site', header: 'Site' },
    { id: 'ingress', header: 'Ingress', accessor: 'traffic.ingress', visibleFrom: 'lg' },
    { id: 'egress', header: 'Egress', accessor: 'traffic.egress', visibleFrom: 'lg' },
    {
      id: 'traffic',
      header: 'Traffic',
      accessor: 'traffic.total',
      visibleUntil: 'lg',
      cell: {
        type: 'composite',
        options: {
          separator: '/',
          parts: [
            { accessor: 'traffic.ingress', label: 'in', unit: 'Mb' },
            { accessor: 'traffic.egress', label: 'out', unit: 'Mb' },
          ],
        },
      },
    },
    { id: 'actions', header: '', pin: 'end', width: '80px' },
  ],
  features: { selection: 'multiple', stickyHeader: true },
};

const rows = () => screen.getAllByRole('row').filter((r) => r.dataset.ui === 'table-row');
const header = (id: string) =>
  screen.getAllByRole('columnheader').find((h) => h.dataset.column === id) as HTMLElement;

describe('pinned columns', () => {
  it('writes schema-derived offsets and marks the edge columns', () => {
    render(<DataTable schema={schema} data={devices} />);
    expect(header('id').style.getPropertyValue('--_pin-offset')).toBe(
      'calc(var(--_utility-width) * 1)'
    );
    expect(header('name').style.getPropertyValue('--_pin-offset')).toBe(
      'calc(var(--_utility-width) * 1 + 60px)'
    );
    expect(header('name')).toHaveAttribute('data-pin-edge', 'true');
    expect(header('id')).not.toHaveAttribute('data-pin-edge');
    expect(header('actions')).toHaveAttribute('data-pin', 'end');
    expect(header('actions')).toHaveAttribute('data-pin-edge', 'true');
    expect(header('actions').style.getPropertyValue('--_pin-offset')).toBe('0px');

    const cells = within(rows()[0]).getAllByRole('cell');
    const nameCell = cells.find((c) => c.dataset.column === 'name') as HTMLElement;
    expect(nameCell.style.getPropertyValue('--_pin-offset')).toBe(
      'calc(var(--_utility-width) * 1 + 60px)'
    );
    expect(nameCell).toHaveAttribute('data-pin-edge', 'true');
  });

  it('locks a pinned column to its declared width and floors other declared widths', () => {
    const withWidth = {
      ...schema,
      columns: schema.columns.map((c) => (c.id === 'site' ? { ...c, width: '140px' } : c)),
    };
    render(<DataTable schema={withWidth} data={devices} />);
    expect(header('name')).toHaveStyle({ width: '160px', minWidth: '160px', maxWidth: '160px' });
    expect(header('site')).toHaveStyle({ width: '140px', minWidth: '140px' });
    expect(header('site').style.maxWidth).toBe('');
    expect(header('ingress').style.minWidth).toBe('');
  });

  it('gives utility cells their own sticky offset', () => {
    render(<DataTable schema={schema} data={devices} />);
    const selectHeader = screen.getByLabelText('Select all rows').closest('th') as HTMLElement;
    expect(selectHeader).toHaveAttribute('data-utility', 'select');
    expect(selectHeader.style.getPropertyValue('--_pin-offset')).toBe('0px');
  });
});

describe('layout', () => {
  it('wraps the table in a scroll container by default', () => {
    render(<DataTable schema={schema} data={devices} />);
    const root = screen.getByRole('table').closest('[data-ui="table"]') as HTMLElement;
    expect(root).toHaveAttribute('data-layout', 'contained');
    expect(root.querySelector('[data-ui="table-scroll"]')).not.toBeNull();
  });

  it('renders no scroll container, no pin edges, and a sticky offset in page layout', () => {
    render(<DataTable schema={schema} data={devices} layout='page' stickyTop='56px' />);
    const root = screen.getByRole('table').closest('[data-ui="table"]') as HTMLElement;
    expect(root).toHaveAttribute('data-layout', 'page');
    expect(root.querySelector('[data-ui="table-scroll"]')).toBeNull();
    expect(root.style.getPropertyValue('--_sticky-top')).toBe('56px');
    expect(header('name')).toHaveAttribute('data-pin', 'start');
    expect(header('name')).not.toHaveAttribute('data-pin-edge');
    expect(header('name').style.getPropertyValue('--_pin-offset')).toBe('');
  });
});

describe('composite cell', () => {
  it('renders several accessor paths with labels, units and separator', () => {
    render(<DataTable schema={schema} data={devices} />);
    const cells = within(rows()[0]).getAllByRole('cell');
    const traffic = cells.find((c) => c.dataset.column === 'traffic') as HTMLElement;
    expect(traffic).toHaveAttribute('data-cell-type', 'composite');
    expect(traffic).toHaveAttribute('data-visible-until', 'lg');
    expect(traffic.textContent).toBe('in120Mb/out80Mb');
    expect(within(traffic).getByText('/')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows a dash for missing values', () => {
    const sparse = [{ ...devices[0], traffic: { ingress: 1, egress: undefined, total: 1 } }];
    render(<DataTable schema={schema} data={sparse as unknown as Device[]} />);
    const traffic = within(rows()[0])
      .getAllByRole('cell')
      .find((c) => c.dataset.column === 'traffic') as HTMLElement;
    expect(traffic.textContent).toContain('—');
  });
});

describe('stacked layout', () => {
  it('emits the breakpoint on the root and labels on every cell', () => {
    const stacked = {
      ...schema,
      features: { ...schema.features, stacked: { below: 'md' as const } },
    };
    render(<DataTable schema={stacked} data={devices} />);
    const root = screen.getByRole('table').closest('[data-ui="table"]') as HTMLElement;
    expect(root).toHaveAttribute('data-stacked-below', 'md');
    const cells = within(rows()[0]).getAllByRole('cell');
    expect(cells.find((c) => c.dataset.column === 'site')).toHaveAttribute('data-label', 'Site');
    expect(cells.find((c) => c.dataset.column === 'actions')).toHaveAttribute('data-label', '');
    expect(screen.getByRole('table')).toHaveAttribute('role', 'table');
    expect(rows()[0]).toHaveAttribute('role', 'row');
  });
});
