import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import type { DashboardFilters, DashboardPosto } from "../types";

interface DashboardFiltersFormProps {
  value: DashboardFilters;
  postos: DashboardPosto[];
  disabled?: boolean;
  onChange: (filters: DashboardFilters) => void;
}

export function DashboardFiltersForm({
  value,
  postos,
  disabled = false,
  onChange,
}: DashboardFiltersFormProps) {
  const [draft, setDraft] = useState<DashboardFilters>(value);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({
      inicio: draft.inicio,
      fim: draft.fim,
      postoId: draft.postoId || null,
    });
  }

  return (
    <form className="dashboard-filters" onSubmit={submit}>
      <DatePickerField
        label="Data inicial"
        value={draft.inicio}
        onChange={(next) => setDraft({ ...draft, inicio: next })}
        disabled={disabled}
        required
      />
      <DatePickerField
        label="Data final"
        value={draft.fim}
        onChange={(next) => setDraft({ ...draft, fim: next })}
        disabled={disabled}
        required
      />
      <FormSelect
        label="Posto"
        value={draft.postoId ?? ""}
        onChange={(next) => setDraft({ ...draft, postoId: next || null })}
        disabled={disabled}
        options={[
          { value: "", label: "Todos os postos permitidos" },
          ...postos.map((posto) => ({
            value: posto.id,
            label: `${posto.codigo ? `${posto.codigo} — ` : ""}${posto.nome}`,
          })),
        ]}
      />
      <Button type="submit" disabled={disabled}>
        Aplicar filtros
      </Button>
    </form>
  );
}
