import { Button, type ButtonProps } from "@future-standard/button";
import { type ReactElement, forwardRef } from "react";
import styles from "./IconButton.module.css";

export type IconButtonProps = Omit<ButtonProps, "children"> & {
  icon: ReactElement;
  "aria-label": string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, className, ...props },
  ref
) {
  const classes = [styles.iconButton, className].filter(Boolean).join(" ");

  return (
    <Button ref={ref} className={classes} {...props}>
      {icon}
    </Button>
  );
});
