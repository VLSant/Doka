import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { Card } from "../../../components/ui/Card";
import { StatusBadge, type StatusTone } from "../../../components/ui/StatusBadge";
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

const STATUS_LABEL: Record<Task["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  validada: "Validada",
  reaberta: "Reaberta",
};

const STATUS_TONE: Record<Task["status"], StatusTone> = {
  pendente: "neutral",
  em_andamento: "info",
  concluida: "success",
  validada: "success",
  reaberta: "warning",
};

export function TaskDetailPage({
  service: injected,
  viewer: injectedViewer,
}: {
  service?: TaskService;
  viewer?: TaskViewer;
}) {
  const { tarefaId = "" } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const viewer =
    injectedViewer ??
    (auth.state.name === "autorizado"
      ? {
          usuarioId: auth.state.context.usuarioId,
          perfil: auth.state.context.perfil,
          postoIds: auth.state.context.postos.map(({ postoId }) => postoId),
        }
      : null);
  const service = useMemo(() => injected ?? createTaskService(), [injected]);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const [reopenOpen, setReopenOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const taskQuery = useQuery({
    queryKey: queryKeys.tasks.detail(tarefaId),
    queryFn: () => service.getTask(tarefaId),
    enabled: Boolean(tarefaId),
  });
  const task = taskQuery.data ?? null;
  const loading = taskQuery.isPending;
  const transitionMutation = useMutation({
    mutationFn: ({ action, justification }: { action: TaskAction; justification?: string }) =>
      service.transitionTask(tarefaId, action, justification),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Nao foi possivel concluir a acao."),
  });
  const removeMutation = useMutation({
    mutationFn: (justification: string) => service.removeTask(tarefaId, justification),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      navigate("/app/tarefas-rotinas");
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Nao foi possivel remover."),
  });
  const acting = transitionMutation.isPending || removeMutation.isPending;

  if (!viewer) return null;
  if (loading && !task) return <LoadingState message="Carregando tarefa..." />;
  if (!task) return <FeedbackState tone="error" title="Tarefa indisponível" description={error} />;

  const actions = availableTaskActions(task, viewer);

  function transition(action: TaskAction, justification?: string) {
    setError(undefined);
    transitionMutation.mutate({ action, justification });
  }

  return (
    <Page className="tasks-module">
      <Link to="/app/tarefas-rotinas">Voltar para tarefas</Link>
      <PageHeader
        eyebrow="Tarefa"
        title={task.titulo}
        description={task.descricao || "Sem descrição."}
        actions={
          canEditTask(task, viewer) ? (
            <ButtonLink variant="outline" to={`/app/tarefas-rotinas/${task.id}/editar`}>
              Editar
            </ButtonLink>
          ) : null
        }
      />
      {error ? (
        <p className="tasks-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="tasks-detail-grid">
        <Card padding="lg">
          <h2>Dados da tarefa</h2>
          <dl>
            <dt>Status</dt>
            <dd>
              <StatusBadge tone={STATUS_TONE[task.status]}>{STATUS_LABEL[task.status]}</StatusBadge>
            </dd>
            <dt>Responsáveis</dt>
            <dd>{task.responsaveis.map(({ nome }) => nome).join(", ")}</dd>
            <dt>Posto</dt>
            <dd>{task.posto?.nome ?? "Geral"}</dd>
            <dt>Prioridade</dt>
            <dd>{task.prioridade?.nome ?? "Não informada"}</dd>
            <dt>Prazo</dt>
            <dd>
              {task.prazo_data ?? "Sem prazo"} {task.horario_limite?.slice(0, 5) ?? ""}
            </dd>
            <dt>Origem</dt>
            <dd>{task.rotina_id ? "Rotina recorrente" : task.tipo}</dd>
          </dl>
        </Card>
        <Card padding="lg">
          <h2>Ações</h2>
          <div className="tasks-detail-actions">
            {actions.map((action) => (
              <Button
                key={action}
                loading={acting}
                variant={action === "reabrir" ? "outline" : "primary"}
                onClick={() => (action === "reabrir" ? setReopenOpen(true) : void transition(action))}
              >
                {ACTION_LABEL[action]}
              </Button>
            ))}
            {actions.length === 0 ? <p>Nenhuma ação disponível no estado atual.</p> : null}
          </div>
        </Card>
        <Card padding="lg">
          <h2>Registro operacional</h2>
          <dl>
            <dt>Criada em</dt>
            <dd>{new Date(task.created_at).toLocaleString("pt-BR")}</dd>
            {task.iniciada_em ? (
              <>
                <dt>Iniciada em</dt>
                <dd>{new Date(task.iniciada_em).toLocaleString("pt-BR")}</dd>
              </>
            ) : null}
            {task.concluida_em ? (
              <>
                <dt>Concluída em</dt>
                <dd>{new Date(task.concluida_em).toLocaleString("pt-BR")}</dd>
              </>
            ) : null}
            {task.validada_em ? (
              <>
                <dt>Validada em</dt>
                <dd>{new Date(task.validada_em).toLocaleString("pt-BR")}</dd>
              </>
            ) : null}
            {task.reaberta_em ? (
              <>
                <dt>Reaberta em</dt>
                <dd>
                  {new Date(task.reaberta_em).toLocaleString("pt-BR")} ·{" "}
                  {task.justificativa_reabertura}
                </dd>
              </>
            ) : null}
          </dl>
        </Card>
      </section>
      {viewer.perfil !== "operador" ? (
        <Button variant="danger" onClick={() => setRemoveOpen(true)}>
          Remover tarefa
        </Button>
      ) : null}
      <RemovalAlertDialog
        open={reopenOpen}
        title="Reabrir tarefa"
        description="Informe a justificativa para reabrir a tarefa. A acao sera registrada na auditoria."
        confirmLabel="Reabrir"
        justificationLabel="Justificativa da reabertura"
        requireJustification
        loading={transitionMutation.isPending}
        onOpenChange={setReopenOpen}
        onConfirm={(justification) => {
          setError(undefined);
          transition("reabrir", justification);
          setReopenOpen(false);
        }}
      />
      <RemovalAlertDialog
        open={removeOpen}
        title="Remover tarefa"
        description="Esta acao remove logicamente a tarefa e exige justificativa para auditoria."
        requireJustification
        loading={removeMutation.isPending}
        onOpenChange={setRemoveOpen}
        onConfirm={(justification) => {
          setError(undefined);
          removeMutation.mutate(justification);
        }}
      />
      <EntityHistory entityType="tarefas" entityId={task.id} />
    </Page>
  );
}

export default TaskDetailPage;
