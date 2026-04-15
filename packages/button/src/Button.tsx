import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.css';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ variant = 'primary', className, ref, ...props }: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');

  return <button ref={ref} className={classes} {...props} />;
}
