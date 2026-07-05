import { useEffect, useRef, useState, type ReactNode } from "react";
import "./DropdownMenu.css";

export function DropdownMenu({
  label = "Mais ações",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="doka-dropdown" ref={rootRef}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      {open ? (
        <div className="doka-dropdown__menu" role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownMenuItem({
  danger = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button type="button" role="menuitem" className={danger ? "is-danger" : ""} {...props}>
      {children}
    </button>
  );
}
