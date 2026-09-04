/**
 * A plain-DOM table renderer built on `@future-standard-ui/table-core` alone — no React.
 *
 * It exists to prove the contract: the core owns state, derived data, attributes and the CSS
 * module; a renderer only walks the row model and emits the parts. This one re-renders the whole
 * table on every state change, which is fine for a proof and for small tables; a production
 * renderer would diff rows.
 */
import {
  type ColumnSchema,
  tableClasses as c,
  compactAttributes,
  createTable,
  getBodyAttributes,
  getEffectiveStatus,
  getElementAttributes,
  getHeadAttributes,
  getPinStyle,
  getUtilityColumnCount,
  hasHeaderGroups,
  PARTS,
  type Row,
  type RowGroup,
  resolveFeatures,
  type TableInstance,
  type TableOptions,
} from '@future-standard-ui/table-core';

export type VanillaCellContext<TRow> = {
  value: unknown;
  row: Row<TRow>;
  column: ColumnSchema;
  table: TableInstance<TRow>;
  options: Record<string, unknown>;
};
export type VanillaCellRenderer<TRow> = (ctx: VanillaCellContext<TRow>) => Node | string;

export type MountOptions<TRow> = TableOptions<TRow> & {
  cells?: Record<string, VanillaCellRenderer<TRow>>;
  slots?: { loading?: string; empty?: string; error?: string };
  maxHeight?: string;
  labels?: { selectAll?: string; expandRow?: string; collapseRow?: string };
};

type Attrs = Record<string, string | undefined>;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Array<Node | string | null | undefined | false>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(compactAttributes(attrs))) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

const setVars = (node: HTMLElement, vars: Record<string, string | undefined> | undefined) => {
  for (const [key, value] of Object.entries(vars ?? {})) {
    if (value !== undefined) node.style.setProperty(key, value);
  }
};

const chevron = (className?: string) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('viewBox', '0 0 12 12');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M4 2l4 4-4 4');
  svg.append(path);
  return svg;
};

const sortIcon = () => {
  const svg = chevron(c.sortIcon);
  svg.replaceChildren();
  for (const [cls, d] of [
    [c.sortIconUp, 'M3 5l3-3 3 3'],
    [c.sortIconDown, 'M3 7l3 3 3-3'],
  ]) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', cls);
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
};

export function mountTable<TRow>(container: HTMLElement, initial: MountOptions<TRow>) {
  const { cells = {}, slots = {}, maxHeight, labels = {}, ...coreOptions } = initial;
  const table = createTable<TRow>(coreOptions);
  const text: VanillaCellRenderer<TRow> = ({ value }) =>
    value === null || value === undefined ? '' : String(value);

  const utilityAttrs = (kind: string, index: number) => ({
    node: (tag: 'th' | 'td', ...children: Array<Node | string | false>) => {
      const node = el(
        tag,
        { 'data-utility': kind, class: tag === 'th' ? c.utilityHeader : c.utilityCell },
        ...children
      );
      node.style.setProperty(
        '--_pin-offset',
        index === 0 ? '0px' : `calc(var(--_utility-width) * ${index})`
      );
      return node;
    },
  });

  const renderHead = () => {
    const schema = table.getSchema();
    const features = resolveFeatures(schema);
    const columns = table.getVisibleColumns();
    const utility = getUtilityColumnCount(schema);
    const head = el('thead', { ...getHeadAttributes(), class: c.head });

    if (hasHeaderGroups(columns)) {
      const row = el('tr', { 'data-ui': PARTS.groupHeaderRow, class: c.groupHeaderRow });
      if (utility > 0) {
        const th = utilityAttrs('group', 0).node('th');
        th.colSpan = utility;
        row.append(th);
      }
      for (const group of table.getHeaderGroups()) {
        const first = columns.find((col) => col.id === group.columnIds[0]);
        const same = (key: 'visibleFrom' | 'visibleUntil') =>
          group.columnIds.every(
            (id) => columns.find((col) => col.id === id)?.[key] === first?.[key]
          )
            ? first?.[key]
            : undefined;
        const th = el(
          'th',
          {
            'data-ui': PARTS.groupHeaderCell,
            'data-empty': group.title === undefined ? 'true' : undefined,
            'data-visible-from': same('visibleFrom'),
            'data-visible-until': same('visibleUntil'),
            scope: 'colgroup',
            class: c.groupHeaderCell,
          },
          group.title ?? ''
        );
        th.colSpan = group.span;
        row.append(th);
      }
      head.append(row);
    }

    const row = el('tr', { 'data-ui': PARTS.headerRow, class: c.headerRow });
    if (features.selection !== 'none') {
      const th = utilityAttrs('select', 0).node('th');
      th.scope = 'col';
      if (features.selection === 'multiple') {
        const summary = table.getSelectionSummary();
        const input = el('input', {
          type: 'checkbox',
          'data-ui': PARTS.selectAll,
          class: c.checkbox,
          'aria-label': labels.selectAll ?? 'Select all rows',
        });
        input.checked = summary === 'all';
        input.indeterminate = summary === 'some';
        input.disabled = table.getRowModel().rows.length === 0;
        input.addEventListener('change', () => table.toggleAllRowsSelected(input.checked));
        th.append(input);
      }
      row.append(th);
    }
    if (features.expandable) {
      const th = utilityAttrs('expand', features.selection !== 'none' ? 1 : 0).node('th');
      th.scope = 'col';
      row.append(th);
    }
    for (const column of columns) {
      const pin = table.getColumnPinLayout(column.id);
      const th = el('th', {
        scope: 'col',
        ...table.getHeaderCellAttributes(column.id),
        class: c.headerCell,
      });
      th.style.width = column.width ?? '';
      th.style.minWidth = column.minWidth ?? column.width ?? '';
      th.style.maxWidth = column.maxWidth ?? (pin ? (column.width ?? '') : '');
      setVars(th, getPinStyle(pin));
      const label = el('span', { class: c.headerText }, column.header);
      if (column.sortable) {
        const button = el(
          'button',
          { type: 'button', 'data-ui': PARTS.sortButton, class: c.sortButton },
          label,
          sortIcon()
        );
        button.addEventListener('click', () => table.toggleSort(column.id));
        th.append(button);
      } else {
        th.append(label);
      }
      row.append(th);
    }
    head.append(row);
    return head;
  };

  const renderCell = (row: Row<TRow>, column: ColumnSchema) => {
    const td = el('td', { ...table.getCellAttributes(column.id), class: c.cell });
    setVars(td, getPinStyle(table.getColumnPinLayout(column.id)));
    const render = cells[column.cell?.type ?? 'text'] ?? cells.text ?? text;
    const content = el('span', { class: c.cellContent });
    content.append(
      render({
        value: row.getValue(column.id),
        row,
        column,
        table,
        options: column.cell?.options ?? {},
      })
    );
    td.append(content);
    return td;
  };

  const renderRow = (row: Row<TRow>) => {
    const schema = table.getSchema();
    const features = resolveFeatures(schema);
    const tr = el('tr', { ...table.getRowAttributes(row), class: c.row });
    if (features.selection !== 'none') {
      const td = utilityAttrs('select', 0).node('td');
      const input = el('input', {
        type: features.selection === 'single' ? 'radio' : 'checkbox',
        'data-ui': PARTS.selectRow,
        class: c.checkbox,
        'aria-label': `Select row ${row.key}`,
      });
      input.checked = row.isSelected;
      input.addEventListener('change', () => table.toggleRowSelected(row.key, input.checked));
      td.append(input);
      tr.append(td);
    }
    if (features.expandable) {
      const td = utilityAttrs('expand', features.selection !== 'none' ? 1 : 0).node('td');
      const button = el(
        'button',
        {
          type: 'button',
          'data-ui': PARTS.expandToggle,
          class: c.expandToggle,
          'aria-expanded': String(row.isExpanded),
          'aria-label': row.isExpanded
            ? (labels.collapseRow ?? 'Collapse row')
            : (labels.expandRow ?? 'Expand row'),
        },
        chevron()
      );
      button.addEventListener('click', () => table.toggleExpanded(row.key));
      td.append(button);
      tr.append(td);
    }
    for (const column of table.getVisibleColumns()) tr.append(renderCell(row, column));
    return tr;
  };

  const colSpan = () => table.getVisibleColumns().length + getUtilityColumnCount(table.getSchema());

  const renderGroupRow = (group: RowGroup<TRow>) => {
    const collapsible = table.getSchema().features?.grouping?.collapsible ?? false;
    const tr = el('tr', {
      'data-ui': PARTS.groupRow,
      'data-group': group.key,
      'data-collapsed': group.isCollapsed ? 'true' : undefined,
      class: c.groupRow,
    });
    const td = el('td', { class: c.groupCell });
    td.colSpan = colSpan();
    const count = el('span', { class: c.groupCount }, String(group.rows.length));
    if (collapsible) {
      const button = el(
        'button',
        { type: 'button', class: c.groupToggle, 'aria-expanded': String(!group.isCollapsed) },
        chevron(c.groupChevron),
        el('span', {}, String(group.value)),
        count
      );
      button.addEventListener('click', () => table.toggleGroupCollapsed(group.key));
      td.append(button);
    } else {
      td.append(el('span', { class: c.groupToggle }, el('span', {}, String(group.value)), count));
    }
    tr.append(td);
    return tr;
  };

  const renderStatusRow = (status: string, content: string | undefined) => {
    const tr = el('tr', { 'data-ui': PARTS.status, 'data-status': status, class: c.statusRow });
    const td = el('td', { class: c.statusCell }, content ?? '');
    td.colSpan = colSpan();
    tr.append(td);
    return tr;
  };

  const renderBody = () => {
    const model = table.getRowModel();
    const status = getEffectiveStatus(table);
    const body = el('tbody', {
      ...getBodyAttributes({ busy: status === 'loading' }),
      class: c.body,
    });
    if (status === 'error' || (status !== 'idle' && model.rows.length === 0)) {
      body.append(renderStatusRow(status, slots[status as keyof typeof slots]));
    } else if (model.groups) {
      for (const group of model.groups) {
        body.append(renderGroupRow(group));
        if (!group.isCollapsed) for (const row of group.rows) body.append(renderRow(row));
      }
    } else {
      for (const row of model.rows) body.append(renderRow(row));
    }
    return body;
  };

  const render = () => {
    const status = getEffectiveStatus(table);
    const root = el('div', { ...table.getRootAttributes(), 'data-status': status, class: c.root });
    if (maxHeight) root.style.setProperty('--_max-height', maxHeight);
    const tableEl = el(
      'table',
      { ...getElementAttributes(), class: c.table },
      renderHead(),
      renderBody()
    );
    if (table.getOptions().layout === 'page') root.append(tableEl);
    else root.append(el('div', { 'data-ui': PARTS.scroll, class: c.scroll }, tableEl));
    if (status === 'loading' && table.getRowModel().rows.length > 0) {
      root.append(
        el(
          'div',
          { 'data-ui': PARTS.status, 'data-status': 'loading', class: c.statusOverlay },
          slots.loading ?? ''
        )
      );
    }
    container.replaceChildren(root);
  };

  const unsubscribe = table.subscribe(render);
  render();

  return {
    table,
    update: (patch: Partial<TableOptions<TRow>>) => table.setOptions(patch),
    destroy: () => {
      unsubscribe();
      container.replaceChildren();
    },
  };
}
