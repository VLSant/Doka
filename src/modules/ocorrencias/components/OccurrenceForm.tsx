import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { validateOccurrenceInput } from "../occurrence-state";
import type { OccurrenceCatalogs, OccurrenceInput } from "../types";

const EMPTY: OccurrenceInput = {
  assistencia_id: "",
  posto_id: "",
  tipo_ocorrencia_id: "",
  prioridade_id: null,
  responsavel_id: null,
  titulo: "",
  descricao: null,
  observacoes: null,
  data_retorno: null,
};

interface Props {
  catalogs: OccurrenceCatalogs;
  initial?: OccurrenceInput;
  editing?: boolean;
  saving?: boolean;
  onSubmit: (input: OccurrenceInput) => Promise<void> | void;
  onCancel: () => void;
}

export function OccurrenceForm({
  catalogs,
  initial = EMPTY,
  editing = false,
  saving = false,
  onSubmit,
  onCancel,
}: Props) {
  const [input, setInput] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedAssistance = useMemo(
    () => catalogs.assistencias.find((item) => item.id === input.assistencia_id),
    [catalogs.assistencias, input.assistencia_id],
  );

  function change<K extends keyof OccurrenceInput>(key: K, value: OccurrenceInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateOccurrenceInput(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(input);
  }

  return (
    <form className="occurrence-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="occurrence-form__grid">
        <label>
          Assistência <span aria-hidden="true">*</span>
          <select
            value={input.assistencia_id}
            disabled={editing || saving}
            aria-invalid={Boolean(errors.assistencia_id)}
            onChange={(event) => {
              const assistance = catalogs.assistencias.find(
                (item) => item.id === event.target.value,
              );
              setInput((current) => ({
                ...current,
                assistencia_id: event.target.value,
                posto_id: assistance?.posto_id ?? "",
              }));
              setErrors((current) => ({ ...current, assistencia_id: "" }));
            }}
          >
            <option value="">Selecione</option>
            {catalogs.assistencias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.numero_assistencia} · {item.data_atividade}
              </option>
            ))}
          </select>
          {errors.assistencia_id ? <small role="alert">{errors.assistencia_id}</small> : null}
        </label>
        <label>
          Posto
          <input
            value={
              catalogs.postos.find((item) => item.id === selectedAssistance?.posto_id)?.nome ?? ""
            }
            disabled
            placeholder="Definido pela assistência"
          />
        </label>
        <label>
          Tipo <span aria-hidden="true">*</span>
          <select
            value={input.tipo_ocorrencia_id}
            disabled={saving}
            aria-invalid={Boolean(errors.tipo_ocorrencia_id)}
            onChange={(event) => change("tipo_ocorrencia_id", event.target.value)}
          >
            <option value="">Selecione</option>
            {catalogs.tipos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
          {errors.tipo_ocorrencia_id ? (
            <small role="alert">{errors.tipo_ocorrencia_id}</small>
          ) : null}
        </label>
        <label>
          Prioridade
          <select
            value={input.prioridade_id ?? ""}
            disabled={saving}
            onChange={(event) => change("prioridade_id", event.target.value || null)}
          >
            <option value="">Sem prioridade</option>
            {catalogs.prioridades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsável
          <select
            value={input.responsavel_id ?? ""}
            disabled={saving}
            onChange={(event) => change("responsavel_id", event.target.value || null)}
          >
            <option value="">Não definido</option>
            {catalogs.usuarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Data de retorno"
          type="date"
          value={input.data_retorno ?? ""}
          disabled={saving}
          onChange={(event) => change("data_retorno", event.target.value || null)}
        />
      </div>
      <Input
        label="Título *"
        value={input.titulo}
        disabled={saving}
        error={errors.titulo}
        onChange={(event) => change("titulo", event.target.value)}
      />
      <label>
        Descrição
        <textarea
          rows={5}
          value={input.descricao ?? ""}
          disabled={saving}
          onChange={(event) => change("descricao", event.target.value || null)}
        />
      </label>
      <label>
        Observações
        <textarea
          rows={3}
          value={input.observacoes ?? ""}
          disabled={saving}
          onChange={(event) => change("observacoes", event.target.value || null)}
        />
      </label>
      <div className="occurrence-actions">
        <Button type="submit" loading={saving}>
          Salvar ocorrência
        </Button>
        <Button variant="outline" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
