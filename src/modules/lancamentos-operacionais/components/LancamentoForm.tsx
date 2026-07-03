import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { LancamentoFormOptions, LancamentoInput, TipoLancamento } from "../types";
import { validateLancamentoInput } from "../types";

interface Props {
  initial?: LancamentoInput;
  options: LancamentoFormOptions;
  saving?: boolean;
  onSubmit: (input: LancamentoInput) => Promise<void> | void;
  onCancel: () => void;
}

function emptyInput(): LancamentoInput {
  return {
    tipo: "deslocamento",
    assistencia_id: null,
    posto_id: "",
    recurso: null,
    data_lancamento: new Date().toISOString().slice(0, 10),
    descricao: "",
    valor: 0,
    observacoes: null,
  };
}

export function LancamentoForm({ initial, options, saving, onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<LancamentoInput>(initial ?? emptyInput());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const assistencias = useMemo(
    () =>
      draft.posto_id
        ? options.assistencias.filter((item) => item.posto_id === draft.posto_id)
        : options.assistencias,
    [draft.posto_id, options.assistencias],
  );

  function setTipo(tipo: TipoLancamento) {
    setDraft({ ...draft, tipo });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateLancamentoInput(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(draft);
  }

  return (
    <form className="lancamento-form" onSubmit={(event) => void submit(event)} noValidate>
      <fieldset disabled={saving}>
        <legend>Tipo de lançamento</legend>
        <label className="lancamento-form__radio">
          <input
            type="radio"
            name="tipo"
            value="deslocamento"
            checked={draft.tipo === "deslocamento"}
            onChange={() => setTipo("deslocamento")}
          />
          Deslocamento
        </label>
        <label className="lancamento-form__radio">
          <input
            type="radio"
            name="tipo"
            value="custo_extra"
            checked={draft.tipo === "custo_extra"}
            onChange={() => setTipo("custo_extra")}
          />
          Custo extra
        </label>
      </fieldset>

      <label>
        Posto
        <select
          value={draft.posto_id}
          disabled={saving}
          aria-invalid={Boolean(errors.posto_id)}
          onChange={(event) =>
            setDraft({ ...draft, posto_id: event.target.value, assistencia_id: null })
          }
        >
          <option value="">Selecione</option>
          {options.postos.map((posto) => (
            <option key={posto.id} value={posto.id}>
              {posto.nome}
            </option>
          ))}
        </select>
        {errors.posto_id ? <span className="lancamento-form__error">{errors.posto_id}</span> : null}
      </label>

      <label>
        Assistência {draft.tipo === "custo_extra" ? "(obrigatória)" : "(opcional)"}
        <select
          value={draft.assistencia_id ?? ""}
          disabled={saving}
          aria-invalid={Boolean(errors.assistencia_id)}
          onChange={(event) => setDraft({ ...draft, assistencia_id: event.target.value || null })}
        >
          <option value="">Sem assistência</option>
          {assistencias.map((item) => (
            <option key={item.id} value={item.id}>
              {item.numero}
              {item.cliente ? ` · ${item.cliente}` : ""}
            </option>
          ))}
        </select>
        {errors.assistencia_id ? (
          <span className="lancamento-form__error">{errors.assistencia_id}</span>
        ) : null}
      </label>

      <Input
        label="Data"
        type="date"
        value={draft.data_lancamento}
        disabled={saving}
        error={errors.data_lancamento}
        onChange={(event) => setDraft({ ...draft, data_lancamento: event.target.value })}
      />
      <Input
        label="Responsável / recurso"
        value={draft.recurso ?? ""}
        disabled={saving}
        onChange={(event) => setDraft({ ...draft, recurso: event.target.value || null })}
      />
      <Input
        label="Descrição / motivo"
        value={draft.descricao}
        disabled={saving}
        error={errors.descricao}
        onChange={(event) => setDraft({ ...draft, descricao: event.target.value })}
      />
      <Input
        label="Valor (R$)"
        type="number"
        min="0.01"
        step="0.01"
        value={draft.valor || ""}
        disabled={saving}
        error={errors.valor}
        onChange={(event) => setDraft({ ...draft, valor: Number(event.target.value) })}
      />
      <label>
        Observações
        <textarea
          value={draft.observacoes ?? ""}
          disabled={saving}
          rows={4}
          onChange={(event) => setDraft({ ...draft, observacoes: event.target.value || null })}
        />
      </label>
      <div className="lancamento-form__actions">
        <Button type="submit" loading={saving}>
          Salvar lançamento
        </Button>
        <Button variant="outline" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
