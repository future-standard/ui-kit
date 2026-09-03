import { DataTable, type TableSchema } from '@future-standard-ui/table';
import { useEffect, useRef, useState } from 'react';
import { type Camera, cameras } from '../table/data';
import { mountTable, type VanillaCellRenderer } from './mountTable';

const schema: TableSchema = {
  id: 'cameras-vanilla',
  rowKey: 'id',
  columns: [
    {
      id: 'name',
      header: 'Camera',
      sortable: true,
      emphasis: 'high',
      pin: 'start',
      width: '160px',
    },
    { id: 'status', header: 'Status', cell: { type: 'status' }, sortable: true, width: '130px' },
    { id: 'route', header: 'Route', accessor: 'location.route', group: 'Location', width: '90px' },
    { id: 'office', header: 'Office', accessor: 'location.office', group: 'Location' },
    {
      id: 'clips',
      header: 'Clips',
      accessor: 'counts.clips',
      align: 'end',
      sortable: true,
      width: '90px',
    },
    {
      id: 'snapshots',
      header: 'Snapshots',
      accessor: 'counts.snapshots',
      align: 'end',
      visibleFrom: 'md',
      width: '110px',
    },
  ],
  features: { selection: 'multiple', expandable: true, zebra: true, density: 'compact' },
};

const data = cameras.slice(0, 8);

/** Vanilla renderers return DOM nodes or strings; the signature otherwise mirrors React's. */
const vanillaCells: Record<string, VanillaCellRenderer<Camera>> = {
  status: ({ value }) => {
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:8px;text-transform:capitalize';
    const dot = document.createElement('span');
    const tone = { online: 'var(--success)', degraded: 'var(--warning)', offline: 'var(--error)' }[
      String(value)
    ];
    dot.style.cssText = `width:8px;height:8px;border-radius:999px;background:${tone}`;
    dot.setAttribute('aria-hidden', 'true');
    wrap.append(dot, String(value));
    return wrap;
  },
};

const reactCells = {
  status: ({ value }: { value: unknown }) => (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textTransform: 'capitalize' }}
    >
      <span
        aria-hidden='true'
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: {
            online: 'var(--success)',
            degraded: 'var(--warning)',
            offline: 'var(--error)',
          }[String(value)],
        }}
      />
      {String(value)}
    </span>
  ),
};

/** Every contract attribute on every part, in document order, for both renderers. */
function contractSignature(root: Element): string[] {
  return [...root.querySelectorAll('[data-ui]')].map((node) => {
    const attrs = [...node.attributes]
      .filter(
        (a) =>
          a.name.startsWith('data-') ||
          a.name.startsWith('aria-') ||
          a.name === 'scope' ||
          a.name === 'colspan'
      )
      .map((a) => `${a.name}=${a.value}`)
      .sort();
    return `${node.tagName.toLowerCase()} ${attrs.join(' ')}`;
  });
}

/**
 * The same schema and data rendered twice: once by React `DataTable`, once by a plain-DOM
 * renderer that only knows `table-core`. Both read the CSS module from the core. Interact with
 * either; then compare the DOM contract they emit.
 */
export function VanillaExample() {
  const vanillaHost = useRef<HTMLDivElement>(null);
  const reactHost = useRef<HTMLDivElement>(null);
  const [parity, setParity] = useState<{ ok: boolean; count: number; diff: string[] } | null>(null);

  useEffect(() => {
    if (!vanillaHost.current) return;
    const mounted = mountTable<Camera>(vanillaHost.current, {
      schema,
      data,
      clientSorting: true,
      cells: vanillaCells,
      slots: { empty: 'No cameras.' },
    });
    return () => mounted.destroy();
  }, []);

  const compare = () => {
    const a = contractSignature(vanillaHost.current as Element);
    const b = contractSignature(reactHost.current as Element);
    const diff: string[] = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i += 1) {
      if (a[i] !== b[i])
        diff.push(`#${i}\n  vanilla: ${a[i] ?? '(none)'}\n  react:   ${b[i] ?? '(none)'}`);
    }
    setParity({ ok: diff.length === 0 && a.length === b.length, count: a.length, diff });
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section>
        <h3 style={{ margin: '0 0 8px' }}>Vanilla DOM (table-core only)</h3>
        <div ref={vanillaHost} />
      </section>
      <section>
        <h3 style={{ margin: '0 0 8px' }}>React (DataTable)</h3>
        <div ref={reactHost}>
          <DataTable<Camera>
            schema={schema}
            data={data}
            clientSorting
            cells={reactCells}
            slots={{ empty: 'No cameras.' }}
          />
        </div>
      </section>
      <section style={{ display: 'grid', gap: 8 }}>
        <button type='button' onClick={compare} style={{ justifySelf: 'start', font: 'inherit' }}>
          Compare DOM contracts
        </button>
        {parity && (
          <output style={{ fontFamily: 'var(--font-data)' }}>
            {parity.ok
              ? `✓ Identical: ${parity.count} contract parts emit the same attributes.`
              : `✗ ${parity.diff.length} differences:`}
            {!parity.ok && <pre style={{ fontSize: 12 }}>{parity.diff.join('\n')}</pre>}
          </output>
        )}
      </section>
    </div>
  );
}
