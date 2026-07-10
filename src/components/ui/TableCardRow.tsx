import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import "./TableCardRow.css";

export type SortDirection = "asc" | "desc";

export interface TableCardColumn {
  key: string;
  label: string;
  value: ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

export interface TableCardHeaderColumn {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  active?: boolean;
  direction?: SortDirection;
  onSort?: () => void;
}

export function SortableHeaderButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active?: boolean;
  direction?: SortDirection;
  onClick: () => void;
}) {
  const Icon = active ? (direction === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button type="button" className="doka-card-list__sort" onClick={onClick}>
      <span>{label}</span>
      <Icon aria-hidden="true" size={13} />
    </button>
  );
}

function template(columns: Array<{ width?: string }>, selectable: boolean, actions: boolean) {
  return [
    selectable ? "34px" : "",
    ...columns.map((column) => column.width ?? "minmax(0, 1fr)"),
    actions ? "42px" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function TableCardHeader({
  columns,
  selectable = true,
  actions = true,
  allSelected = false,
  someSelected = false,
  onToggleAll,
}: {
  columns: TableCardHeaderColumn[];
  selectable?: boolean;
  actions?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleAll?: () => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = !allSelected && someSelected;
    }
  }, [allSelected, someSelected]);

  return (
    <div
      className="doka-card-list__header"
      style={{ gridTemplateColumns: template(columns, selectable, actions) }}
    >
      {selectable ? (
        <input
          ref={checkboxRef}
          type="checkbox"
          aria-label="Selecionar todas as linhas"
          checked={allSelected}
          onChange={onToggleAll}
        />
      ) : null}
      {columns.map((column) => (
        <div
          key={column.key}
          className={[
            "doka-card-list__header-cell",
            column.align ? `doka-card-list__cell--${column.align}` : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-sort={
            column.sortable
              ? column.active
                ? column.direction === "asc"
                  ? "ascending"
                  : "descending"
                : "none"
              : undefined
          }
        >
          {column.sortable && column.onSort ? (
            <SortableHeaderButton
              label={column.label}
              active={column.active}
              direction={column.direction}
              onClick={column.onSort}
            />
          ) : (
            column.label
          )}
        </div>
      ))}
      {actions ? <span aria-hidden="true" /> : null}
    </div>
  );
}

export function TableCardRow({
  id,
  columns,
  selected = false,
  selectable = true,
  highlighted = false,
  actions,
  onToggleSelect,
}: {
  id: string;
  columns: TableCardColumn[];
  selected?: boolean;
  selectable?: boolean;
  highlighted?: boolean;
  actions?: ReactNode;
  onToggleSelect?: (id: string) => void;
}) {
  // Navegação de linha acontece via <Link> acessível dentro das células —
  // não há linha-inteira clicável (um onClick em <article> seria inacessível
  // por teclado sem role/tabIndex/onKeyDown).
  return (
    <article
      className={[
        "doka-card-row",
        selected ? "doka-card-row--selected" : "",
        highlighted ? "doka-card-row--highlighted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ gridTemplateColumns: template(columns, selectable, Boolean(actions)) }}
    >
      {selectable ? (
        <div className="doka-card-row__select" onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            aria-label="Selecionar linha"
            checked={selected}
            onChange={() => onToggleSelect?.(id)}
          />
        </div>
      ) : null}
      {columns.map((column) => (
        <div
          key={column.key}
          className={[
            "doka-card-row__cell",
            column.align ? `doka-card-list__cell--${column.align}` : "",
            column.className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-label={column.label}
        >
          {column.value}
        </div>
      ))}
      {actions ? (
        <div className="doka-card-row__actions" onClick={(event) => event.stopPropagation()}>
          {actions}
        </div>
      ) : null}
    </article>
  );
}

export function TableCardList({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={["doka-card-list", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
