import type { ReactNode } from 'react';

const svg = (d: string) => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d={d} />
  </svg>
);

/** Example icon set passed to `createTableCells({ icons })`. The kit ships no icon dependency. */
export const icons: Record<string, ReactNode> = {
  play: svg('M4 2.5v11l9-5.5z'),
  download: svg('M8 2v8m0 0l-3-3m3 3l3-3M3 13h10'),
  delete: svg('M3 4h10M6 4V2.5h4V4M4.5 4l.7 9h5.6l.7-9'),
  edit: svg('M11 2l3 3-8 8H3v-3z'),
  more: svg('M3.5 8h.01M8 8h.01M12.5 8h.01'),
  camera: svg('M2 5h3l1.5-2h3L11 5h3v8H2z M8 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'),
  ptz: svg('M8 2v3M8 11v3M2 8h3M11 8h3M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'),
};
