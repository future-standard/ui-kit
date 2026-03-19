import { type ComponentPropsWithRef, forwardRef } from "react";
import styles from "./Button.module.css";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, ...props },
  ref
) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");

  return <button ref={ref} className={classes} {...props} />;
});
