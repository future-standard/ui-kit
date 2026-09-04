import type { SortingState } from '@future-standard-ui/table-core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CellRenderers } from './context';
import { DataTable } from './DataTable';
import { type User, userSchema, users } from './table.fixtures';

const rows = () => screen.getAllByRole('row').filter((r) => r.dataset.ui === 'table-row');
const headerCells = () => screen.getAllByRole('columnheader');

describe('DataTable', () => {
  it('renders a semantic table with headers and cells from the schema', () => {
    render(<DataTable schema={userSchema} data={users} />);

    expect(screen.getByRole('table')).toHaveAttribute('data-ui', 'table-element');
    const root = screen.getByRole('table').closest('[data-ui="table"]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-table-id', 'users');
    expect(root).toHaveAttribute('data-status', 'idle');

    const headers = headerCells().filter((h) => h.dataset.ui === 'table-header-cell');
    expect(headers.map((h) => h.textContent)).toEqual(['Name', 'Role', 'Logins', 'Last login']);
    expect(headers[0]).toHaveStyle({ width: '200px' });
    expect(headers[2]).toHaveAttribute('data-align', 'end');
    expect(headers[3]).toHaveAttribute('data-visible-from', 'md');

    expect(rows()).toHaveLength(3);
    const firstCells = within(rows()[0]).getAllByRole('cell');
    expect(firstCells.map((c) => c.textContent)).toEqual(['Ada', 'admin', '12', '2026-09-01']);
    expect(firstCells[0]).toHaveAttribute('data-emphasis', 'high');
    expect(firstCells[3]).toHaveAttribute('data-cell-type', 'date');
    expect(rows()[0]).toHaveAttribute('data-key', 'u1');
  });

  it('renders a merged group header row when columns declare groups', () => {
    render(<DataTable schema={userSchema} data={users} />);
    const groupCells = headerCells().filter((h) => h.dataset.ui === 'table-group-header-cell');
    expect(groupCells).toHaveLength(3);
    expect(groupCells[1]).toHaveTextContent('Account');
    expect(groupCells[1]).toHaveAttribute('colspan', '2');
    // a group over a breakpoint-hidden column hides with it, so the header keeps its shape
    expect(groupCells[2]).toHaveAttribute('data-visible-from', 'md');
    expect(groupCells[1]).not.toHaveAttribute('data-visible-from');
  });

  it('uses registered cell renderers by type, with text as fallback', () => {
    const cells: CellRenderers<User> = {
      date: ({ value, options }) => (value ? `${options.style}:${String(value)}` : '—'),
    };
    render(<DataTable schema={userSchema} data={users} cells={cells} />);
    const lastLogin = (i: number) => within(rows()[i]).getAllByRole('cell')[3];
    expect(lastLogin(0)).toHaveTextContent('short:2026-09-01');
    expect(lastLogin(1)).toHaveTextContent('—');
  });

  describe('sorting', () => {
    it('toggles uncontrolled sorting from the header button and reflects aria-sort', () => {
      render(<DataTable schema={userSchema} data={users} clientSorting />);
      const nameHeader = headerCells().find((h) => h.dataset.column === 'name');
      if (!nameHeader) throw new Error('missing header');
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');

      fireEvent.click(within(nameHeader).getByRole('button'));
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      expect(nameHeader).toHaveAttribute('data-sort', 'asc');
      expect(rows().map((r) => r.dataset.key)).toEqual(['u1', 'u2', 'u3']);

      fireEvent.click(within(nameHeader).getByRole('button'));
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
      expect(rows().map((r) => r.dataset.key)).toEqual(['u3', 'u2', 'u1']);
    });

    it('renders no sort control for unsortable columns', () => {
      render(<DataTable schema={userSchema} data={users} />);
      const roleHeader = headerCells().find((h) => h.dataset.column === 'role');
      expect(roleHeader).not.toHaveAttribute('aria-sort');
      expect(within(roleHeader as HTMLElement).queryByRole('button')).toBeNull();
    });

    it('supports controlled sorting without reordering data itself', () => {
      const onSortingChange = vi.fn();
      function Controlled() {
        const [sorting, setSorting] = useState<SortingState>([]);
        return (
          <DataTable
            schema={userSchema}
            data={users}
            state={{ sorting }}
            onSortingChange={(next) => {
              onSortingChange(next);
              setSorting(next);
            }}
          />
        );
      }
      render(<Controlled />);
      const nameHeader = headerCells().find((h) => h.dataset.column === 'name') as HTMLElement;
      fireEvent.click(within(nameHeader).getByRole('button'));
      expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      // data order untouched: consumer is expected to sort (server-side or otherwise)
      expect(rows().map((r) => r.dataset.key)).toEqual(['u1', 'u2', 'u3']);
    });
  });

  describe('selection', () => {
    const selectable = { ...userSchema, features: { selection: 'multiple' as const } };

    it('renders checkboxes, select-all with indeterminate, and reports changes', () => {
      const onRowSelectionChange = vi.fn();
      render(
        <DataTable schema={selectable} data={users} onRowSelectionChange={onRowSelectionChange} />
      );
      const selectAll = screen.getByLabelText('Select all rows') as HTMLInputElement;
      const rowBoxes = screen.getAllByLabelText(/^Select row/) as HTMLInputElement[];
      expect(rowBoxes).toHaveLength(3);
      expect(selectAll.checked).toBe(false);
      expect(selectAll.indeterminate).toBe(false);

      fireEvent.click(rowBoxes[1]);
      expect(onRowSelectionChange).toHaveBeenLastCalledWith({ u2: true });
      expect(rows()[1]).toHaveAttribute('data-selected', 'true');
      expect(rows()[1]).toHaveAttribute('aria-selected', 'true');
      expect(selectAll.indeterminate).toBe(true);

      fireEvent.click(selectAll);
      expect(onRowSelectionChange).toHaveBeenLastCalledWith({ u1: true, u2: true, u3: true });
      expect(selectAll.checked).toBe(true);
      expect(selectAll.indeterminate).toBe(false);

      fireEvent.click(selectAll);
      expect(onRowSelectionChange).toHaveBeenLastCalledWith({});
    });

    it('renders radios and no select-all in single mode', () => {
      render(
        <DataTable schema={{ ...userSchema, features: { selection: 'single' } }} data={users} />
      );
      expect(screen.queryByLabelText('Select all rows')).toBeNull();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('emits data-selection on the root', () => {
      render(<DataTable schema={selectable} data={users} />);
      expect(screen.getByRole('table').closest('[data-ui="table"]')).toHaveAttribute(
        'data-selection',
        'multiple'
      );
    });
  });

  describe('status and slots', () => {
    it('shows the empty slot when there is no data', () => {
      render(<DataTable schema={userSchema} data={[]} slots={{ empty: 'Nothing here' }} />);
      const root = screen.getByRole('table').closest('[data-ui="table"]');
      expect(root).toHaveAttribute('data-status', 'empty');
      const status = screen.getByText('Nothing here').closest('[data-ui="table-status"]');
      expect(status).toHaveAttribute('data-status', 'empty');
      expect(rows()).toHaveLength(0);
    });

    it('shows loading as a row when empty and as an overlay when rows exist', () => {
      const { rerender } = render(
        <DataTable schema={userSchema} data={[]} status='loading' slots={{ loading: 'Loading…' }} />
      );
      expect(screen.getByText('Loading…').closest('tr')).not.toBeNull();

      rerender(
        <DataTable
          schema={userSchema}
          data={users}
          status='loading'
          slots={{ loading: 'Loading…' }}
        />
      );
      expect(rows()).toHaveLength(3);
      const overlay = screen.getByText('Loading…');
      expect(overlay.closest('tr')).toBeNull();
      expect(overlay).toHaveAttribute('data-ui', 'table-status');
      expect(screen.getByRole('rowgroup', { busy: true })).toHaveAttribute('data-ui', 'table-body');
    });

    it('shows the error slot instead of rows', () => {
      render(
        <DataTable schema={userSchema} data={users} status='error' slots={{ error: 'Failed' }} />
      );
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(rows()).toHaveLength(0);
    });
  });

  describe('rows', () => {
    it('applies row hints as data attributes', () => {
      render(
        <DataTable
          schema={userSchema}
          data={users}
          getRowHints={(row) =>
            row.original.active ? undefined : { tone: 'warning', state: 'disabled' }
          }
        />
      );
      expect(rows()[1]).toHaveAttribute('data-tone', 'warning');
      expect(rows()[1]).toHaveAttribute('data-state', 'disabled');
      expect(rows()[0]).not.toHaveAttribute('data-tone');
    });

    it('opens a drawer for expanded rows', () => {
      render(
        <DataTable
          schema={{ ...userSchema, features: { expandable: true } }}
          data={users}
          renderDrawer={(row) => <div>Details for {row.original.name}</div>}
        />
      );
      const toggles = screen.getAllByLabelText('Expand row');
      expect(toggles).toHaveLength(3);
      fireEvent.click(toggles[0]);
      const drawer = screen.getByText('Details for Ada').closest('tr');
      expect(drawer).toHaveAttribute('data-ui', 'table-drawer');
      expect(rows()[0]).toHaveAttribute('data-expanded', 'true');
      expect(screen.getByLabelText('Collapse row')).toHaveAttribute('aria-expanded', 'true');
      // drawer spans every column including the expand utility column
      expect(within(drawer as HTMLElement).getByRole('cell')).toHaveAttribute('colspan', '5');
    });

    it('renders group rows and collapses them', () => {
      const grouped = {
        ...userSchema,
        features: { grouping: { by: 'role', collapsible: true } },
      };
      const sorted = [...users].sort((a, b) => a.role.localeCompare(b.role));
      render(<DataTable schema={grouped} data={sorted} />);
      const groupRows = screen
        .getAllByRole('row')
        .filter((r) => r.dataset.ui === 'table-group-row');
      expect(groupRows.map((r) => r.dataset.group)).toEqual(['admin', 'viewer']);
      expect(rows()).toHaveLength(3);

      fireEvent.click(within(groupRows[1]).getByRole('button'));
      expect(rows()).toHaveLength(1);
      expect(groupRows[1]).toHaveAttribute('data-collapsed', 'true');
    });

    it('hides columns from controlled columnVisibility', () => {
      render(
        <DataTable schema={userSchema} data={users} state={{ columnVisibility: { role: false } }} />
      );
      const headers = headerCells().filter((h) => h.dataset.ui === 'table-header-cell');
      expect(headers.map((h) => h.dataset.column)).toEqual(['name', 'logins', 'lastLogin']);
      expect(within(rows()[0]).getAllByRole('cell')).toHaveLength(3);
    });
  });

  it('forwards root props and className', () => {
    render(<DataTable schema={userSchema} data={users} className='custom' id='my-table' />);
    const root = document.getElementById('my-table');
    expect(root).toHaveAttribute('data-ui', 'table');
    expect(root?.className).toContain('custom');
  });
});
