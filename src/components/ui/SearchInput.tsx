import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import "./SearchInput.css";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  label = "Buscar",
  debounceMs = 250,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => onChange(draft), debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, draft, onChange, value]);

  return (
    <label className="doka-search-input">
      <span className="sr-only">{label}</span>
      <Icon name="search" size={18} />
      <input
        type="search"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
      />
      {draft ? (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
        >
          ×
        </button>
      ) : null}
    </label>
  );
}
