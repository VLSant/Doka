import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../auth/AuthProvider";
import { EntityHistory } from "../../auditoria/EntityHistory";
import { createTaskService, type TaskService } from "../task-service";
import { availableTaskActions, canEditTask } from "../task-state";
import type { Task, TaskAction, TaskViewer } from "../types";
import "../tasks.css";

const ACTION_LABEL: Record<TaskAction, string> = {
  iniciar: "Iniciar",
  concluir: "Concluir",
  validar: "Validar",
  reabrir: "Reabrir",
};

export function TaskDetailPage({ service: injected, viewer: injectedViewer }: { service?: TaskService; viewer?: TaskViewer }) {
  const { tarefaId = "" } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const viewer = injectedViewer ?? (auth.state.name === "autorizado" ? {
    usuarioId: auth.state.context.usuarioId,
    perfil: auth.state.context.perfil,
    postoIds: auth.state.context.postos.map(({ postoId }) => postoId),
  } : null);
  const service = useMemo(() => injected ?? createTaskService(), [injected]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try { setTask(await service.getTask(tarefaId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar a tarefa."); }
    finally { setLoading(false); }
  }, [service, tarefaId]);
  // Initial Data API synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  if (!viewer) return null;
  if (loading && !task) return <LoadingState message="Carregando tarefa..." />;
  if (!task) return <FeedbackState tone="error" title="Tarefa indisponível" description={error} />;
  const actions = availableTaskActions(task, viewer);

  async function transition(action: TaskAction) {
    const justification = action === "reabrir" ? window.prompt("Justificativa da reabertura:")?.trim() : undefined;
    if (action === "reabrir" && !justification) return;
    setActing(true);
    setError(undefined);
    try { setTask(await service.transitionTask(task!.id, action, justification)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir a ação."); }
    finally { setActing(false); }
  }

  return (
    <main className="tasks-module">
      <header className="tasks-header">
        <div>
          <Link to="/app/tarefas-rotinas">Voltar para tarefas</Link>
          <h1>{task.titulo}</h1>
          <p>{task.descricao || "Sem descrição."}</p>
        </div>
        {canEditTask(task, viewer) ? <Link className="tasks-link-button tasks-link-button--outline" to={`/app/tarefas-rotinas/${task.id}/editar`}>Editar</Link> : null}
      </header>
      {error ? <p className="tasks-form__error" role="alert">{error}</p> : null}
      <section className="tasks-detail-grid">
        <Card padding="lg">
          <h2>Dados da tarefa</h2>
          <dl>
            <dt>Status</dt><dd>{task.status.replace("_", " ")}</dd>
            <dt>Responsáveis</dt><dd>{task.responsaveis.map(({ nome }) => nome).join(", ")}</dd>
            <dt>Posto</dt><dd>{task.posto?.nome ?? "Geral"}</dd>
            <dt>Prioridade</dt><dd>{task.prioridade?.nome ?? "Não informada"}</dd>
            <dt>Prazo</dt><dd>{task.prazo_data ?? "Sem prazo"} {task.horario_limite?.slice(0, 5) ?? ""}</dd>
            <dt>Origem</dt><dd>{task.rotina_id ? "Rotina recorrente" : task.tipo}</dd>
          </dl>
        </Card>
        <Card padding="lg">
          <h2>Ações</h2>
          <div className="tasks-detail-actions">
            {actions.map((action) => <Button key={action} loading={acting} variant={action === "reabrir" ? "outline" : "primary"} onClick={() => void transition(action)}>{ACTION_LABEL[action]}</Button>)}
            {actions.length === 0 ? <p>Nenhuma ação disponível no estado atual.</p> : null}
          </div>
        </Card>
        <Card padding="lg">
          <h2>Registro operacional</h2>
          <dl>
            <dt>Criada em</dt><dd>{new Date(task.created_at).toLocaleString("pt-BR")}</dd>
            {task.iniciada_em ? <><dt>Iniciada em</dt><dd>{new Date(task.iniciada_em).toLocaleString("pt-BR")}</dd></> : null}
            {task.concluida_em ? <><dt>Concluída em</dt><dd>{new Date(task.concluida_em).toLocaleString("pt-BR")}</dd></> : null}
            {task.validada_em ? <><dt>Validada em</dt><dd>{new Date(task.validada_em).toLocaleString("pt-BR")}</dd></> : null}
            {task.reaberta_em ? <><dt>Reaberta em</dt><dd>{new Date(task.reaberta_em).toLocaleString("pt-BR")} · {task.justificativa_reabertura}</dd></> : null}
          </dl>
        </Card>
      </section>
      {viewer.perfil !== "operador" ? (
        <Button variant="danger" onClick={async () => {
          const justification = window.prompt("Justificativa da remoção:")?.trim();
          if (!justification) return;
          setActing(true);
          try { await service.removeTask(task.id, justification); navigate("/app/tarefas-rotinas"); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível remover."); setActing(false); }
        }}>Remover tarefa</Button>
      ) : null}
      <EntityHistory entityType="tarefas" entityId={task.id} />
    </main>
  );
}

export default TaskDetailPage;
