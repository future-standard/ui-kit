import { Button } from '@future-standard-ui/button';
import { IconButton } from '@future-standard-ui/icon-button';
import { LoadingButton } from '@future-standard-ui/loading-button';
import '@future-standard-ui/theme/style.css';
import { useThemeToggle } from '@future-standard-ui/theme/hooks';
import { useState } from 'react';

const StarIcon = () => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor' role='img' aria-label='Star'>
    <path d='M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z' />
  </svg>
);

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

export function App() {
  const [loading, setLoading] = useState(false);
  const { isDarkThemeEnabled, onThemeToggle } = useThemeToggle();

  function handleLoadingClick() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0 }}>@future-standard-ui UI Kit</h1>
        <IconButton
          icon={isDarkThemeEnabled ? <SunIcon /> : <MoonIcon />}
          aria-label={isDarkThemeEnabled ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onThemeToggle}
        />
      </div>

      <Section title='Button'>
        <Button variant='primary'>Primary</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title='LoadingButton'>
        <LoadingButton loading={loading} onClick={handleLoadingClick}>
          {loading ? 'Submitting...' : 'Submit'}
        </LoadingButton>
      </Section>

      <Section title='IconButton'>
        <IconButton icon={<StarIcon />} aria-label='Favorite' />
        <IconButton icon={<StarIcon />} aria-label='Favorite' variant='secondary' />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{title}</h2>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>{children}</div>
    </section>
  );
}
