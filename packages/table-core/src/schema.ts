/**
 * Table schema — the JSON-serialisable description of a table.
 *
 * Everything in here must survive `JSON.stringify` / `JSON.parse`: string accessors instead of
 * functions, cell *type names* instead of renderers, CSS lengths as strings. Anything that needs a
 * function (custom renderers, custom accessors, comparators) is supplied at runtime through
 * `TableOptions`, never through the schema. This keeps one artefact that designers, agents, saved
 * views and Figma can all produce or consume.
 */

/** Named container-width breakpoints, smallest to largest. Values are defined by the CSS module. */
export const BREAKPOINTS = ['sm', 'md', 'lg', 'xl'] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

/** Horizontal alignment of header and cell content. Logical, so RTL is free. */
export const ALIGNMENTS = ['start', 'center', 'end'] as const;
export type Align = (typeof ALIGNMENTS)[number];

/** Visual weight of a column's content. Replaces the old `cellStyle` importance scale. */
export const EMPHASES = ['low', 'normal', 'high'] as const;
export type Emphasis = (typeof EMPHASES)[number];

/** Row height scale. */
export const DENSITIES = ['compact', 'normal', 'comfortable'] as const;
export type Density = (typeof DENSITIES)[number];

/** Row selection behaviour. `none` renders no selection column. */
export const SELECTION_MODES = ['none', 'single', 'multiple'] as const;
export type SelectionMode = (typeof SELECTION_MODES)[number];

/** Side a column is locked to while the rest scroll horizontally. */
export const PIN_SIDES = ['start', 'end'] as const;
export type PinSide = (typeof PIN_SIDES)[number];

/**
 * How a cell renders its value. `type` is looked up in the renderer registry supplied at runtime
 * (`text`, `number`, `timestamp`, `status`, … or any project-registered name). `options` is passed
 * to that renderer untouched.
 */
export type CellSchema = {
  type: string;
  options?: Record<string, unknown>;
};

export type ColumnSchema = {
  /** Unique within the table. Used for state (sorting, visibility, pinning) and as the default accessor. */
  id: string;
  /** Display text, already translated by the consumer. */
  header: string;
  /**
   * Dot path into the row object (`'camera.displayName'`, `'tags.0'`). Defaults to `id`.
   * Runtime accessor functions can override this per column via `TableOptions.accessors`.
   */
  accessor?: string;
  /** Defaults to `{ type: 'text' }`. */
  cell?: CellSchema;
  /** Header becomes clickable and emits sorting changes. */
  sortable?: boolean;
  align?: Align;
  emphasis?: Emphasis;
  /** CSS length, e.g. `'200px'`, `'20%'`, `'12rem'`. Applied to the header cell; the scroll container absorbs overflow. */
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  /** Lock this column to the start or end edge while the body scrolls horizontally. */
  pin?: PinSide;
  /** Only render at this container breakpoint and above. */
  visibleFrom?: Breakpoint;
  /** Only render below this container breakpoint (exclusive). Pairs with `visibleFrom` on a sibling column for "combined on small" layouts. */
  visibleUntil?: Breakpoint;
  /** Header group title. Adjacent columns with the same title are merged into one group header. */
  group?: string;
};

export type GroupingSchema = {
  /** Column id whose value groups adjacent rows into sections. */
  by: string;
  /** Sections can be folded. */
  collapsible?: boolean;
  /** Section headers stick beneath the main header while scrolling. */
  stickyGroupHeader?: boolean;
};

/** Below this container breakpoint each row renders as a stacked card (mobile layout). */
export type StackedSchema = {
  below: Breakpoint;
};

export type TableFeatures = {
  selection?: SelectionMode;
  /** Stack rows into cards below a container breakpoint. */
  stacked?: StackedSchema;
  /** Rows can open a drawer beneath them. */
  expandable?: boolean;
  stickyHeader?: boolean;
  zebra?: boolean;
  density?: Density;
  grouping?: GroupingSchema;
};

export type TableSchema = {
  /** Stable identifier, useful for persistence and saved views. */
  id?: string;
  /** Dot path to a value that uniquely identifies a row. Selection and expansion are keyed by it. */
  rowKey: string;
  columns: ColumnSchema[];
  features?: TableFeatures;
};

/** The cell schema applied when a column declares none. */
export const DEFAULT_CELL: CellSchema = { type: 'text' };

export const DEFAULT_FEATURES: Required<Omit<TableFeatures, 'grouping' | 'stacked'>> = {
  selection: 'none',
  expandable: false,
  stickyHeader: false,
  zebra: false,
  density: 'normal',
};

/** Feature flags with defaults applied. */
export function resolveFeatures(schema: TableSchema): TableFeatures & typeof DEFAULT_FEATURES {
  return { ...DEFAULT_FEATURES, ...schema.features };
}
