import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Select, Textarea } from "../../../components/ui/FormControls";
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
        <Select
          label="Assistência *"
          value={input.assistencia_id}
          disabled={editing || saving}
          error={errors.assistencia_id}
          onChange={(event) => {
            const assistance = catalogs.assistencias.find((item) => item.id === event.target.value);
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
        </Select>
        <Input
          label="Posto"
          value={
            catalogs.postos.find((item) => item.id === selectedAssistance?.posto_id)?.nome ?? ""
          }
          disabled
          placeholder="Definido pela assistência"
        />
        <Select
          label="Tipo *"
          value={input.tipo_ocorrencia_id}
          disabled={saving}
          error={errors.tipo_ocorrencia_id}
          onChange={(event) => change("tipo_ocorrencia_id", event.target.value)}
        >
          <option value="">Selecione</option>
          {catalogs.tipos.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Select>
        <Select
          label="Prioridade *"
          value={input.prioridade_id ?? ""}
          disabled={saving}
          error={errors.prioridade_id}
          onChange={(event) => change("prioridade_id", event.target.value || null)}
        >
          <option value="">Sem prioridade</option>
          {catalogs.prioridades.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Select>
        <Select
          label="Responsável *"
          value={input.responsavel_id ?? ""}
          disabled={saving}
          error={errors.responsavel_id}
          onChange={(event) => change("responsavel_id", event.target.value || null)}
        >
          <option value="">Não definido</option>
          {catalogs.usuarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Select>
        <Input
          label="Data de retorno *"
          type="date"
          value={input.data_retorno ?? ""}
          disabled={saving}
          error={errors.data_retorno}
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
      <Textarea
        label="Descrição *"
        rows={5}
        value={input.descricao ?? ""}
        disabled={saving}
        error={errors.descricao}
        onChange={(event) => change("descricao", event.target.value || null)}
      />
      <Textarea
        label="Observações"
        rows={3}
        value={input.observacoes ?? ""}
        disabled={saving}
        onChange={(event) => change("observacoes", event.target.value || null)}
      />
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
