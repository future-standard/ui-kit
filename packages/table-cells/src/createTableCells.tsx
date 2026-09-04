import type { CellContext, CellRenderer, CellRenderers } from '@future-standard-ui/table';
import { compositeCell, textCell } from '@future-standard-ui/table';
import { resolvePath } from '@future-standard-ui/table-core';
import type { ReactNode } from 'react';
import styles from './Cells.module.css';
import {
  fillTemplate,
  formatBytes,
  formatDate,
  formatDuration,
  formatNumber,
  formatRelative,
  formatTime,
  isEmpty,
  toDate,
} from './format';

/** Semantic tones shared by status, progress and actions. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * A JSON-safe condition evaluated against the row: `{ accessor, equals }`, `{ accessor, in: [] }`,
 * `{ accessor, not }`, or `{ accessor, truthy: true }`.
 */
export type Condition = {
  accessor: string;
  equals?: unknown;
  not?: unknown;
  in?: unknown[];
  truthy?: boolean;
};

export function evaluateCondition(condition: Condition | undefined, row: unknown): boolean {
  if (!condition) return true;
  const value = resolvePath(row, condition.accessor);
  if (condition.truthy !== undefined) return Boolean(value) === condition.truthy;
  if (condition.equals !== undefined) return value === condition.equals;
  if (condition.not !== undefined) return value !== condition.not;
  if (condition.in !== undefined) return condition.in.includes(value);
  return Boolean(value);
}

export type CreateTableCellsOptions = {
  /** Default locale for numbers and dates. Falls back to the browser's. */
  locale?: string;
  /** Default time zone for timestamps. */
  timeZone?: string;
  /** Named icons for the `icon` cell and action buttons. Any React node. */
  icons?: Record<string, ReactNode>;
  /** Placeholder for empty values. Default `'—'`. */
  placeholder?: ReactNode;
  /** Injectable clock for relative timestamps (tests). */
  now?: () => number;
};

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);

/**
 * Build the standard cell renderer set. Every renderer is configured from the column's
 * `cell.options` (plain JSON) and reports interactions through `emit`, so the schema stays
 * serialisable and the screen wires behaviour once via `onCellAction`.
 *
 * Cell types and their options are documented in `docs/components/table/cells.md`.
 */
export function createTableCells<TRow = unknown>(
  config: CreateTableCellsOptions = {}
): CellRenderers<TRow> {
  const { locale, timeZone, icons = {}, placeholder = '—', now = () => Date.now() } = config;
  const empty = <span className={styles.placeholder}>{placeholder}</span>;
  const icon = (name: unknown): ReactNode =>
    typeof name === 'string' && icons[name] !== undefined ? icons[name] : null;

  const number: CellRenderer<TRow> = ({ value, options }) => {
    const text = formatNumber(value, {
      locale: str(options.locale) ?? locale,
      digits: num(options.digits),
      intl: options.intl as Intl.NumberFormatOptions | undefined,
    });
    if (text === undefined) return empty;
    const unit = str(options.unit);
    return (
      <>
        {text}
        {unit && <span className={styles.unit}>{unit}</span>}
      </>
    );
  };

  const bytes: CellRenderer<TRow> = ({ value, options }) =>
    formatBytes(value, { locale: str(options.locale) ?? locale, digits: num(options.digits) }) ??
    empty;

  const duration: CellRenderer<TRow> = ({ value }) => formatDuration(value) ?? empty;

  const boolean: CellRenderer<TRow> = ({ value, options }) =>
    value ? (str(options.yes) ?? 'Yes') : (str(options.no) ?? empty);

  const timestamp: CellRenderer<TRow> = ({ value, options }) => {
    const date = toDate(value);
    if (!date) return empty;
    const fmt = {
      locale: str(options.locale) ?? locale,
      timeZone: str(options.timeZone) ?? timeZone,
      time: options.time as Intl.DateTimeFormatOptions | undefined,
      date: options.date as Intl.DateTimeFormatOptions | undefined,
    };
    const primary = options.primary === 'date' ? formatDate(date, fmt) : formatTime(date, fmt);
    const secondary =
      options.secondary === 'none'
        ? undefined
        : options.secondary === 'relative' || options.relative === true
          ? formatRelative(date, { locale: fmt.locale, now: now() })
          : options.primary === 'date'
            ? formatTime(date, fmt)
            : formatDate(date, fmt);
    return (
      <span className={styles.stack} data-ui='cell-timestamp'>
        <time dateTime={date.toISOString()} data-emphasis={options.bold ? 'high' : undefined}>
          {primary}
        </time>
        {secondary !== undefined && <span>{secondary}</span>}
      </span>
    );
  };

  const multiline: CellRenderer<TRow> = ({ row, options }) => {
    const lines = Array.isArray(options.lines)
      ? (options.lines as Array<{ accessor: string; emphasis?: string; prefix?: string }>)
      : [];
    return (
      <span className={styles.stack} data-ui='cell-multiline'>
        {lines.map((line) => {
          const value = resolvePath(row.original, line.accessor);
          return (
            <span key={line.accessor} data-emphasis={line.emphasis}>
              {line.prefix}
              {isEmpty(value) ? placeholder : String(value)}
            </span>
          );
        })}
      </span>
    );
  };

  const status: CellRenderer<TRow> = ({ value, options }) => {
    if (isEmpty(value)) return empty;
    const key = String(value);
    const tones = (options.tones as Record<string, Tone> | undefined) ?? {};
    const labels = (options.labels as Record<string, string> | undefined) ?? {};
    const tone = tones[key] ?? 'neutral';
    const variant = options.variant === 'badge' ? 'badge' : 'dot';
    return (
      <span className={styles.status} data-ui='cell-status' data-tone={tone} data-variant={variant}>
        <span className={styles.statusDot} aria-hidden='true' />
        <span className={styles.statusLabel}>{labels[key] ?? key}</span>
      </span>
    );
  };

  const thumbnail: CellRenderer<TRow> = ({ value, row, options }) => {
    const width = num(options.width) ?? 64;
    const height = num(options.height) ?? 36;
    const vars = { '--_width': `${width}px`, '--_height': `${height}px` } as React.CSSProperties;
    if (isEmpty(value)) {
      return <span className={styles.thumbnailPlaceholder} style={vars} aria-hidden='true' />;
    }
    const altAccessor = str(options.altAccessor);
    const alt = altAccessor ? String(resolvePath(row.original, altAccessor) ?? '') : '';
    return (
      <img
        className={styles.thumbnail}
        data-ui='cell-thumbnail'
        src={String(value)}
        alt={alt}
        width={width}
        height={height}
        loading='lazy'
        style={vars}
      />
    );
  };

  const link: CellRenderer<TRow> = ({ value, row, column, options, emit }) => {
    if (isEmpty(value)) return empty;
    const label = String(value);
    const template = str(options.href);
    const href = template
      ? fillTemplate(template, (path) => resolvePath(row.original, path))
      : undefined;
    if (href) {
      return (
        <a className={styles.link} data-ui='cell-link' href={href} target={str(options.target)}>
          {label}
        </a>
      );
    }
    // No URL: the screen navigates (e.g. through its router) via onCellAction.
    return (
      <button
        type='button'
        className={styles.link}
        data-ui='cell-link'
        onClick={() => emit(str(options.action) ?? `navigate:${column.id}`)}
      >
        {label}
      </button>
    );
  };

  type ActionSpec = {
    id: string;
    label: string;
    icon?: string;
    design?: 'default' | 'danger';
    /** Hide the label visually and expose it as the accessible name. */
    iconOnly?: boolean;
    enabledWhen?: Condition;
    visibleWhen?: Condition;
  };

  const actions: CellRenderer<TRow> = ({ row, options, emit }) => {
    const specs = Array.isArray(options.actions) ? (options.actions as ActionSpec[]) : [];
    return (
      <span className={styles.actions} data-ui='cell-actions'>
        {specs
          .filter((spec) => evaluateCondition(spec.visibleWhen, row.original))
          .map((spec) => {
            const enabled = evaluateCondition(spec.enabledWhen, row.original);
            const glyph = icon(spec.icon);
            return (
              <button
                key={spec.id}
                type='button'
                className={styles.action}
                data-action={spec.id}
                data-design={spec.design}
                disabled={!enabled}
                aria-label={spec.iconOnly ? spec.label : undefined}
                title={spec.iconOnly ? spec.label : undefined}
                onClick={() => emit(spec.id)}
              >
                {glyph && <span className={styles.actionIcon}>{glyph}</span>}
                {!spec.iconOnly && spec.label}
              </button>
            );
          })}
      </span>
    );
  };

  const toggle: CellRenderer<TRow> = ({ value, row, column, options, emit }) => {
    const enabled = evaluateCondition(options.enabledWhen as Condition | undefined, row.original);
    return (
      <input
        type='checkbox'
        role='switch'
        aria-checked={Boolean(value)}
        className={styles.switch}
        data-ui='cell-switch'
        checked={Boolean(value)}
        disabled={!enabled}
        aria-label={str(options.label) ?? column.header}
        onChange={(event) => emit(str(options.action) ?? 'switch', event.currentTarget.checked)}
      />
    );
  };

  const progress: CellRenderer<TRow> = ({ value, row, options }) => {
    if (isEmpty(value)) return empty;
    const n = Number(value);
    const maxAccessor = str(options.maxAccessor);
    const max = maxAccessor
      ? Number(resolvePath(row.original, maxAccessor))
      : (num(options.max) ?? 100);
    const ratio = max > 0 ? Math.min(1, Math.max(0, n / max)) : 0;
    const percent = Math.round(ratio * 100);
    const thresholds = Array.isArray(options.thresholds)
      ? (options.thresholds as Array<{ from: number; tone: Tone }>)
      : [];
    const tone = [...thresholds]
      .sort((a, b) => b.from - a.from)
      .find((t) => percent >= t.from)?.tone;
    const showValue = bool(options.showValue) ?? true;
    const unit = str(options.unit) ?? '%';
    const valueText =
      options.valueFormat === 'raw'
        ? `${formatNumber(n, { locale, digits: num(options.digits) })}${unit}`
        : `${percent}%`;
    return (
      <span className={styles.progress} data-ui='cell-progress' data-tone={tone}>
        <span
          className={styles.progressTrack}
          role='progressbar'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={str(options.label)}
        >
          <span className={styles.progressFill} style={{ width: `${percent}%` }} />
        </span>
        {showValue && <span className={styles.progressValue}>{valueText}</span>}
      </span>
    );
  };

  const truncate: CellRenderer<TRow> = ({ value, options }) => {
    if (isEmpty(value)) return empty;
    const text = String(value);
    const maxWidth = str(options.maxWidth);
    return (
      <span
        className={styles.truncate}
        data-ui='cell-truncate'
        title={text}
        style={maxWidth ? ({ '--_max-width': maxWidth } as React.CSSProperties) : undefined}
      >
        {text}
      </span>
    );
  };

  const iconCell: CellRenderer<TRow> = ({ value, options }) => {
    if (isEmpty(value)) return empty;
    const name = String(value);
    const map = (options.icons as Record<string, string> | undefined) ?? {};
    const glyph = icon(map[name] ?? name);
    const labels = (options.labels as Record<string, string> | undefined) ?? {};
    return (
      <span
        className={styles.icon}
        data-ui='cell-icon'
        data-icon={name}
        title={labels[name] ?? name}
      >
        {glyph ?? <span className={styles.placeholder}>{name}</span>}
      </span>
    );
  };

  return {
    text: textCell as CellRenderer<TRow>,
    composite: compositeCell as CellRenderer<TRow>,
    number,
    bytes,
    duration,
    boolean,
    timestamp,
    multiline,
    status,
    thumbnail,
    link,
    actions,
    switch: toggle,
    progress,
    truncate,
    icon: iconCell,
  };
}

/** Convenience: the standard set with default configuration. */
export const standardCells: CellRenderers = createTableCells();

export type { CellContext };
