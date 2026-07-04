import type { ReactNode } from "react";
import "./Tabs.css";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  variant?: "underline" | "segmented";
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  variant = "underline",
}: TabsProps<T>) {
  return (
    <div className={`doka-tabs doka-tabs--${variant}`} role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          className="doka-tabs__tab"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
