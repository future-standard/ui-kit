import { Button } from "@future-standard/button";
import { type ComponentPropsWithRef, forwardRef } from "react";
import styles from "./LoadingButton.module.css";

export type LoadingButtonProps = ComponentPropsWithRef<typeof Button> & {
  loading?: boolean;
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton({ loading = false, disabled, children, className, ...props }, ref) {
    const classes = [loading ? styles.loading : "", className].filter(Boolean).join(" ");

    return (
      <Button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </Button>
    );
  }
);
