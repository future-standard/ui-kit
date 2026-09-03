import {
  ALIGNMENTS,
  BREAKPOINTS,
  DENSITIES,
  EMPHASES,
  PIN_SIDES,
  SELECTION_MODES,
  type TableSchema,
} from './schema';

/** One problem found in a schema. `path` is a JSON-pointer-ish location such as `columns[2].align`. */
export type SchemaIssue = {
  path: string;
  message: string;
};

export class SchemaError extends Error {
  readonly issues: SchemaIssue[];

  constructor(issues: SchemaIssue[]) {
    super(
      `Invalid table schema (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n${issues
        .map((issue) => `  - ${issue.path}: ${issue.message}`)
        .join('\n')}`
    );
    this.name = 'SchemaError';
    this.issues = issues;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isOneOf = <T extends readonly string[]>(value: unknown, options: T): value is T[number] =>
  typeof value === 'string' && (options as readonly string[]).includes(value);

/**
 * Validate a schema and return every issue found. An empty array means the schema is valid.
 * Unknown properties are ignored so schemas stay forward compatible.
 */
export function validateSchema(schema: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ path, message });

  if (!isRecord(schema)) {
    issue('', 'schema must be an object');
    return issues;
  }

  if (!isNonEmptyString(schema.rowKey)) {
    issue('rowKey', 'must be a non-empty accessor path');
  }

  if (schema.id !== undefined && !isNonEmptyString(schema.id)) {
    issue('id', 'must be a non-empty string when provided');
  }

  if (!Array.isArray(schema.columns) || schema.columns.length === 0) {
    issue('columns', 'must be a non-empty array');
  } else {
    const seen = new Set<string>();
    schema.columns.forEach((column, index) => {
      const at = (prop: string) => `columns[${index}].${prop}`;
      if (!isRecord(column)) {
        issue(`columns[${index}]`, 'must be an object');
        return;
      }
      if (!isNonEmptyString(column.id)) {
        issue(at('id'), 'must be a non-empty string');
      } else if (seen.has(column.id)) {
        issue(at('id'), `duplicate column id "${column.id}"`);
      } else {
        seen.add(column.id);
      }
      if (typeof column.header !== 'string') {
        issue(at('header'), 'must be a string');
      }
      if (column.accessor !== undefined && !isNonEmptyString(column.accessor)) {
        issue(at('accessor'), 'must be a non-empty accessor path when provided');
      }
      if (column.cell !== undefined) {
        if (!isRecord(column.cell) || !isNonEmptyString(column.cell.type)) {
          issue(at('cell.type'), 'must be a non-empty cell type name');
        } else if (column.cell.options !== undefined && !isRecord(column.cell.options)) {
          issue(at('cell.options'), 'must be an object when provided');
        }
      }
      if (column.sortable !== undefined && typeof column.sortable !== 'boolean') {
        issue(at('sortable'), 'must be a boolean');
      }
      if (column.align !== undefined && !isOneOf(column.align, ALIGNMENTS)) {
        issue(at('align'), `must be one of ${ALIGNMENTS.join(', ')}`);
      }
      if (column.emphasis !== undefined && !isOneOf(column.emphasis, EMPHASES)) {
        issue(at('emphasis'), `must be one of ${EMPHASES.join(', ')}`);
      }
      for (const prop of ['width', 'minWidth', 'maxWidth'] as const) {
        if (column[prop] !== undefined && !isNonEmptyString(column[prop])) {
          issue(at(prop), 'must be a CSS length string, e.g. "200px", "20%" or "12rem"');
        }
      }
      if (column.pin !== undefined && !isOneOf(column.pin, PIN_SIDES)) {
        issue(at('pin'), `must be one of ${PIN_SIDES.join(', ')}`);
      }
      const from = column.visibleFrom;
      const until = column.visibleUntil;
      if (from !== undefined && !isOneOf(from, BREAKPOINTS)) {
        issue(at('visibleFrom'), `must be one of ${BREAKPOINTS.join(', ')}`);
      }
      if (until !== undefined && !isOneOf(until, BREAKPOINTS)) {
        issue(at('visibleUntil'), `must be one of ${BREAKPOINTS.join(', ')}`);
      }
      if (
        isOneOf(from, BREAKPOINTS) &&
        isOneOf(until, BREAKPOINTS) &&
        BREAKPOINTS.indexOf(from) >= BREAKPOINTS.indexOf(until)
      ) {
        issue(at('visibleUntil'), `must be a larger breakpoint than visibleFrom ("${from}")`);
      }
      if (column.group !== undefined && typeof column.group !== 'string') {
        issue(at('group'), 'must be a string');
      }
    });

    // Pinned columns are always-visible anchors, and sticky offsets are computed from declared
    // widths: every pinned column except the outermost on its side needs a `width`.
    const columns: unknown[] = schema.columns;
    const pinned = (side: 'start' | 'end') =>
      columns
        .map((column, index) => ({ column, index }))
        .filter(({ column }) => isRecord(column) && column.pin === side);
    for (const { column, index } of [...pinned('start'), ...pinned('end')]) {
      if (!isRecord(column)) continue;
      if (column.visibleFrom !== undefined || column.visibleUntil !== undefined) {
        issue(`columns[${index}].pin`, 'pinned columns cannot have visibleFrom / visibleUntil');
      }
    }
    const startPins = pinned('start');
    startPins.slice(0, -1).forEach(({ column, index }) => {
      if (isRecord(column) && !isNonEmptyString(column.width)) {
        issue(
          `columns[${index}].width`,
          'required: a pinned column with pinned columns after it on the same side'
        );
      }
    });
    const endPins = pinned('end');
    endPins.slice(1).forEach(({ column, index }) => {
      if (isRecord(column) && !isNonEmptyString(column.width)) {
        issue(
          `columns[${index}].width`,
          'required: a pinned column with pinned columns before it on the same side'
        );
      }
    });

    // Header groups render as one cell with a colspan, which cannot respond to container
    // queries. Grouped columns must therefore agree on breakpoint visibility.
    const groupVisibility = new Map<string, { from: unknown; until: unknown; index: number }>();
    schema.columns.forEach((column, index) => {
      if (!isRecord(column) || typeof column.group !== 'string') return;
      const seenGroup = groupVisibility.get(column.group);
      if (!seenGroup) {
        groupVisibility.set(column.group, {
          from: column.visibleFrom,
          until: column.visibleUntil,
          index,
        });
      } else if (seenGroup.from !== column.visibleFrom || seenGroup.until !== column.visibleUntil) {
        issue(
          `columns[${index}].group`,
          `columns in group "${column.group}" must share visibleFrom / visibleUntil (differs from columns[${seenGroup.index}])`
        );
      }
    });

    if (isRecord(schema.features)) {
      const f = schema.features;
      if (f.selection !== undefined && !isOneOf(f.selection, SELECTION_MODES)) {
        issue('features.selection', `must be one of ${SELECTION_MODES.join(', ')}`);
      }
      if (f.density !== undefined && !isOneOf(f.density, DENSITIES)) {
        issue('features.density', `must be one of ${DENSITIES.join(', ')}`);
      }
      for (const prop of ['expandable', 'stickyHeader', 'zebra'] as const) {
        if (f[prop] !== undefined && typeof f[prop] !== 'boolean') {
          issue(`features.${prop}`, 'must be a boolean');
        }
      }
      if (f.stacked !== undefined) {
        if (!isRecord(f.stacked) || !isOneOf(f.stacked.below, BREAKPOINTS)) {
          issue('features.stacked.below', `must be one of ${BREAKPOINTS.join(', ')}`);
        }
      }
      if (f.grouping !== undefined) {
        if (!isRecord(f.grouping) || !isNonEmptyString(f.grouping.by)) {
          issue('features.grouping.by', 'must be a column id');
        } else if (!seen.has(f.grouping.by)) {
          issue('features.grouping.by', `no column with id "${f.grouping.by}"`);
        }
      }
    } else if (schema.features !== undefined) {
      issue('features', 'must be an object when provided');
    }
  }

  return issues;
}

/** Throw a `SchemaError` listing every issue if the schema is invalid. */
export function assertSchema(schema: unknown): asserts schema is TableSchema {
  const issues = validateSchema(schema);
  if (issues.length > 0) {
    throw new SchemaError(issues);
  }
}
