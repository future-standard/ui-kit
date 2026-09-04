import type { TableInstance } from '@future-standard-ui/table-core';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type User, userSchema, users } from './table.fixtures';
import { useTable } from './useTable';

describe('useTable', () => {
  it('keeps one instance across renders and re-renders on internal state changes', () => {
    const instances: TableInstance<User>[] = [];
    let renders = 0;

    function Probe({ data }: { data: User[] }) {
      renders += 1;
      const table = useTable<User>({ schema: userSchema, data });
      instances.push(table);
      return <span>{table.getRowModel().rows.length}</span>;
    }

    const { rerender, container } = render(<Probe data={users} />);
    expect(container.textContent).toBe('3');
    rerender(<Probe data={users.slice(0, 2)} />);
    expect(container.textContent).toBe('2');
    expect(new Set(instances).size).toBe(1);

    const before = renders;
    act(() => instances[0].toggleSort('name'));
    expect(renders).toBeGreaterThan(before);
    expect(instances[0].getState().sorting).toEqual([{ id: 'name', desc: false }]);
  });
});
