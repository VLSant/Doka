import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/FormControls";
import type {
  CatalogItem,
  PrioridadeItem,
  UsuarioItem,
} from "../../../services/catalog-service";
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
    operator ? [viewer.usuarioId] : (initial?.responsaveis.map(({ id }) => id) ?? [viewer.usuarioId]),
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
    ) return;
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
      {error ? <p className="tasks-form__error" role="alert">{error}</p> : null}
      <label className="tasks-form__wide">
        Título *
        <input
          autoFocus
          value={titulo}
          disabled={saving}
          aria-invalid={touched && !titulo.trim()}
          onChange={(event) => setTitulo(event.target.value)}
        />
        {touched && !titulo.trim() ? <small>Informe o título.</small> : null}
      </label>
      <label>
        Tipo
        <select value={tipo} disabled={saving || Boolean(initial?.rotina_id)} onChange={(event) => setTipo(event.target.value as TaskInput["tipo"])}>
          <option value="avulsa">Avulsa</option>
          <option value="estrategia">Estratégia</option>
        </select>
      </label>
      <label>
        Posto
        <select value={postoId} disabled={saving} aria-invalid={touched && !postoId} onChange={(event) => setPostoId(event.target.value)}>
          <option value="">Selecione</option>
          {postos.map((posto) => <option key={posto.id} value={posto.id}>{posto.nome}</option>)}
        </select>
      </label>
      <label className="tasks-form__wide">
        Descrição *
        <textarea value={descricao} disabled={saving} rows={4} aria-invalid={touched && !descricao.trim()} onChange={(event) => setDescricao(event.target.value)} />
      </label>
      <label>
        Prioridade *
        <select value={prioridadeId} disabled={saving} aria-invalid={touched && !prioridadeId} onChange={(event) => setPrioridadeId(event.target.value)}>
          <option value="">Selecione</option>
          {prioridades.map((prioridade) => <option key={prioridade.id} value={prioridade.id}>{prioridade.nome}</option>)}
        </select>
      </label>
      <label>
        Cargo / função
        <select value={cargoFuncaoId} disabled={saving} onChange={(event) => setCargoFuncaoId(event.target.value)}>
          <option value="">Todos / não aplicável</option>
          {cargos.map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>)}
        </select>
      </label>
      <label>
        Prazo *
        <input type="date" value={prazoData} disabled={saving} aria-invalid={touched && !prazoData} onChange={(event) => setPrazoData(event.target.value)} />
      </label>
      <label>
        Horário limite
        <input type="time" value={horarioLimite} disabled={saving} onChange={(event) => setHorarioLimite(event.target.value)} />
      </label>
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
                onChange={(event) => setResponsaveis((current) =>
                  event.target.checked
                    ? [...current, usuario.id]
                    : current.filter((id) => id !== usuario.id),
                )}
              />
            ))}
          </div>
        )}
        {touched && responsaveis.length === 0 ? <small>Selecione ao menos um responsável.</small> : null}
      </div>
      <label className="tasks-form__wide">
        Observações
        <textarea value={observacoes} disabled={saving} rows={3} onChange={(event) => setObservacoes(event.target.value)} />
      </label>
      <label className="tasks-form__check">
        <input type="checkbox" checked={exigeValidacao} disabled={saving} onChange={(event) => setExigeValidacao(event.target.checked)} />
        Exigir validação da Supervisão ou Direção
      </label>
      <div className="tasks-form__actions">
        <Button variant="outline" disabled={saving} onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>{initial ? "Salvar alterações" : "Criar tarefa"}</Button>
      </div>
    </form>
  );
}
