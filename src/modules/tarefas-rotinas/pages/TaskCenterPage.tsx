import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { Card } from "../../../components/ui/Card";
import { Tabs } from "../../../components/ui/Tabs";
import type { CatalogService } from "../../../services/catalog-service";
import { useAuth } from "../../auth/AuthProvider";
import { TaskFiltersForm } from "../components/TaskFilters";
import { TaskList } from "../components/TaskList";
import { createTaskService, type TaskService } from "../task-service";
import { taskMatchesSlice } from "../task-state";
import type { Task, TaskFilters, TaskViewer } from "../types";
import { useTaskCatalogs } from "../use-task-catalogs";
import "../tasks.css";

const SLICES: { id: TaskFilters["slice"]; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "pendentes", label: "Pendentes" },
  { id: "atrasadas", label: "Atrasadas" },
  { id: "validacao", label: "Aguardando validação" },
  { id: "concluidas", label: "Concluídas" },
  { id: "todas", label: "Todas" },
];

export function TaskCenterPage({
  service: injected,
  catalogService,
  viewer: injectedViewer,
}: {
  service?: TaskService;
  catalogService?: CatalogService;
  viewer?: TaskViewer;
}) {
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
  const { catalogs } = useTaskCatalogs(catalogService);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({ slice: "hoje" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await service.generateRoutineTasks();
      setTasks(await service.listTasks());
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Não foi possível carregar as tarefas."));
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Initial Data API synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);
  const visible = useMemo(
    () => tasks.filter((task) => taskMatchesSlice(task, filters)),
    [filters, tasks],
  );

  if (!viewer) return null;

  return (
    <Page className="tasks-module">
      <PageHeader
        eyebrow="Operação"
        title="Tarefas e rotinas"
        description="Acompanhe o trabalho diário e as atividades recorrentes."
        actions={
          <>
            {viewer.perfil !== "operador" ? <ButtonLink variant="outline" to="/app/tarefas-rotinas/rotinas">Rotinas</ButtonLink> : null}
            <ButtonLink to="/app/tarefas-rotinas/nova">Nova tarefa</ButtonLink>
          </>
        }
      />
      <Tabs
        label="Recortes de tarefas"
        value={filters.slice}
        items={SLICES}
        onChange={(slice) => setFilters((current) => ({ ...current, slice }))}
      />
      <Card padding="lg">
        <TaskFiltersForm value={filters} postos={catalogs.postos} usuarios={catalogs.usuarios} prioridades={catalogs.prioridades} disabled={loading} onChange={setFilters} />
      </Card>
      {loading && tasks.length === 0 ? <LoadingState message="Carregando tarefas..." /> : null}
      {error ? <FeedbackState tone="error" title="Falha ao carregar tarefas" description={error.message} actions={<Button onClick={() => void load()}>Tentar novamente</Button>} /> : null}
      {!loading && !error && visible.length === 0 ? <FeedbackState tone="empty" title="Nenhuma tarefa encontrada" description="Não há tarefas neste recorte ou nos filtros selecionados." actions={<ButtonLink to="/app/tarefas-rotinas/nova">Nova tarefa</ButtonLink>} /> : null}
      {visible.length > 0 ? (
        <>
          <p role="status">{visible.length} tarefa(s) exibida(s){loading ? " · Atualizando..." : ""}</p>
          <TaskList tasks={visible} />
        </>
      ) : null}
    </Page>
  );
}

export default TaskCenterPage;
