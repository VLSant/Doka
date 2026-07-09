import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { RadioOption, Textarea } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
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
        <div className="lancamento-form__radio-group">
          <RadioOption
            label="Deslocamento"
            name="tipo"
            value="deslocamento"
            checked={draft.tipo === "deslocamento"}
            onChange={() => setTipo("deslocamento")}
          />
          <RadioOption
            label="Custo extra"
            name="tipo"
            value="custo_extra"
            checked={draft.tipo === "custo_extra"}
            onChange={() => setTipo("custo_extra")}
          />
        </div>
      </fieldset>

      <FormSelect
        label="Posto"
        value={draft.posto_id}
        disabled={saving}
        error={errors.posto_id}
        onChange={(next) =>
          setDraft({ ...draft, posto_id: next, assistencia_id: null })
        }
        options={[
          { value: "", label: "Selecione" },
          ...options.postos.map((posto) => ({ value: posto.id, label: posto.nome })),
        ]}
      />

      <FormSelect
        label={`Assistência ${draft.tipo === "custo_extra" ? "(obrigatória)" : "(opcional)"}`}
        value={draft.assistencia_id ?? ""}
        disabled={saving}
        error={errors.assistencia_id}
        onChange={(next) => setDraft({ ...draft, assistencia_id: next || null })}
        options={[
          { value: "", label: "Sem assistência" },
          ...assistencias.map((item) => ({
            value: item.id,
            label: `${item.numero}${item.cliente ? ` · ${item.cliente}` : ""}`,
          })),
        ]}
      />

      <DatePickerField
        label="Data"
        value={draft.data_lancamento}
        disabled={saving}
        error={errors.data_lancamento}
        onChange={(next) => setDraft({ ...draft, data_lancamento: next })}
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
      <Textarea
        label="Observações"
        value={draft.observacoes ?? ""}
        disabled={saving}
        rows={4}
        onChange={(event) => setDraft({ ...draft, observacoes: event.target.value || null })}
      />
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
