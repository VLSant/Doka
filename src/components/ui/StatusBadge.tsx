import type { HTMLAttributes } from "react";
import "./StatusBadge.css";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export function StatusBadge({ tone = "neutral", className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={["doka-status-badge", `doka-status-badge--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
