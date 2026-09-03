import { resolvePath } from '@future-standard-ui/table-core';
import { Fragment } from 'react';
import type { CellRenderer, CellRenderers } from './context';
import styles from './Table.module.css';

/** Default renderer: the value as text, empty for `null` / `undefined`. */
export const textCell: CellRenderer = ({ value }) =>
  value === null || value === undefined ? '' : String(value);

type CompositePart = { accessor: string; label?: string; unit?: string };

/**
 * Several values from the row in one cell — the "combined column on small screens" case.
 * Schema: `cell: { type: 'composite', options: { parts: [{ accessor, label?, unit? }], separator? } }`.
 * Pair it with `visibleUntil` on this column and `visibleFrom` on the individual columns.
 */
export const compositeCell: CellRenderer = ({ row, options }) => {
  const parts = Array.isArray(options.parts) ? (options.parts as CompositePart[]) : [];
  const separator = typeof options.separator === 'string' ? options.separator : undefined;
  return (
    <span className={styles.composite}>
      {parts.map((part, index) => {
        const value = resolvePath(row.original, part.accessor);
        return (
          <Fragment key={part.accessor}>
            {index > 0 && separator !== undefined && (
              <span className={styles.compositeSeparator} aria-hidden='true'>
                {separator}
              </span>
            )}
            <span className={styles.compositePart}>
              {part.label !== undefined && (
                <span className={styles.compositeLabel}>{part.label}</span>
              )}
              {value === null || value === undefined ? '—' : String(value)}
              {part.unit !== undefined && <span className={styles.unit}>{part.unit}</span>}
            </span>
          </Fragment>
        );
      })}
    </span>
  );
};

/**
 * Renderers every table has without registering anything. The richer library (timestamp,
 * status, thumbnail, …) lives in `@future-standard-ui/table-cells`; projects register their own
 * with the same signature.
 */
export const defaultCellRenderers: CellRenderers = {
  text: textCell,
  composite: compositeCell,
};

/** Look up a renderer, falling back to `text` so an unknown type degrades to readable output. */
export function resolveCellRenderer<TRow>(
  cells: CellRenderers<TRow>,
  type: string
): CellRenderer<TRow> {
  return cells[type] ?? cells.text ?? (textCell as CellRenderer<TRow>);
}
