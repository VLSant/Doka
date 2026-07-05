import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Drawer } from "../../../components/ui/Drawer";
import type { CatalogService } from "../../../services/catalog-service";
import { useAuth } from "../../auth/AuthProvider";
import { TaskForm } from "../components/TaskForm";
import { createTaskService, type TaskService } from "../task-service";
import type { Task, TaskError, TaskViewer } from "../types";
import { useTaskCatalogs } from "../use-task-catalogs";
import "../tasks.css";

export function TaskFormPage({
  service: injected,
  catalogService,
  viewer: injectedViewer,
}: {
  service?: TaskService;
  catalogService?: CatalogService;
  viewer?: TaskViewer;
}) {
  const { tarefaId } = useParams();
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
  const {
    catalogs,
    loading: catalogsLoading,
    error: catalogsError,
  } = useTaskCatalogs(catalogService);
  const [task, setTask] = useState<Task | undefined>();
  const [loading, setLoading] = useState(Boolean(tarefaId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!tarefaId) return;
    void service
      .getTask(tarefaId)
      .then(setTask)
      .catch((cause: TaskError) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [service, tarefaId]);

  if (!viewer) return null;
  if (loading || catalogsLoading) return <LoadingState message="Preparando formulário..." />;
  if (catalogsError || (tarefaId && !task))
    return (
      <FeedbackState
        tone="error"
        title="Não foi possível abrir a tarefa"
        description={error ?? catalogsError?.message}
      />
    );

  const closeTarget = task ? `/app/tarefas-rotinas/${task.id}` : "/app/tarefas-rotinas";
  return (
    <Drawer
      open
      size="xl"
      title={task ? "Editar tarefa" : "Nova tarefa"}
      description="Preencha os dados operacionais da tarefa."
      onClose={() => navigate(closeTarget)}
    >
      <TaskForm
        initial={task}
        viewer={viewer}
        {...catalogs}
        saving={saving}
        error={error}
        onCancel={() => navigate(closeTarget)}
        onSubmit={async (input) => {
          setSaving(true);
          setError(undefined);
          try {
            const saved = task
              ? await service.updateTask(task.id, input, viewer.perfil !== "operador", task.tipo)
              : await service.createTask(input);
            navigate(`/app/tarefas-rotinas/${saved.id}`);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Não foi possível salvar a tarefa.");
          } finally {
            setSaving(false);
          }
        }}
      />
    </Drawer>
  );
}

export default TaskFormPage;
