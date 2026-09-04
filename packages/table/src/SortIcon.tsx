import { tableClasses as styles } from '@future-standard-ui/table-core';
/**
 * Two stacked chevrons; the active one is emphasised via `[data-sort]` on the header cell.
 * Inline SVG keeps the package free of an icon dependency.
 */
export function SortIcon() {
  return (
    <svg
      className={styles.sortIcon}
      width='12'
      height='12'
      viewBox='0 0 12 12'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      focusable='false'
    >
      <path className={styles.sortIconUp} d='M3 5l3-3 3 3' />
      <path className={styles.sortIconDown} d='M3 7l3 3 3-3' />
    </svg>
  );
}
