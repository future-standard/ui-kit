import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.css';

export type ButtonDesign = 'primary' | 'secondary' | 'warning' | 'danger' | 'text-only' | 'outline';

export type ButtonSize = 'xsmall' | 'small' | 'normal' | 'large';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  /** Theme design driven by the central theme via `data-design`. */
  design?: ButtonDesign;
  /** Size scale owned by the component via `data-size`. */
  size?: ButtonSize;
  /** Adds the elevated drop/inner shadow treatment. */
  shadow?: boolean;
  /** Removes horizontal padding (e.g. icon-only). */
  noPadding?: boolean;
  /** Marks the button busy; also disables it. */
  loading?: boolean;
};

export function Button({
  design = 'primary',
  size = 'normal',
  shadow = false,
  noPadding = false,
  loading = false,
  disabled,
  type = 'button',
  className,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      // Stable, un-hashed hook for targeted consumer overrides.
      data-ui='button'
      // Theme-driven design — selected in the theme package via [data-design].
      data-design={design}
      // Component-owned size scale.
      data-size={size}
      // Booleans as presence attributes (omitted when false).
      data-shadow={shadow || undefined}
      data-no-padding={noPadding || undefined}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      className={[styles.button, className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
