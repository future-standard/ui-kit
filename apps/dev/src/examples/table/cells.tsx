import type { CellRenderers } from '@future-standard-ui/table';

/**
 * Example cell renderers. The production set lands in `@future-standard-ui/table-cells`
 * (Phase 6); these show the shape a project-specific renderer takes.
 */

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

export const exampleCells: CellRenderers<unknown> = {
  timestamp: ({ value, options }) => {
    if (!value) return <span style={{ opacity: 0.5 }}>—</span>;
    const iso = String(value);
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontWeight: options.boldTime ? 700 : 500 }}>
          {new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ fontSize: '0.85em', opacity: 0.7 }}>
          {options.relative ? relative(iso) : new Date(iso).toLocaleDateString('ja-JP')}
        </span>
      </span>
    );
  },

  number: ({ value, options }) => {
    if (value === null || value === undefined) return <span style={{ opacity: 0.5 }}>—</span>;
    const n = Number(value);
    const formatted = options.digits !== undefined ? n.toFixed(Number(options.digits)) : String(n);
    return (
      <>
        {formatted}
        {options.unit ? (
          <span
            style={{ fontSize: '0.85em', fontStyle: 'italic', opacity: 0.7, marginInlineStart: 4 }}
          >
            {String(options.unit)}
          </span>
        ) : null}
      </>
    );
  },

  bytes: ({ value }) => {
    const n = Number(value);
    if (!n) return <span style={{ opacity: 0.5 }}>—</span>;
    return `${(n / 1_000_000).toFixed(1)} MB`;
  },

  duration: ({ value }) => {
    if (value === null || value === undefined) return <span style={{ opacity: 0.5 }}>—</span>;
    const total = Number(value);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  status: ({ value }) => {
    const tone: Record<string, string> = {
      online: 'var(--success)',
      degraded: 'var(--warning)',
      offline: 'var(--error)',
      completed: 'var(--success)',
      processing: 'var(--info)',
      failed: 'var(--error)',
    };
    const text = String(value);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-hidden='true'
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: tone[text] ?? 'var(--neutral)',
            boxShadow: `0 0 0 3px color-mix(in srgb, ${tone[text] ?? 'var(--neutral)'} 25%, transparent)`,
          }}
        />
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      </span>
    );
  },

  boolean: ({ value, options }) =>
    value ? String(options.yes ?? 'Yes') : String(options.no ?? '—'),

  thumbnail: ({ value }) =>
    value ? (
      <img
        src={String(value)}
        alt=''
        width={64}
        height={36}
        style={{ display: 'block', borderRadius: 3, objectFit: 'cover' }}
      />
    ) : (
      <span
        aria-hidden='true'
        style={{
          display: 'block',
          width: 64,
          height: 36,
          borderRadius: 3,
          background: 'var(--grey-4)',
        }}
      />
    ),
};
