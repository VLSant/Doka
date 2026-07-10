import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
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
        <FormSelect
          label="Assistência *"
          value={input.assistencia_id}
          disabled={editing || saving}
          error={errors.assistencia_id}
          onChange={(next) => {
            const assistance = catalogs.assistencias.find((item) => item.id === next);
            setInput((current) => ({
              ...current,
              assistencia_id: next,
              posto_id: assistance?.posto_id ?? "",
            }));
            setErrors((current) => ({ ...current, assistencia_id: "" }));
          }}
          options={[
            { value: "", label: "Selecione" },
            ...catalogs.assistencias.map((item) => ({
              value: item.id,
              label: `${item.numero_assistencia} · ${item.data_atividade}`,
            })),
          ]}
        />
        <Input
          label="Posto"
          value={
            catalogs.postos.find((item) => item.id === selectedAssistance?.posto_id)?.nome ?? ""
          }
          disabled
          placeholder="Definido pela assistência"
        />
        <FormSelect
          label="Tipo *"
          value={input.tipo_ocorrencia_id}
          disabled={saving}
          error={errors.tipo_ocorrencia_id}
          onChange={(next) => change("tipo_ocorrencia_id", next)}
          options={[
            { value: "", label: "Selecione" },
            ...catalogs.tipos.map((item) => ({ value: item.id, label: item.nome })),
          ]}
        />
        <FormSelect
          label="Prioridade *"
          value={input.prioridade_id ?? ""}
          disabled={saving}
          error={errors.prioridade_id}
          onChange={(next) => change("prioridade_id", next || null)}
          options={[
            { value: "", label: "Sem prioridade" },
            ...catalogs.prioridades.map((item) => ({ value: item.id, label: item.nome })),
          ]}
        />
        <FormSelect
          label="Responsável *"
          value={input.responsavel_id ?? ""}
          disabled={saving}
          error={errors.responsavel_id}
          onChange={(next) => change("responsavel_id", next || null)}
          options={[
            { value: "", label: "Não definido" },
            ...catalogs.usuarios.map((item) => ({ value: item.id, label: item.nome })),
          ]}
        />
        <DatePickerField
          label="Data de retorno *"
          value={input.data_retorno ?? ""}
          disabled={saving}
          error={errors.data_retorno}
          onChange={(next) => change("data_retorno", next || null)}
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
