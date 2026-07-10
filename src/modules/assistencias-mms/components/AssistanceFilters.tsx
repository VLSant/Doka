import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import type { AssistanceFilters } from "../types";

export function AssistanceFiltersForm({
  value,
  disabled,
  onChange,
}: {
  value: AssistanceFilters;
  disabled?: boolean;
  onChange: (filters: AssistanceFilters) => void;
}) {
  const [draft, setDraft] = useState(value);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({
      ...draft,
      situacao: draft.situacao ?? "ativo",
    });
  }

  const update = (key: keyof AssistanceFilters, next: string) =>
    setDraft((current) => ({ ...current, [key]: next || undefined }));

  return (
    <form className="assistance-filters" aria-label="Filtros de assistências MMS" onSubmit={submit}>
      <Input
        label="Número da assistência"
        name="numero_assistencia"
        value={draft.numero_assistencia ?? ""}
        onChange={(event) => update("numero_assistencia", event.target.value)}
      />
      <Input
        label="Cliente"
        name="cliente"
        value={draft.cliente ?? ""}
        onChange={(event) => update("cliente", event.target.value)}
      />
      <Input
        label="Posto"
        name="posto_id"
        value={draft.posto_id ?? ""}
        onChange={(event) => update("posto_id", event.target.value)}
        placeholder="Identificador do posto"
      />
      <DatePickerField
        label="Data inicial"
        name="data_de"
        value={draft.data_de ?? ""}
        onChange={(next) => update("data_de", next)}
      />
      <DatePickerField
        label="Data final"
        name="data_ate"
        value={draft.data_ate ?? ""}
        onChange={(next) => update("data_ate", next)}
      />
      <Input
        label="Status"
        name="status"
        value={draft.status ?? ""}
        onChange={(event) => update("status", event.target.value)}
      />
      <Input
        label="Tipo"
        name="tipo"
        value={draft.tipo ?? ""}
        onChange={(event) => update("tipo", event.target.value)}
      />
      <FormSelect
        label="Situação interna"
        name="situacao"
        value={draft.situacao ?? "ativo"}
        onChange={(next) => update("situacao", next)}
        options={[
          { value: "ativo", label: "Ativas" },
          { value: "removido", label: "Removidas" },
          { value: "todos", label: "Ativas e removidas" },
        ]}
      />
      <div className="assistance-filters__actions">
        <Button type="submit" disabled={disabled}>
          Aplicar filtros
        </Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => onChange({})}>
          Limpar
        </Button>
      </div>
    </form>
  );
}
