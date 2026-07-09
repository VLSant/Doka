import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import type { ButtonSize, ButtonVariant } from "./Button";
import "./Button.css";

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function ButtonLink({
  children,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={[
        "doka-button",
        `doka-button--${variant}`,
        `doka-button--${size}`,
        fullWidth ? "doka-button--full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {leftIcon}
      <span className="doka-button__label">{children}</span>
      {rightIcon}
    </Link>
  );
}
