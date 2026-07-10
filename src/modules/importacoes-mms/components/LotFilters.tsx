import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import type { LotFilters as Filters } from "../types";

export function LotFilters({
  value,
  disabled,
  onChange,
}: {
  value: Filters;
  disabled?: boolean;
  onChange: (filters: Filters) => void;
}) {
  const [draft, setDraft] = useState<Filters>({
    ...value,
    importado_de: value.importado_de?.slice(0, 10),
    importado_ate: value.importado_ate?.slice(0, 10),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = (input: string | undefined) => input?.trim() || undefined;
    onChange({
      posto_id: text(draft.posto_id),
      data_atividade: text(draft.data_atividade),
      importado_de: text(draft.importado_de),
      importado_ate: text(draft.importado_ate),
      status: text(draft.status),
      com_erro: draft.com_erro || undefined,
      com_alerta: draft.com_alerta || undefined,
    });
  }

  function clear() {
    setDraft({});
    onChange({});
  }

  return (
    <form className="mms-lot-filters" onSubmit={submit} aria-label="Filtros de importações">
      <Input
        label="Posto"
        name="posto_id"
        value={draft.posto_id ?? ""}
        onChange={(event) => setDraft({ ...draft, posto_id: event.target.value })}
      />
      <DatePickerField
        label="Data operacional"
        name="data_atividade"
        value={draft.data_atividade ?? ""}
        onChange={(next) => setDraft({ ...draft, data_atividade: next })}
      />
      <DatePickerField
        label="Importado de"
        name="importado_de"
        value={draft.importado_de ?? ""}
        onChange={(next) => setDraft({ ...draft, importado_de: next })}
      />
      <DatePickerField
        label="Até"
        name="importado_ate"
        value={draft.importado_ate ?? ""}
        onChange={(next) => setDraft({ ...draft, importado_ate: next })}
      />
      <FormSelect
        label="Status"
        name="status"
        value={draft.status ?? ""}
        onChange={(next) => setDraft({ ...draft, status: next })}
        options={[
          { value: "", label: "Todos" },
          { value: "importado", label: "Importado" },
          { value: "importado_com_alertas", label: "Com alertas" },
          { value: "erro", label: "Com erros" },
          { value: "cancelado", label: "Cancelado" },
        ]}
      />
      <Checkbox
        name="com_erro"
        label="Com erro"
        checked={draft.com_erro ?? false}
        onChange={(event) => setDraft({ ...draft, com_erro: event.target.checked })}
      />
      <Checkbox
        name="com_alerta"
        label="Com alerta"
        checked={draft.com_alerta ?? false}
        onChange={(event) => setDraft({ ...draft, com_alerta: event.target.checked })}
      />
      <div className="mms-lot-filters__actions">
        <Button type="submit" disabled={disabled}>
          Aplicar filtros
        </Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={clear}>
          Limpar
        </Button>
      </div>
    </form>
  );
}
