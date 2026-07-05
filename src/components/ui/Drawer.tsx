import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import "./Drawer.css";

export interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: "md" | "lg" | "xl";
}

export function Drawer({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "md",
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.classList.add("doka-overlay-open");
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();

    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
        ),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.classList.remove("doka-overlay-open");
      returnFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="doka-drawer-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        ref={panelRef}
        className={`doka-drawer doka-drawer--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="doka-drawer__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" aria-label="Fechar painel" onClick={onClose}>
            ×
          </Button>
        </header>
        <div className="doka-drawer__body">{children}</div>
        {footer ? <footer className="doka-drawer__footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}
