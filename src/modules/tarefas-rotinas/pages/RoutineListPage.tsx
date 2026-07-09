import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Link, useNavigate } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { TableFrame } from "../../../components/ui/Patterns";
import { StatusBadge, type StatusTone } from "../../../components/ui/StatusBadge";
import { useAuth } from "../../auth/AuthProvider";
import { createTaskService, type TaskService } from "../task-service";
import type { Routine, TaskViewer } from "../types";
import "../tasks.css";

const RECURRENCE = {
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

const STATUS_LABEL: Record<Routine["status"], string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  inativa: "Inativa",
};

const STATUS_TONE: Record<Routine["status"], StatusTone> = {
  ativa: "success",
  pausada: "warning",
  inativa: "neutral",
};

export function RoutineListPage({
  service: injected,
  viewer: injectedViewer,
}: {
  service?: TaskService;
  viewer?: TaskViewer;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
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
  const routinesQuery = useQuery({
    queryKey: queryKeys.routines.list(),
    queryFn: () => service.listRoutines(),
  });
  const routines = routinesQuery.data ?? [];
  const loading = routinesQuery.isPending;
  const error = routinesQuery.error?.message;

  if (!viewer) return null;
  if (viewer.perfil === "operador")
    return (
      <FeedbackState
        tone="error"
        title="Acesso negado"
        description="Somente Supervisão e Direção podem administrar rotinas."
      />
    );
  return (
    <Page className="tasks-module">
      <PageHeader
        eyebrow="Operação"
        title="Rotinas recorrentes"
        description="Atividades geradas automaticamente conforme a frequência configurada."
        actions={<ButtonLink to="/app/tarefas-rotinas/rotinas/nova">Nova rotina</ButtonLink>}
      />
      <Link to="/app/tarefas-rotinas">Voltar para tarefas</Link>
      {loading ? <Skeleton message="Carregando rotinas..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Falha ao carregar rotinas"
          description={error}
          actions={<Button onClick={() => void routinesQuery.refetch()}>Tentar novamente</Button>}
        />
      ) : null}
      {!loading && !error && routines.length === 0 ? (
        <FeedbackState
          tone="empty"
          title="Nenhuma rotina cadastrada"
          description="Crie uma rotina para gerar tarefas recorrentes."
          actions={<ButtonLink to="/app/tarefas-rotinas/rotinas/nova">Nova rotina</ButtonLink>}
        />
      ) : null}
      {routines.length ? (
        <TableFrame>
          <table>
            <thead>
              <tr>
                <th>Rotina</th>
                <th>Frequência</th>
                <th>Responsáveis</th>
                <th>Posto</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {routines.map((routine) => (
                <tr key={routine.id}>
                  <td>
                    <strong>{routine.nome}</strong>
                    <small className="tasks-table__meta">Desde {routine.data_inicio}</small>
                  </td>
                  <td>{RECURRENCE[routine.recorrencia]}</td>
                  <td>{routine.responsaveis.map(({ nome }) => nome).join(", ")}</td>
                  <td>{routine.posto?.nome ?? "Geral"}</td>
                  <td>
                    <StatusBadge tone={STATUS_TONE[routine.status]}>
                      {STATUS_LABEL[routine.status]}
                    </StatusBadge>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/tarefas-rotinas/rotinas/${routine.id}/editar`)}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      ) : null}
    </Page>
  );
}

export default RoutineListPage;
