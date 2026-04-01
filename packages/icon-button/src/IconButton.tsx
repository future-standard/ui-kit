import { Button, type ButtonProps } from "@future-standard-ui/button";
import type { ReactElement } from "react";
import styles from "./IconButton.module.css";

export type IconButtonProps = Omit<ButtonProps, "children"> & {
  icon: ReactElement;
  "aria-label": string;
};

export function IconButton({ icon, className, ref, ...props }: IconButtonProps) {
  const classes = [styles.iconButton, className].filter(Boolean).join(" ");

  return (
    <Button ref={ref} className={classes} {...props}>
      {icon}
    </Button>
  );
}
