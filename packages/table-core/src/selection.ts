import type { SelectionMode } from './schema';
import type { RowSelectionState } from './state';

/** What the select-all control should show. */
export type SelectionSummary = 'none' | 'some' | 'all';

/**
 * Toggle (or set) one row. In `single` mode the new selection replaces any other. Unselected
 * keys are removed rather than stored as `false`, so the record stays a clean list of selected keys.
 */
export function toggleRowSelection(
  selection: RowSelectionState,
  key: string,
  value: boolean = !selection[key],
  mode: SelectionMode = 'multiple'
): RowSelectionState {
  if (mode === 'none') return selection;
  if (!value) {
    if (!selection[key]) return selection;
    const { [key]: _removed, ...rest } = selection;
    return rest;
  }
  if (mode === 'single') return { [key]: true };
  if (selection[key]) return selection;
  return { ...selection, [key]: true };
}

/**
 * Select or deselect a set of keys, leaving keys outside the set untouched. Passing the keys of
 * the *current* rows gives "select all on this page"; passing every known key gives "select all".
 */
export function setSelectionForKeys(
  selection: RowSelectionState,
  keys: readonly string[],
  value: boolean
): RowSelectionState {
  const next: RowSelectionState = { ...selection };
  for (const key of keys) {
    if (value) next[key] = true;
    else delete next[key];
  }
  return next;
}

export function getSelectionSummary(
  keys: readonly string[],
  selection: RowSelectionState
): SelectionSummary {
  if (keys.length === 0) return 'none';
  let count = 0;
  for (const key of keys) {
    if (selection[key]) count += 1;
  }
  if (count === 0) return 'none';
  return count === keys.length ? 'all' : 'some';
}

export function getSelectedKeys(selection: RowSelectionState): string[] {
  return Object.keys(selection).filter((key) => selection[key]);
}
