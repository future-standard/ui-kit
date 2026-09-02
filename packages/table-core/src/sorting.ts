import type { ColumnSort, SortingState } from './state';

export type Comparator = (a: unknown, b: unknown) => number;

/** `null`, `undefined` and `''` are "empty" and always sort last, whatever the direction. */
export const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || value === '';

/**
 * Sensible default ordering: empty values last (and equal to each other); numbers and dates
 * numerically; booleans false→true; everything else as locale-aware, numeric-aware strings so
 * `"item 2"` sorts before `"item 10"`.
 */
export const defaultComparator: Comparator = (a, b) => {
  const emptyA = isEmptyValue(a);
  const emptyB = isEmptyValue(b);
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

export type ToggleSortOptions = {
  /** Keep other columns' sort entries (multi-column sort). Default `false`. */
  multi?: boolean;
  /** Allow a third click to clear the sort. Default `false`: asc → desc → asc. */
  allowClear?: boolean;
};

export function getColumnSort(sorting: SortingState, columnId: string): ColumnSort | undefined {
  return sorting.find((sort) => sort.id === columnId);
}

/**
 * Compute the next sorting state after a header click.
 * Unsorted → ascending → descending → (ascending, or cleared when `allowClear`).
 */
export function toggleColumnSort(
  sorting: SortingState,
  columnId: string,
  { multi = false, allowClear = false }: ToggleSortOptions = {}
): SortingState {
  const current = getColumnSort(sorting, columnId);
  const others = multi ? sorting.filter((sort) => sort.id !== columnId) : [];

  if (!current) return [...others, { id: columnId, desc: false }];
  if (!current.desc) return [...others, { id: columnId, desc: true }];
  if (allowClear) return others;
  return [...others, { id: columnId, desc: false }];
}

/**
 * Stable, multi-key sort of `rows` by `sorting`. Values are read through `getValue` so the
 * caller decides whether accessors or pre-resolved cells are used. Returns a new array; the
 * input is not mutated. With an empty `sorting` the input order is kept.
 *
 * Empty values always sink to the bottom regardless of direction — a descending "last seen"
 * column should still show the cameras that were never seen at the end.
 */
export function sortRows<TRow>(
  rows: readonly TRow[],
  sorting: SortingState,
  getValue: (row: TRow, columnId: string) => unknown,
  comparators: Record<string, Comparator> = {}
): TRow[] {
  if (sorting.length === 0) return [...rows];

  const indexed = rows.map((row, index) => ({ row, index }));
  indexed.sort((a, b) => {
    for (const { id, desc } of sorting) {
      const valueA = getValue(a.row, id);
      const valueB = getValue(b.row, id);
      const emptyA = isEmptyValue(valueA);
      const emptyB = isEmptyValue(valueB);
      if (emptyA !== emptyB) return emptyA ? 1 : -1;
      if (emptyA) continue;
      const compare = comparators[id] ?? defaultComparator;
      const result = compare(valueA, valueB);
      if (result !== 0) return desc ? -result : result;
    }
    return a.index - b.index;
  });
  return indexed.map((entry) => entry.row);
}
