/**
 * Mock data shaped like mlit-cctv's real rows so the examples exercise realistic nesting,
 * nulls, and mixed value types.
 */

export type Camera = {
  id: number;
  name: string;
  location: { route: string; kmPost: number | null; office: string };
  status: 'online' | 'offline' | 'degraded';
  kind: 'fixed' | 'ptz';
  ptz: boolean;
  counts: { clips: number; snapshots: number };
  storage: { usedGb: number; totalGb: number };
  lastSeen: string | null;
};

export type Clip = {
  id: string;
  displayName: string;
  camera: { id: number; displayName: string };
  startTime: string;
  createdTime: string;
  durationSec: number | null;
  sizeBytes: number;
  fileStatus: 'completed' | 'processing' | 'failed';
  thumbnailUrl: string | null;
};

const routes = ['R1', 'R2', 'R4', 'R16'];
const offices = ['Kanto', 'Kansai', 'Tohoku'];
const statuses: Camera['status'][] = ['online', 'online', 'online', 'degraded', 'offline'];

export const cameras: Camera[] = Array.from({ length: 28 }, (_, i) => {
  const n = i + 1;
  return {
    id: n,
    name: `Camera ${n}`,
    location: {
      route: routes[i % routes.length],
      kmPost: i % 7 === 3 ? null : Math.round((3 + i * 4.37) * 10) / 10,
      office: offices[i % offices.length],
    },
    status: statuses[i % statuses.length],
    kind: i % 3 === 0 ? 'ptz' : 'fixed',
    ptz: i % 3 === 0,
    storage: { usedGb: (i * 37) % 100, totalGb: 100 },
    counts: { clips: (i * 7) % 23, snapshots: (i * 5) % 31 },
    lastSeen:
      i % 5 === 4
        ? null
        : new Date(Date.UTC(2026, 8, 1, 8 + (i % 12), (i * 13) % 60)).toISOString(),
  };
});

export const clips: Clip[] = Array.from({ length: 40 }, (_, i) => {
  const cam = cameras[i % cameras.length];
  const start = Date.UTC(2026, 8, 2, 0, 0) - i * 47 * 60_000;
  const status: Clip['fileStatus'] =
    i % 9 === 4 ? 'processing' : i % 13 === 7 ? 'failed' : 'completed';
  return {
    id: `clip-${1000 + i}`,
    displayName: `Incident ${String(1000 + i)}`,
    camera: { id: cam.id, displayName: cam.name },
    startTime: new Date(start).toISOString(),
    createdTime: new Date(start + 5 * 60_000).toISOString(),
    durationSec: status === 'completed' ? 30 + ((i * 17) % 300) : null,
    sizeBytes: status === 'completed' ? 4_000_000 + ((i * 3_100_000) % 60_000_000) : 0,
    fileStatus: status,
    thumbnailUrl: status === 'completed' ? `https://picsum.photos/seed/${i}/96/54` : null,
  };
});

/** Simulates a server that sorts and pages. */
export function fetchClips(params: {
  sort?: { id: string; desc: boolean };
  signal?: AbortSignal;
}): Promise<Clip[]> {
  const accessors: Record<string, (c: Clip) => unknown> = {
    displayName: (c) => c.displayName,
    camera: (c) => c.camera.displayName,
    startTime: (c) => c.startTime,
    createdTime: (c) => c.createdTime,
    duration: (c) => c.durationSec,
    size: (c) => c.sizeBytes,
  };
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      let result = [...clips];
      if (params.sort) {
        const read = accessors[params.sort.id];
        if (read) {
          result.sort((a, b) => {
            const av = read(a);
            const bv = read(b);
            if (av === bv) return 0;
            if (av === null || av === undefined) return 1;
            if (bv === null || bv === undefined) return -1;
            return (av as number | string) < (bv as number | string) ? -1 : 1;
          });
          if (params.sort.desc) result.reverse();
        }
      }
      result = result.slice(0, 20);
      resolve(result);
    }, 600);
    params.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
