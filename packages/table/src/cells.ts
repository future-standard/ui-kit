import type { CellRenderer, CellRenderers } from './context';

/** Default renderer: the value as text, empty for `null` / `undefined`. */
export const textCell: CellRenderer = ({ value }) =>
  value === null || value === undefined ? '' : String(value);

/**
 * Renderers every table has without registering anything. The richer library (timestamp,
 * status, thumbnail, …) lives in `@future-standard-ui/table-cells`; projects register their own
 * with the same signature.
 */
export const defaultCellRenderers: CellRenderers = {
  text: textCell,
};

/** Look up a renderer, falling back to `text` so an unknown type degrades to readable output. */
export function resolveCellRenderer<TRow>(
  cells: CellRenderers<TRow>,
  type: string
): CellRenderer<TRow> {
  return cells[type] ?? cells.text ?? (textCell as CellRenderer<TRow>);
}
