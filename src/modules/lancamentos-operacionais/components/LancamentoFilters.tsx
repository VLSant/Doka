import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import type { AssistenciaCatalogoItem, LancamentoCatalogoItem, LancamentoFilters } from "../types";

interface Props {
  value: LancamentoFilters;
  postos: LancamentoCatalogoItem[];
  assistencias: AssistenciaCatalogoItem[];
  disabled?: boolean;
  onChange: (filters: LancamentoFilters) => void;
}

export function LancamentoFiltersForm({ value, postos, assistencias, disabled, onChange }: Props) {
  const [draft, setDraft] = useState(value);

  function submit(event: FormEvent) {
    event.preventDefault();
    onChange(draft);
  }

  return (
    <form className="lancamentos-filters" onSubmit={submit}>
      <DatePickerField
        label="Data inicial"
        value={draft.data_de ?? ""}
        disabled={disabled}
        onChange={(next) => setDraft({ ...draft, data_de: next })}
      />
      <DatePickerField
        label="Data final"
        value={draft.data_ate ?? ""}
        disabled={disabled}
        onChange={(next) => setDraft({ ...draft, data_ate: next })}
      />
      <FormSelect
        label="Posto"
        value={draft.posto_id ?? ""}
        disabled={disabled}
        onChange={(next) => setDraft({ ...draft, posto_id: next })}
        options={[
          { value: "", label: "Todos" },
          ...postos.map((posto) => ({ value: posto.id, label: posto.nome })),
        ]}
      />
      <FormSelect
        label="Tipo"
        value={draft.tipo ?? ""}
        disabled={disabled}
        onChange={(next) =>
          setDraft({ ...draft, tipo: next as LancamentoFilters["tipo"] })
        }
        options={[
          { value: "", label: "Todos" },
          { value: "deslocamento", label: "Deslocamento" },
          { value: "custo_extra", label: "Custo extra" },
        ]}
      />
      <FormSelect
        label="Status"
        value={draft.status ?? ""}
        disabled={disabled}
        onChange={(next) =>
          setDraft({ ...draft, status: next as LancamentoFilters["status"] })
        }
        options={[
          { value: "", label: "Todos" },
          { value: "pendente", label: "Pendente" },
          { value: "validado", label: "Validado" },
        ]}
      />
      <FormSelect
        label="Assistência"
        value={draft.assistencia_id ?? ""}
        disabled={disabled}
        onChange={(next) => setDraft({ ...draft, assistencia_id: next })}
        options={[
          { value: "", label: "Todas" },
          ...assistencias.map((item) => ({
            value: item.id,
            label: `${item.numero}${item.cliente ? ` · ${item.cliente}` : ""}`,
          })),
        ]}
      />
      <Input
        label="Responsável / recurso"
        value={draft.recurso ?? ""}
        disabled={disabled}
        onChange={(event) => setDraft({ ...draft, recurso: event.target.value })}
      />
      <div className="lancamentos-filters__actions">
        <Button type="submit" disabled={disabled}>
          Aplicar filtros
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => {
            setDraft({});
            onChange({});
          }}
        >
          Limpar
        </Button>
      </div>
    </form>
  );
}
