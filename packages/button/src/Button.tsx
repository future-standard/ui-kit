import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.css';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ variant = 'primary', className, ref, ...props }: ButtonProps) {
  const designClass = variant === 'secondary' ? 'button-design-secondary' : undefined;
  const classes = [styles.button, designClass, className].filter(Boolean).join(' ');

  return <button ref={ref} className={classes} {...props} />;
}
