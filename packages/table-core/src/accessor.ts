import type { TableSchema } from './schema';

/** Reads a value out of a row. Runtime replacement for a schema's string accessor path. */
export type Accessor<TRow = unknown, TValue = unknown> = (row: TRow) => TValue;

/**
 * Resolve a dot path against a value. Segments may be object keys or array indices.
 * Returns `undefined` as soon as a segment is missing; never throws.
 *
 * `resolvePath({ a: { b: [1, 2] } }, 'a.b.1')` → `2`
 */
export function resolvePath(value: unknown, path: string): unknown {
  if (path === '') return value;
  let current: unknown = value;
  for (const segment of path.split('.')) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Build a reusable accessor for a path. */
export function createAccessor<TRow = unknown>(path: string): Accessor<TRow> {
  const segments = path.split('.');
  return (row: TRow) => {
    let current: unknown = row;
    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  };
}

/**
 * Resolve the row key for a row. Keys are always strings so they can be used as record keys
 * and DOM attribute values. Throws when the key is missing — a silent fallback to the index is
 * how the old kit ended up with unstable selection.
 */
export function getRowKey<TRow>(row: TRow, schema: Pick<TableSchema, 'rowKey'>): string {
  const value = resolvePath(row, schema.rowKey);
  if (value === null || value === undefined || value === '') {
    throw new Error(
      `Row is missing a key at "${schema.rowKey}". Every row must resolve rowKey to a string or number.`
    );
  }
  return String(value);
}
