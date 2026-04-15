import { Button } from '@future-standard-ui/button';
import type { ComponentPropsWithRef } from 'react';
import styles from './LoadingButton.module.css';

export type LoadingButtonProps = ComponentPropsWithRef<typeof Button> & {
  loading?: boolean;
};

export function LoadingButton({
  loading = false,
  disabled,
  children,
  className,
  ref,
  ...props
}: LoadingButtonProps) {
  const classes = [loading ? styles.loading : '', className].filter(Boolean).join(' ');

  return (
    <Button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className={styles.spinner} aria-hidden='true' />}
      {children}
    </Button>
  );
}
