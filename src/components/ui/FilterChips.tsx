import "./FilterChips.css";

export interface FilterChip {
  id: string;
  label: string;
}

export function FilterChips({
  items,
  onRemove,
  onClear,
}: {
  items: FilterChip[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="doka-filter-chips" aria-label="Filtros aplicados">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onRemove(item.id)}>
          {item.label}
          <span aria-hidden="true"> ×</span>
        </button>
      ))}
      <button className="doka-filter-chips__clear" type="button" onClick={onClear}>
        Limpar tudo
      </button>
    </div>
  );
}
