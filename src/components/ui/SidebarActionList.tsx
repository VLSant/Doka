import type { ReactNode } from "react";
import "./SidebarActionList.css";

export interface SidebarActionItem {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "destructive";
  onClick?: () => void;
}

export function SidebarActionList({
  title = "Acoes em lote",
  summary,
  items,
  onClear,
}: {
  title?: string;
  summary: ReactNode;
  items: SidebarActionItem[];
  onClear?: () => void;
}) {
  return (
    <aside className="doka-sidebar-actions" aria-label={title}>
      <header>
        <span>{title}</span>
        {onClear ? (
          <button type="button" onClick={onClear}>
            Limpar
          </button>
        ) : null}
      </header>
      <div className="doka-sidebar-actions__summary">{summary}</div>
      <div className="doka-sidebar-actions__items">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            className={item.variant === "destructive" ? "is-destructive" : ""}
            onClick={item.onClick}
          >
            {item.icon ?? <span className="doka-sidebar-actions__dot" aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
