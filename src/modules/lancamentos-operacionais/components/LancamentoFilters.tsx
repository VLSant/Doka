import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { LancamentoCatalogoItem, LancamentoFilters } from "../types";

interface Props {
  value: LancamentoFilters;
  postos: LancamentoCatalogoItem[];
  disabled?: boolean;
  onChange: (filters: LancamentoFilters) => void;
}

export function LancamentoFiltersForm({ value, postos, disabled, onChange }: Props) {
  const [draft, setDraft] = useState(value);

  function submit(event: FormEvent) {
    event.preventDefault();
    onChange(draft);
  }

  return (
    <form className="lancamentos-filters" onSubmit={submit}>
      <Input
        label="Data inicial"
        type="date"
        value={draft.data_de ?? ""}
        disabled={disabled}
        onChange={(event) => setDraft({ ...draft, data_de: event.target.value })}
      />
      <Input
        label="Data final"
        type="date"
        value={draft.data_ate ?? ""}
        disabled={disabled}
        onChange={(event) => setDraft({ ...draft, data_ate: event.target.value })}
      />
      <label>
        Posto
        <select
          value={draft.posto_id ?? ""}
          disabled={disabled}
          onChange={(event) => setDraft({ ...draft, posto_id: event.target.value })}
        >
          <option value="">Todos</option>
          {postos.map((posto) => (
            <option key={posto.id} value={posto.id}>
              {posto.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tipo
        <select
          value={draft.tipo ?? ""}
          disabled={disabled}
          onChange={(event) =>
            setDraft({ ...draft, tipo: event.target.value as LancamentoFilters["tipo"] })
          }
        >
          <option value="">Todos</option>
          <option value="deslocamento">Deslocamento</option>
          <option value="custo_extra">Custo extra</option>
        </select>
      </label>
      <label>
        Status
        <select
          value={draft.status ?? ""}
          disabled={disabled}
          onChange={(event) =>
            setDraft({ ...draft, status: event.target.value as LancamentoFilters["status"] })
          }
        >
          <option value="">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="validado">Validado</option>
        </select>
      </label>
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
