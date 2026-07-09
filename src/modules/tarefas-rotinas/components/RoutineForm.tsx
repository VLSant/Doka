import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox, Select, Textarea } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import type { CatalogItem, PrioridadeItem, UsuarioItem } from "../../../services/catalog-service";
import type { Routine, RoutineInput, TaskViewer } from "../types";

const WEEKDAYS = [
  [1, "Seg"],
  [2, "Ter"],
  [3, "Qua"],
  [4, "Qui"],
  [5, "Sex"],
  [6, "Sáb"],
  [7, "Dom"],
] as const;

export function RoutineForm({
  initial,
  viewer,
  postos,
  prioridades,
  cargos,
  usuarios,
  saving,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: Routine;
  viewer: TaskViewer;
  postos: CatalogItem[];
  prioridades: PrioridadeItem[];
  cargos: CatalogItem[];
  usuarios: UsuarioItem[];
  saving?: boolean;
  error?: string;
  onSubmit: (input: RoutineInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [postoId, setPostoId] = useState(initial?.posto_id ?? "");
  const [cargoFuncaoId, setCargoFuncaoId] = useState(initial?.cargo_funcao_id ?? "");
  const [prioridadeId, setPrioridadeId] = useState(initial?.prioridade_id ?? "");
  const [recorrencia, setRecorrencia] = useState<RoutineInput["recorrencia"]>(
    initial?.recorrencia ?? "diaria",
  );
  const [diasSemana, setDiasSemana] = useState<number[]>(initial?.dias_semana ?? [1]);
  const [diaMes, setDiaMes] = useState(initial?.dia_mes ?? 1);
  const [horarioLimite, setHorarioLimite] = useState(initial?.horario_limite?.slice(0, 5) ?? "");
  const [exigeValidacao, setExigeValidacao] = useState(initial?.exige_validacao ?? false);
  const [status, setStatus] = useState(initial?.status ?? "ativa");
  const [dataInicio, setDataInicio] = useState(
    initial?.data_inicio ?? new Date().toISOString().slice(0, 10),
  );
  const [dataFim, setDataFim] = useState(initial?.data_fim ?? "");
  const [responsaveis, setResponsaveis] = useState(
    initial?.responsaveis.map(({ id }) => id) ?? [viewer.usuarioId],
  );
  const [touched, setTouched] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (
      !nome.trim() ||
      !dataInicio ||
      responsaveis.length === 0 ||
      (recorrencia === "semanal" && diasSemana.length === 0)
    )
      return;
    void onSubmit({
      nome,
      descricao,
      postoId,
      cargoFuncaoId,
      prioridadeId,
      recorrencia,
      diasSemana,
      diaMes,
      horarioLimite,
      exigeValidacao,
      status,
      dataInicio,
      dataFim,
      responsaveis,
    });
  }

  return (
    <form className="tasks-form" onSubmit={submit} noValidate>
      {error ? (
        <p className="tasks-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <Input
        className="tasks-form__wide"
        label="Nome *"
        autoFocus
        value={nome}
        disabled={saving}
        error={touched && !nome.trim() ? "Informe o nome." : undefined}
        onChange={(event) => setNome(event.target.value)}
      />
      <Textarea
        className="tasks-form__wide"
        label="Descrição"
        rows={3}
        value={descricao}
        disabled={saving}
        onChange={(event) => setDescricao(event.target.value)}
      />
      <Select
        label="Recorrência"
        value={recorrencia}
        disabled={saving}
        onChange={(event) => setRecorrencia(event.target.value as RoutineInput["recorrencia"])}
      >
        <option value="diaria">Diária</option>
        <option value="semanal">Semanal</option>
        <option value="quinzenal">Quinzenal</option>
        <option value="mensal">Mensal</option>
      </Select>
      {recorrencia === "semanal" ? (
        <fieldset className="tasks-form__wide">
          <legend>Dias da semana *</legend>
          <div className="tasks-weekdays">
            {WEEKDAYS.map(([day, label]) => (
              <Checkbox
                key={day}
                label={label}
                checked={diasSemana.includes(day)}
                disabled={saving}
                onChange={(event) =>
                  setDiasSemana((current) =>
                    event.target.checked
                      ? [...current, day].sort()
                      : current.filter((item) => item !== day),
                  )
                }
              />
            ))}
          </div>
          {touched && diasSemana.length === 0 ? <small>Selecione ao menos um dia.</small> : null}
        </fieldset>
      ) : null}
      {recorrencia === "mensal" ? (
        <Input
          label="Dia do mês"
          type="number"
          min={1}
          max={31}
          value={diaMes}
          disabled={saving}
          onChange={(event) => setDiaMes(Number(event.target.value))}
        />
      ) : null}
      <Input
        label="Data de início *"
        type="date"
        value={dataInicio}
        disabled={saving}
        error={touched && !dataInicio ? "Informe a data de início." : undefined}
        onChange={(event) => setDataInicio(event.target.value)}
      />
      <Input
        label="Data de término"
        type="date"
        value={dataFim}
        min={dataInicio}
        disabled={saving}
        onChange={(event) => setDataFim(event.target.value)}
      />
      <Input
        label="Horário limite"
        type="time"
        value={horarioLimite}
        disabled={saving}
        onChange={(event) => setHorarioLimite(event.target.value)}
      />
      <Select
        label="Status"
        value={status}
        disabled={saving || !initial}
        onChange={(event) => setStatus(event.target.value as Routine["status"])}
      >
        <option value="ativa">Ativa</option>
        <option value="pausada">Pausada</option>
        <option value="inativa">Inativa</option>
      </Select>
      <Select
        label="Posto"
        value={postoId}
        disabled={saving}
        onChange={(event) => setPostoId(event.target.value)}
      >
        <option value="">Geral / sem posto</option>
        {postos.map((posto) => (
          <option key={posto.id} value={posto.id}>
            {posto.nome}
          </option>
        ))}
      </Select>
      <Select
        label="Prioridade"
        value={prioridadeId}
        disabled={saving}
        onChange={(event) => setPrioridadeId(event.target.value)}
      >
        <option value="">Sem prioridade</option>
        {prioridades.map((prioridade) => (
          <option key={prioridade.id} value={prioridade.id}>
            {prioridade.nome}
          </option>
        ))}
      </Select>
      <Select
        label="Cargo / função"
        value={cargoFuncaoId}
        disabled={saving}
        onChange={(event) => setCargoFuncaoId(event.target.value)}
      >
        <option value="">Todos / não aplicável</option>
        {cargos.map((cargo) => (
          <option key={cargo.id} value={cargo.id}>
            {cargo.nome}
          </option>
        ))}
      </Select>
      <div className="tasks-form__wide tasks-form__responsibles">
        <span>Responsáveis *</span>
        <div className="tasks-checkbox-group" role="group" aria-label="Responsáveis">
          {usuarios.map((usuario) => (
            <Checkbox
              key={usuario.id}
              label={`${usuario.nome} · ${usuario.perfil}`}
              checked={responsaveis.includes(usuario.id)}
              disabled={saving}
              onChange={(event) =>
                setResponsaveis((current) =>
                  event.target.checked
                    ? [...current, usuario.id]
                    : current.filter((id) => id !== usuario.id),
                )
              }
            />
          ))}
        </div>
      </div>
      <Checkbox
        className="tasks-form__wide"
        label="Exigir validação"
        checked={exigeValidacao}
        disabled={saving}
        onChange={(event) => setExigeValidacao(event.target.checked)}
      />
      <div className="tasks-form__actions">
        <Button variant="outline" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {initial ? "Salvar rotina" : "Criar rotina"}
        </Button>
      </div>
    </form>
  );
}
