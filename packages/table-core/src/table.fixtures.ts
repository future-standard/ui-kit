import type { TableSchema } from './schema';

/** Shaped like a camera row in mlit-cctv, so tests exercise realistic nesting. */
export type Camera = {
  id: number;
  name: string;
  location: { route: string; kmPost: number | null };
  status: 'online' | 'offline' | 'degraded';
  clipCount: number;
  lastSeen: string | null;
};

export const cameras: Camera[] = [
  {
    id: 3,
    name: 'Camera 10',
    location: { route: 'R2', kmPost: 12.5 },
    status: 'online',
    clipCount: 4,
    lastSeen: '2026-09-01T10:00:00Z',
  },
  {
    id: 1,
    name: 'Camera 2',
    location: { route: 'R1', kmPost: 3 },
    status: 'offline',
    clipCount: 0,
    lastSeen: null,
  },
  {
    id: 2,
    name: 'Camera 1',
    location: { route: 'R1', kmPost: null },
    status: 'online',
    clipCount: 12,
    lastSeen: '2026-09-02T08:30:00Z',
  },
];

export const cameraSchema: TableSchema = {
  id: 'cameras',
  rowKey: 'id',
  columns: [
    { id: 'name', header: 'Camera', sortable: true, emphasis: 'high', pin: 'start' },
    { id: 'route', header: 'Route', accessor: 'location.route', group: 'Location' },
    {
      id: 'kmPost',
      header: 'KM Post',
      accessor: 'location.kmPost',
      cell: { type: 'number', options: { unit: 'km' } },
      align: 'end',
      sortable: true,
      group: 'Location',
    },
    { id: 'status', header: 'Status', cell: { type: 'status' }, visibleFrom: 'md' },
    { id: 'clipCount', header: 'Clips', align: 'end', sortable: true },
    { id: 'lastSeen', header: 'Last seen', cell: { type: 'timestamp' }, visibleFrom: 'lg' },
  ],
  features: { selection: 'multiple', expandable: true, zebra: true },
};
