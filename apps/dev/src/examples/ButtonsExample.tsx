import { Button } from '@future-standard-ui/button';
import { IconButton } from '@future-standard-ui/icon-button';
import { LoadingButton } from '@future-standard-ui/loading-button';
import { useState } from 'react';

const StarIcon = () => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor' role='img' aria-label='Star'>
    <path d='M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z' />
  </svg>
);

export function ButtonsExample() {
  const [loading, setLoading] = useState(false);

  function handleLoadingClick() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <>
      <Section title='Button — designs'>
        <Button design='primary'>Primary</Button>
        <Button design='secondary'>Secondary</Button>
        <Button design='warning'>Warning</Button>
        <Button design='danger'>Danger</Button>
        <Button design='outline'>Outline</Button>
        <Button design='text-only'>Text only</Button>
      </Section>

      <Section title='Button — sizes'>
        <Button size='xsmall'>XSmall</Button>
        <Button size='small'>Small</Button>
        <Button size='normal'>Normal</Button>
        <Button size='large'>Large</Button>
      </Section>

      <Section title='Button — flags'>
        <Button shadow>Shadow</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button design='secondary' shadow size='large'>
          Composed
        </Button>
      </Section>

      <Section title='Button — layer override (green + custom --_height)'>
        <Button>Default</Button>
        <Button className='demo-green-lg'>Overridden</Button>
      </Section>

      <Section title='LoadingButton'>
        <LoadingButton loading={loading} onClick={handleLoadingClick}>
          {loading ? 'Submitting...' : 'Submit'}
        </LoadingButton>
      </Section>

      <Section title='IconButton'>
        <IconButton icon={<StarIcon />} aria-label='Favorite' />
        <IconButton icon={<StarIcon />} aria-label='Favorite' design='secondary' />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{title}</h3>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>{children}</div>
    </section>
  );
}
