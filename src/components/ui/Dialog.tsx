import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import "./Dialog.css";

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}

export function Dialog({
  open,
  title,
  description,
  children,
  actions,
  onClose,
  size = "md",
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) return;
    function trackFocus(event: FocusEvent) {
      if (event.target instanceof HTMLElement) previousFocus.current = event.target;
    }
    document.addEventListener("focusin", trackFocus);
    return () => document.removeEventListener("focusin", trackFocus);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnFocus =
      activeElement &&
      activeElement !== document.body &&
      !panelRef.current?.contains(activeElement)
        ? activeElement
        : previousFocus.current;
    const initialControl =
      panelRef.current?.querySelector<HTMLElement>("[autofocus]") ??
      panelRef.current?.querySelector<HTMLElement>("input:not(:disabled), select:not(:disabled), textarea:not(:disabled)") ??
      panelRef.current?.querySelector<HTMLElement>("button:not(:disabled), a[href]");
    initialControl?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]"),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
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
      returnFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="doka-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className={`doka-dialog doka-dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doka-dialog-title"
      >
        <header className="doka-dialog__header">
          <div>
            <h2 id="doka-dialog-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" aria-label="Fechar diálogo" onClick={onClose}>×</Button>
        </header>
        <div className="doka-dialog__body">{children}</div>
        {actions ? <footer className="doka-dialog__actions">{actions}</footer> : null}
      </div>
    </div>
  );
}
