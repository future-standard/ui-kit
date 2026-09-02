import type { TableSchema } from '@future-standard-ui/table-core';

export type User = {
  id: string;
  name: string;
  role: 'admin' | 'viewer';
  meta: { logins: number; lastLogin: string | null };
  active: boolean;
};

export const users: User[] = [
  {
    id: 'u1',
    name: 'Ada',
    role: 'admin',
    meta: { logins: 12, lastLogin: '2026-09-01' },
    active: true,
  },
  { id: 'u2', name: 'Grace', role: 'viewer', meta: { logins: 3, lastLogin: null }, active: false },
  {
    id: 'u3',
    name: 'Linus',
    role: 'viewer',
    meta: { logins: 7, lastLogin: '2026-08-20' },
    active: true,
  },
];

export const userSchema: TableSchema = {
  id: 'users',
  rowKey: 'id',
  columns: [
    { id: 'name', header: 'Name', sortable: true, emphasis: 'high', width: '200px' },
    { id: 'role', header: 'Role', group: 'Account' },
    {
      id: 'logins',
      header: 'Logins',
      accessor: 'meta.logins',
      align: 'end',
      sortable: true,
      group: 'Account',
    },
    {
      id: 'lastLogin',
      header: 'Last login',
      accessor: 'meta.lastLogin',
      cell: { type: 'date', options: { style: 'short' } },
      visibleFrom: 'md',
    },
  ],
};
