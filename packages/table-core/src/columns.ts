import { type ColumnSchema, type PinSide, resolveFeatures, type TableSchema } from './schema';
import type { TableState } from './state';

export function getColumnById(schema: TableSchema, id: string): ColumnSchema | undefined {
  return schema.columns.find((column) => column.id === id);
}

/** Runtime pin side for a column, from state (which is seeded from the schema). */
export function getColumnPin(
  columnId: string,
  pinning: TableState['columnPinning']
): PinSide | undefined {
  if (pinning.start.includes(columnId)) return 'start';
  if (pinning.end.includes(columnId)) return 'end';
  return undefined;
}

/**
 * Columns to render, in render order: pinned-start (in pinning order), unpinned (in schema
 * order), pinned-end (in pinning order). Columns hidden via `columnVisibility` are dropped.
 * Breakpoint visibility (`visibleFrom` / `visibleUntil`) is *not* applied here — it is CSS-driven
 * so the same DOM serves every container width.
 */
export function getVisibleColumns(
  schema: TableSchema,
  state: Pick<TableState, 'columnVisibility' | 'columnPinning'>
): ColumnSchema[] {
  const visible = schema.columns.filter((column) => state.columnVisibility[column.id] !== false);
  const byId = new Map(visible.map((column) => [column.id, column]));
  const pick = (ids: readonly string[]) =>
    ids.map((id) => byId.get(id)).filter((column): column is ColumnSchema => column !== undefined);

  const start = pick(state.columnPinning.start);
  const end = pick(state.columnPinning.end);
  const pinned = new Set([...state.columnPinning.start, ...state.columnPinning.end]);
  const middle = visible.filter((column) => !pinned.has(column.id));

  return [...start, ...middle, ...end];
}

export type HeaderGroup = {
  /** `undefined` for columns without a group; they still occupy a slot with `span: 1`. */
  title: string | undefined;
  columnIds: string[];
  span: number;
};

/**
 * Merge adjacent columns sharing a `group` title into one header group. Order follows the
 * columns given, so pass the output of `getVisibleColumns`.
 */
export function getHeaderGroups(columns: readonly ColumnSchema[]): HeaderGroup[] {
  const groups: HeaderGroup[] = [];
  for (const column of columns) {
    const last = groups[groups.length - 1];
    if (last && last.title !== undefined && last.title === column.group) {
      last.columnIds.push(column.id);
      last.span += 1;
    } else {
      groups.push({ title: column.group, columnIds: [column.id], span: 1 });
    }
  }
  return groups;
}

export function hasHeaderGroups(columns: readonly ColumnSchema[]): boolean {
  return columns.some((column) => column.group !== undefined);
}

/** Name of the CSS custom property renderers set on pinned cells; the CSS module reads it. */
export const PIN_OFFSET_VAR = '--_pin-offset';
/** Name of the CSS custom property holding the utility (select / expand) column width. */
export const UTILITY_WIDTH_VAR = '--_utility-width';

export type PinLayout = {
  side: PinSide;
  /** CSS length expression for `left` (start) or `right` (end). */
  offset: string;
  /** Innermost pinned column on its side — where the edge shadow is drawn. */
  edge: boolean;
};

/** Number of leading utility columns (selection, expand) a schema renders. */
export function getUtilityColumnCount(schema: TableSchema): number {
  const features = resolveFeatures(schema);
  return (features.selection !== 'none' ? 1 : 0) + (features.expandable ? 1 : 0);
}

const sum = (terms: readonly string[]): string =>
  terms.length === 0 ? '0px' : terms.length === 1 ? terms[0] : `calc(${terms.join(' + ')})`;

/**
 * Sticky offsets for pinned columns, computed from the schema so no measurement is needed.
 * Start offsets accumulate the utility columns and the declared `width` of every pinned-start
 * column before this one; end offsets accumulate the pinned-end columns after it. The validator
 * guarantees those widths exist.
 */
export function getPinLayout(
  schema: TableSchema,
  state: Pick<TableState, 'columnVisibility' | 'columnPinning'>
): Map<string, PinLayout> {
  const visible = getVisibleColumns(schema, state);
  const utility = getUtilityColumnCount(schema);
  const layout = new Map<string, PinLayout>();

  const start = visible.filter((c) => getColumnPin(c.id, state.columnPinning) === 'start');
  const startTerms: string[] = utility > 0 ? [`var(${UTILITY_WIDTH_VAR}) * ${utility}`] : [];
  start.forEach((column, index) => {
    layout.set(column.id, {
      side: 'start',
      offset: startTerms.length === 1 && utility > 0 ? `calc(${startTerms[0]})` : sum(startTerms),
      edge: index === start.length - 1,
    });
    if (column.width) startTerms.push(column.width);
  });

  const end = visible.filter((c) => getColumnPin(c.id, state.columnPinning) === 'end');
  const endTerms: string[] = [];
  for (let index = end.length - 1; index >= 0; index -= 1) {
    const column = end[index];
    layout.set(column.id, { side: 'end', offset: sum(endTerms), edge: index === 0 });
    if (column.width) endTerms.push(column.width);
  }

  return layout;
}

/** Inline style a renderer applies to a pinned cell. `undefined` for unpinned columns. */
export function getPinStyle(layout: PinLayout | undefined): Record<string, string> | undefined {
  return layout ? { [PIN_OFFSET_VAR]: layout.offset } : undefined;
}
