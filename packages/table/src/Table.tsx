import {
  type ColumnSchema,
  compactAttributes,
  getEffectiveStatus,
  getPinStyle,
  hasHeaderGroups,
  PARTS,
  type RowGroup,
  type Row as RowModelRow,
  resolveFeatures,
  tableClasses as styles,
  type TableInstance,
  type TableStatus,
} from '@future-standard-ui/table-core';
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { defaultCellRenderers, resolveCellRenderer } from './cells';
import {
  type CellRenderers,
  defaultLabels,
  type RowHints,
  TableContext,
  type TableContextValue,
  type TableLabels,
  type TableSlots,
  useTableContext,
} from './context';
import { SortIcon } from './SortIcon';

const cx = (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' ');

/**
 * Breakpoint visibility a group header cell can safely carry: only when every column in the
 * group agrees. A group mixing visibilities keeps its full span at every width (a `colspan`
 * cannot respond to container queries), so schemas should give grouped columns the same
 * `visibleFrom` / `visibleUntil`.
 */
function sharedVisibility(columns: Array<ColumnSchema | undefined>) {
  const first = columns[0];
  const same = (key: 'visibleFrom' | 'visibleUntil') =>
    columns.every((c) => c?.[key] === first?.[key]) ? first?.[key] : undefined;
  return { visibleFrom: same('visibleFrom'), visibleUntil: same('visibleUntil') };
}

/**
 * Utility (select / expand) cells stick to the start edge like pinned columns; their offset is a
 * multiple of the utility width the CSS module owns.
 */
function utilityAttributes(kind: 'select' | 'expand' | 'group', index: number) {
  return {
    'data-utility': kind,
    style: {
      '--_pin-offset': index === 0 ? '0px' : `calc(var(--_utility-width) * ${index})`,
    } as CSSProperties,
  };
}

/** Number of leading utility columns (selection, expand) for colSpan maths. */
function useUtilityColumnCount(): number {
  const { table } = useTableContext();
  const features = resolveFeatures(table.getSchema());
  return (features.selection !== 'none' ? 1 : 0) + (features.expandable ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export type RootProps<TRow> = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  table: TableInstance<TRow>;
  children?: ReactNode;
  /** Cell type name → renderer. Merged over the built-in `text`. */
  cells?: CellRenderers<TRow>;
  /** Content for loading / empty / error. */
  slots?: TableSlots;
  /** Override accessible names for controls without visible text. */
  labels?: Partial<TableLabels>;
  /** Per-row `tone` / `state` hints, e.g. dim a pending row. */
  getRowHints?: (row: RowModelRow<TRow>) => RowHints | undefined;
  /** Content for an expanded row's drawer. Required for `features.expandable` to show anything. */
  renderDrawer?: (row: RowModelRow<TRow>) => ReactNode;
  /** Custom group header content. Defaults to the group value as text. */
  renderGroupHeader?: (group: RowGroup<TRow>) => ReactNode;
  /**
   * Cap the table's height; the scroll container then scrolls vertically and a sticky header
   * sticks to it. Without a cap the page scrolls and the header cannot stick (see plan §8).
   */
  maxHeight?: string;
  /**
   * Distance from the top of the scrolling ancestor at which a sticky header rests — the height
   * of a fixed app bar, for example. Only meaningful with `layout: 'page'`.
   */
  stickyTop?: string;
};

export function Root<TRow>({
  table,
  cells,
  slots,
  labels,
  getRowHints,
  renderDrawer,
  renderGroupHeader,
  maxHeight,
  stickyTop,
  className,
  style,
  children,
  ref,
  ...props
}: RootProps<TRow>) {
  const value = useMemo<TableContextValue<TRow>>(
    () => ({
      table,
      cells: { ...(defaultCellRenderers as CellRenderers<TRow>), ...cells },
      slots: slots ?? {},
      labels: { ...defaultLabels, ...labels },
      getRowHints,
      renderDrawer,
      renderGroupHeader,
    }),
    [table, cells, slots, labels, getRowHints, renderDrawer, renderGroupHeader]
  );

  const status = getEffectiveStatus(table);
  const attrs = compactAttributes({ ...table.getRootAttributes(), 'data-status': status });
  const hasRows = table.getRowModel().rows.length > 0;
  const showOverlay = status === 'loading' && hasRows;

  return (
    <TableContext value={value}>
      <div
        ref={ref}
        {...attrs}
        className={cx(styles.root, className)}
        style={
          { ...style, '--_max-height': maxHeight, '--_sticky-top': stickyTop } as CSSProperties
        }
        {...props}
      >
        {children}
        {showOverlay && (
          <div data-ui={PARTS.status} data-status='loading' className={styles.statusOverlay}>
            {value.slots.loading}
          </div>
        )}
      </div>
    </TableContext>
  );
}

// ---------------------------------------------------------------------------
// Scroll / Element
// ---------------------------------------------------------------------------

export function Scroll({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div data-ui={PARTS.scroll} className={cx(styles.scroll, className)} {...props} />;
}

export function Element({ className, ...props }: ComponentPropsWithRef<'table'>) {
  return <table data-ui={PARTS.element} className={cx(styles.table, className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Head
// ---------------------------------------------------------------------------

export function Head({ children, className, ...props }: ComponentPropsWithRef<'thead'>) {
  const { table, labels } = useTableContext();
  const columns = table.getVisibleColumns();
  const features = resolveFeatures(table.getSchema());
  const utilityCount = useUtilityColumnCount();
  const groups = table.getHeaderGroups();

  return (
    <thead data-ui={PARTS.head} className={cx(styles.head, className)} {...props}>
      {children ?? (
        <>
          {hasHeaderGroups(columns) && (
            <tr data-ui={PARTS.groupHeaderRow} className={styles.groupHeaderRow}>
              {utilityCount > 0 && (
                <th
                  colSpan={utilityCount}
                  className={styles.utilityHeader}
                  {...utilityAttributes('group', 0)}
                />
              )}
              {groups.map((group) => {
                const visibility = sharedVisibility(
                  group.columnIds.map((id) => columns.find((c) => c.id === id))
                );
                return (
                  <th
                    key={group.columnIds.join('|')}
                    data-ui={PARTS.groupHeaderCell}
                    data-empty={group.title === undefined ? 'true' : undefined}
                    data-visible-from={visibility.visibleFrom}
                    data-visible-until={visibility.visibleUntil}
                    colSpan={group.span}
                    scope='colgroup'
                    className={styles.groupHeaderCell}
                  >
                    {group.title}
                  </th>
                );
              })}
            </tr>
          )}
          <tr data-ui={PARTS.headerRow} className={styles.headerRow}>
            {features.selection !== 'none' && (
              <th scope='col' className={styles.utilityHeader} {...utilityAttributes('select', 0)}>
                {features.selection === 'multiple' && <SelectAll />}
              </th>
            )}
            {features.expandable && (
              <th
                scope='col'
                className={styles.utilityHeader}
                {...utilityAttributes('expand', features.selection !== 'none' ? 1 : 0)}
              >
                <span className={styles.srOnly}>{labels.expandColumn}</span>
              </th>
            )}
            {columns.map((column) => (
              <HeaderCell key={column.id} column={column} />
            ))}
          </tr>
        </>
      )}
    </thead>
  );
}

export type HeaderCellProps = ComponentPropsWithRef<'th'> & {
  column: ColumnSchema;
};

export function HeaderCell({ column, children, className, style, ...props }: HeaderCellProps) {
  const { table } = useTableContext();
  const attrs = compactAttributes(table.getHeaderCellAttributes(column.id));
  const pin = table.getColumnPinLayout(column.id);
  const content = children ?? column.header;

  return (
    <th
      scope='col'
      {...attrs}
      className={cx(styles.headerCell, className)}
      style={{
        width: column.width,
        // A declared width is a floor: the table grows past its container and scrolls rather than
        // squeezing columns. Pinned columns are locked exactly, since neighbours' offsets depend
        // on them.
        minWidth: column.minWidth ?? column.width,
        maxWidth: column.maxWidth ?? (pin ? column.width : undefined),
        ...getPinStyle(pin),
        ...style,
      }}
      {...props}
    >
      {column.sortable ? (
        <button
          type='button'
          data-ui={PARTS.sortButton}
          className={styles.sortButton}
          onClick={() => table.toggleSort(column.id)}
        >
          <span className={styles.headerText}>{content}</span>
          <SortIcon />
        </button>
      ) : (
        <span className={styles.headerText}>{content}</span>
      )}
    </th>
  );
}

function SelectAll() {
  const { table, labels } = useTableContext();
  const summary = table.getSelectionSummary();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = summary === 'some';
  }, [summary]);

  return (
    <input
      ref={ref}
      type='checkbox'
      data-ui={PARTS.selectAll}
      className={styles.checkbox}
      aria-label={labels.selectAll}
      checked={summary === 'all'}
      disabled={table.getRowModel().rows.length === 0}
      onChange={(event) => table.toggleAllRowsSelected(event.currentTarget.checked)}
    />
  );
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export function Body<TRow>({ children, className, ...props }: ComponentPropsWithRef<'tbody'>) {
  const { table, slots, renderDrawer } = useTableContext<TRow>();
  const model = table.getRowModel();
  const status = getEffectiveStatus(table);
  const grouping = table.getSchema().features?.grouping;

  const renderRow = (row: RowModelRow<TRow>) => (
    <RowFragment key={row.key} row={row} drawer={renderDrawer} />
  );

  let content: ReactNode;
  if (children !== undefined) {
    content = children;
  } else if (status === 'error' || (status !== 'idle' && model.rows.length === 0)) {
    content = <Status status={status}>{slots[status as keyof TableSlots]}</Status>;
  } else if (grouping && model.groups) {
    content = model.groups.map((group) => (
      <GroupFragment key={group.key} group={group} renderRow={renderRow} />
    ));
  } else {
    content = model.rows.map(renderRow);
  }

  return (
    <tbody
      data-ui={PARTS.body}
      className={cx(styles.body, className)}
      aria-busy={status === 'loading' || undefined}
      {...props}
    >
      {content}
    </tbody>
  );
}

function RowFragment<TRow>({
  row,
  drawer,
}: {
  row: RowModelRow<TRow>;
  drawer?: (row: RowModelRow<TRow>) => ReactNode;
}) {
  return (
    <>
      <Row row={row} />
      {row.isExpanded && drawer && <Drawer row={row}>{drawer(row)}</Drawer>}
    </>
  );
}

function GroupFragment<TRow>({
  group,
  renderRow,
}: {
  group: RowGroup<TRow>;
  renderRow: (row: RowModelRow<TRow>) => ReactNode;
}) {
  return (
    <>
      <GroupRow group={group} />
      {!group.isCollapsed && group.rows.map(renderRow)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Row / Cell
// ---------------------------------------------------------------------------

export type RowProps<TRow> = ComponentPropsWithRef<'tr'> & {
  row: RowModelRow<TRow>;
};

export function Row<TRow>({ row, children, className, ...props }: RowProps<TRow>) {
  const { table, getRowHints } = useTableContext<TRow>();
  const columns = table.getVisibleColumns();
  const features = resolveFeatures(table.getSchema());
  const attrs = compactAttributes(table.getRowAttributes(row, getRowHints?.(row)));

  return (
    <tr {...attrs} className={cx(styles.row, className)} {...props}>
      {children ?? (
        <>
          {features.selection !== 'none' && (
            <td className={styles.utilityCell} {...utilityAttributes('select', 0)}>
              <SelectRow row={row} mode={features.selection} />
            </td>
          )}
          {features.expandable && (
            <td
              className={styles.utilityCell}
              {...utilityAttributes('expand', features.selection !== 'none' ? 1 : 0)}
            >
              <ExpandToggle row={row} />
            </td>
          )}
          {columns.map((column) => (
            <Cell key={column.id} row={row} column={column} />
          ))}
        </>
      )}
    </tr>
  );
}

function SelectRow<TRow>({ row, mode }: { row: RowModelRow<TRow>; mode: 'single' | 'multiple' }) {
  const { table, labels } = useTableContext<TRow>();
  return (
    <input
      type={mode === 'single' ? 'radio' : 'checkbox'}
      data-ui={PARTS.selectRow}
      className={styles.checkbox}
      aria-label={labels.selectRow(row as RowModelRow<never>)}
      checked={row.isSelected}
      onChange={(event) => table.toggleRowSelected(row.key, event.currentTarget.checked)}
    />
  );
}

function ExpandToggle<TRow>({ row }: { row: RowModelRow<TRow> }) {
  const { table, labels } = useTableContext<TRow>();
  return (
    <button
      type='button'
      data-ui={PARTS.expandToggle}
      className={styles.expandToggle}
      aria-expanded={row.isExpanded}
      aria-label={row.isExpanded ? labels.collapseRow : labels.expandRow}
      onClick={() => table.toggleExpanded(row.key)}
    >
      <svg
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
        <path d='M4 2l4 4-4 4' />
      </svg>
    </button>
  );
}

export type CellProps<TRow> = ComponentPropsWithRef<'td'> & {
  row: RowModelRow<TRow>;
  column: ColumnSchema;
};

export function Cell<TRow>({ row, column, children, className, style, ...props }: CellProps<TRow>) {
  const { table, cells } = useTableContext<TRow>();
  const attrs = compactAttributes(table.getCellAttributes(column.id));
  const pinStyle = getPinStyle(table.getColumnPinLayout(column.id));
  const render = resolveCellRenderer(cells, column.cell?.type ?? 'text');
  const content =
    children ??
    render({
      value: row.getValue(column.id),
      row,
      column,
      table,
      options: column.cell?.options ?? {},
    });

  return (
    <td
      {...attrs}
      className={cx(styles.cell, className)}
      style={pinStyle || style ? { ...pinStyle, ...style } : undefined}
      {...props}
    >
      {content}
    </td>
  );
}

// ---------------------------------------------------------------------------
// Group row / Drawer / Status
// ---------------------------------------------------------------------------

export type GroupRowProps<TRow> = ComponentPropsWithRef<'tr'> & {
  group: RowGroup<TRow>;
};

export function GroupRow<TRow>({ group, children, className, ...props }: GroupRowProps<TRow>) {
  const { table, renderGroupHeader } = useTableContext<TRow>();
  const utilityCount = useUtilityColumnCount();
  const colSpan = table.getVisibleColumns().length + utilityCount;
  const collapsible = table.getSchema().features?.grouping?.collapsible ?? false;
  const label = children ?? renderGroupHeader?.(group) ?? String(group.value);

  return (
    <tr
      data-ui={PARTS.groupRow}
      data-group={group.key}
      data-collapsed={group.isCollapsed ? 'true' : undefined}
      className={cx(styles.groupRow, className)}
      {...props}
    >
      <td colSpan={colSpan} className={styles.groupCell}>
        {collapsible ? (
          <button
            type='button'
            className={styles.groupToggle}
            aria-expanded={!group.isCollapsed}
            onClick={() => table.toggleGroupCollapsed(group.key)}
          >
            <svg
              className={styles.groupChevron}
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
              <path d='M4 2l4 4-4 4' />
            </svg>
            <span>{label}</span>
            <span className={styles.groupCount}>{group.rows.length}</span>
          </button>
        ) : (
          <span className={styles.groupToggle}>
            <span>{label}</span>
            <span className={styles.groupCount}>{group.rows.length}</span>
          </span>
        )}
      </td>
    </tr>
  );
}

export type DrawerProps<TRow> = ComponentPropsWithRef<'tr'> & {
  row: RowModelRow<TRow>;
};

export function Drawer<TRow>({ row, children, className, ...props }: DrawerProps<TRow>) {
  const { table } = useTableContext<TRow>();
  const utilityCount = useUtilityColumnCount();
  const colSpan = table.getVisibleColumns().length + utilityCount;

  return (
    <tr
      data-ui={PARTS.drawer}
      data-key={row.key}
      className={cx(styles.drawer, className)}
      {...props}
    >
      <td colSpan={colSpan} className={styles.drawerCell}>
        {children}
      </td>
    </tr>
  );
}

export type StatusProps = ComponentPropsWithRef<'tr'> & {
  status: TableStatus;
};

export function Status({ status, children, className, ...props }: StatusProps) {
  const { table } = useTableContext();
  const utilityCount = useUtilityColumnCount();
  const colSpan = table.getVisibleColumns().length + utilityCount;

  return (
    <tr
      data-ui={PARTS.status}
      data-status={status}
      className={cx(styles.statusRow, className)}
      {...props}
    >
      <td colSpan={colSpan} className={styles.statusCell}>
        {children}
      </td>
    </tr>
  );
}

/** Compound export so consumers can write `<Table.Root>…<Table.Body/>…`. */
export const Table = {
  Root,
  Scroll,
  Element,
  Head,
  HeaderCell,
  Body,
  Row,
  Cell,
  GroupRow,
  Drawer,
  Status,
};
