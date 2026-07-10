import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox, Textarea } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import type { CatalogItem, PrioridadeItem, UsuarioItem } from "../../../services/catalog-service";
import type { Task, TaskInput, TaskViewer } from "../types";

interface TaskFormProps {
  initial?: Task;
  viewer: TaskViewer;
  postos: CatalogItem[];
  prioridades: PrioridadeItem[];
  cargos: CatalogItem[];
  usuarios: UsuarioItem[];
  saving?: boolean;
  error?: string;
  onSubmit: (input: TaskInput) => void | Promise<void>;
  onCancel: () => void;
}

export function TaskForm({
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
}: TaskFormProps) {
  const operator = viewer.perfil === "operador";
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [tipo, setTipo] = useState<TaskInput["tipo"]>(
    initial?.tipo === "estrategia" ? "estrategia" : "avulsa",
  );
  const [postoId, setPostoId] = useState(initial?.posto_id ?? "");
  const [cargoFuncaoId, setCargoFuncaoId] = useState(initial?.cargo_funcao_id ?? "");
  const [prioridadeId, setPrioridadeId] = useState(initial?.prioridade_id ?? "");
  const [prazoData, setPrazoData] = useState(initial?.prazo_data ?? "");
  const [horarioLimite, setHorarioLimite] = useState(initial?.horario_limite?.slice(0, 5) ?? "");
  const [exigeValidacao, setExigeValidacao] = useState(initial?.exige_validacao ?? false);
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [responsaveis, setResponsaveis] = useState<string[]>(
    operator
      ? [viewer.usuarioId]
      : (initial?.responsaveis.map(({ id }) => id) ?? [viewer.usuarioId]),
  );
  const [touched, setTouched] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !postoId ||
      !prioridadeId ||
      !prazoData ||
      responsaveis.length === 0
    )
      return;
    void onSubmit({
      titulo,
      descricao,
      tipo,
      postoId,
      cargoFuncaoId,
      prioridadeId,
      prazoData,
      horarioLimite,
      exigeValidacao,
      observacoes,
      responsaveis: operator ? [viewer.usuarioId] : responsaveis,
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
        label="Título *"
        autoFocus
        value={titulo}
        disabled={saving}
        error={touched && !titulo.trim() ? "Informe o título." : undefined}
        onChange={(event) => setTitulo(event.target.value)}
      />
      <FormSelect
        label="Tipo"
        value={tipo}
        disabled={saving || Boolean(initial?.rotina_id)}
        onChange={(next) => setTipo(next as TaskInput["tipo"])}
        options={[
          { value: "avulsa", label: "Avulsa" },
          { value: "estrategia", label: "Estratégia" },
        ]}
      />
      <FormSelect
        label="Posto"
        value={postoId}
        disabled={saving}
        error={touched && !postoId ? "Selecione o posto." : undefined}
        onChange={(next) => setPostoId(next)}
        options={[
          { value: "", label: "Selecione" },
          ...postos.map((posto) => ({ value: posto.id, label: posto.nome })),
        ]}
      />
      <Textarea
        className="tasks-form__wide"
        label="Descrição *"
        value={descricao}
        disabled={saving}
        rows={4}
        error={touched && !descricao.trim() ? "Informe a descrição." : undefined}
        onChange={(event) => setDescricao(event.target.value)}
      />
      <FormSelect
        label="Prioridade *"
        value={prioridadeId}
        disabled={saving}
        error={touched && !prioridadeId ? "Selecione a prioridade." : undefined}
        onChange={(next) => setPrioridadeId(next)}
        options={[
          { value: "", label: "Selecione" },
          ...prioridades.map((prioridade) => ({ value: prioridade.id, label: prioridade.nome })),
        ]}
      />
      <FormSelect
        label="Cargo / função"
        value={cargoFuncaoId}
        disabled={saving}
        onChange={(next) => setCargoFuncaoId(next)}
        options={[
          { value: "", label: "Todos / não aplicável" },
          ...cargos.map((cargo) => ({ value: cargo.id, label: cargo.nome })),
        ]}
      />
      <DatePickerField
        label="Prazo *"
        value={prazoData}
        disabled={saving}
        error={touched && !prazoData ? "Informe o prazo." : undefined}
        onChange={(next) => setPrazoData(next)}
      />
      <Input
        label="Horário limite"
        type="time"
        value={horarioLimite}
        disabled={saving}
        onChange={(event) => setHorarioLimite(event.target.value)}
      />
      <div className="tasks-form__wide tasks-form__responsibles">
        <span>Responsáveis *</span>
        {operator ? (
          <span className="tasks-form__fixed-value">
            {usuarios.find(({ id }) => id === viewer.usuarioId)?.nome ?? "Você"}
            <small>Operadores podem atribuir tarefas somente a si.</small>
          </span>
        ) : (
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
        )}
        {touched && responsaveis.length === 0 ? (
          <small>Selecione ao menos um responsável.</small>
        ) : null}
      </div>
      <Textarea
        className="tasks-form__wide"
        label="Observações"
        value={observacoes}
        disabled={saving}
        rows={3}
        onChange={(event) => setObservacoes(event.target.value)}
      />
      <Checkbox
        className="tasks-form__wide"
        label="Exigir validação da Supervisão ou Direção"
        checked={exigeValidacao}
        disabled={saving}
        onChange={(event) => setExigeValidacao(event.target.checked)}
      />
      <div className="tasks-form__actions">
        <Button variant="outline" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {initial ? "Salvar alterações" : "Criar tarefa"}
        </Button>
      </div>
    </form>
  );
}
