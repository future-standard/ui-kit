import { IconButton } from '@future-standard-ui/icon-button';
import { useThemeToggle } from '@future-standard-ui/theme';
import { useEffect, useState } from 'react';
import { ButtonsExample } from './examples/ButtonsExample';
import { CamerasExample } from './examples/table/CamerasExample';
import { ClipsExample } from './examples/table/ClipsExample';
import { PrimitivesExample } from './examples/table/PrimitivesExample';
import { ResponsiveExample } from './examples/table/ResponsiveExample';
import { VanillaExample } from './examples/table-vanilla/VanillaExample';

const MoonIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='currentColor'
    role='img'
    aria-label='Dark mode'
  >
    <path d='M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z' />
  </svg>
);

const SunIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='currentColor'
    role='img'
    aria-label='Light mode'
  >
    <path d='M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z' />
  </svg>
);

/** Example pages, addressed by URL hash so they can be linked and screenshotted. */
const pages = [
  { id: 'buttons', title: 'Buttons', render: () => <ButtonsExample /> },
  {
    id: 'table-cameras',
    title: 'Table — schema-driven',
    intro:
      'Uncontrolled, client-sorted. Every visible behaviour comes from the JSON schema below the table; resize the window to see columns appear at the md / lg / xl container breakpoints.',
    render: () => <CamerasExample />,
  },
  {
    id: 'table-clips',
    title: 'Table — controlled, server-sorted',
    intro:
      'The mlit-cctv list-screen pattern: the screen owns sorting and selection, a fake server sorts with latency, and the table only reports changes.',
    render: () => <ClipsExample />,
  },
  {
    id: 'table-responsive',
    title: 'Table — responsive',
    intro:
      'Pinned start/end columns with schema-derived offsets, ingress/egress collapsing into one composite column below the lg breakpoint, and a header that sticks to the table or to the page.',
    render: () => <ResponsiveExample />,
  },
  {
    id: 'table-vanilla',
    title: 'Table — vanilla DOM',
    intro:
      'The same schema rendered by React and by a plain-DOM renderer that imports only table-core. Sort, select and expand either; then compare the DOM contract both emit.',
    render: () => <VanillaExample />,
  },
  {
    id: 'table-primitives',
    title: 'Table — primitives',
    intro: 'Hand-composed with Table.Root / Head / Body / Row: one header, one body per office.',
    render: () => <PrimitivesExample />,
  },
];

const readHash = () => window.location.hash.replace(/^#\/?/, '') || pages[0].id;

export function App() {
  const { isDarkThemeEnabled, onThemeToggle } = useThemeToggle();
  const [pageId, setPageId] = useState(readHash);

  useEffect(() => {
    const onHashChange = () => setPageId(readHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const page = pages.find((p) => p.id === pageId) ?? pages[0];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>@future-standard-ui</h1>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {pages.map((p) => (
            <a
              key={p.id}
              href={`#/${p.id}`}
              style={{ fontWeight: p.id === page.id ? 700 : 400, color: 'inherit' }}
            >
              {p.title}
            </a>
          ))}
        </nav>
        <IconButton
          icon={isDarkThemeEnabled ? <SunIcon /> : <MoonIcon />}
          aria-label={isDarkThemeEnabled ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onThemeToggle}
        />
      </header>

      <h2 style={{ marginTop: 0 }}>{page.title}</h2>
      {page.intro && <p style={{ opacity: 0.75, marginTop: -8 }}>{page.intro}</p>}
      {page.render()}
    </div>
  );
}
