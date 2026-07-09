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
  function moveFocus(index: number, currentTarget: HTMLButtonElement) {
    const next = items.at(index);
    if (!next) return;
    onChange(next.id);
    const tabs = Array.from(
      currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    tabs[index]?.focus();
  }

  return (
    <div className={`doka-tabs doka-tabs--${variant}`} role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          tabIndex={item.id === value ? 0 : -1}
          className="doka-tabs__tab"
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              moveFocus((index + 1) % items.length, event.currentTarget);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              moveFocus((index - 1 + items.length) % items.length, event.currentTarget);
            } else if (event.key === "Home") {
              event.preventDefault();
              moveFocus(0, event.currentTarget);
            } else if (event.key === "End") {
              event.preventDefault();
              moveFocus(items.length - 1, event.currentTarget);
            }
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
