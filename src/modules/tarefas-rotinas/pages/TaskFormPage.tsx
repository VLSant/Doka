import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Drawer } from "../../../components/ui/Drawer";
import type { CatalogService } from "../../../services/catalog-service";
import { useAuth } from "../../auth/AuthProvider";
import { TaskForm } from "../components/TaskForm";
import { createTaskService, type TaskService } from "../task-service";
import type { TaskViewer } from "../types";
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
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();

  const taskQuery = useQuery({
    queryKey: queryKeys.tasks.detail(tarefaId ?? "novo"),
    queryFn: () => service.getTask(tarefaId ?? ""),
    enabled: Boolean(tarefaId),
  });
  const task = taskQuery.data;
  const loading = Boolean(tarefaId) && taskQuery.isPending;
  const saveMutation = useMutation({
    mutationFn: (input: Parameters<typeof service.createTask>[0]) =>
      task
        ? service.updateTask(task.id, input, viewer?.perfil !== "operador", task.tipo)
        : service.createTask(input),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      navigate(`/app/tarefas-rotinas/${saved.id}`);
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Nao foi possivel salvar a tarefa."),
  });

  if (!viewer) return null;
  if (loading || catalogsLoading) return <LoadingState message="Preparando formulário..." />;
  if (catalogsError || (tarefaId && !task))
    return (
      <FeedbackState
        tone="error"
        title="Não foi possível abrir a tarefa"
        description={error ?? catalogsError?.message ?? taskQuery.error?.message}
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
        saving={saveMutation.isPending}
        error={error}
        onCancel={() => navigate(closeTarget)}
        onSubmit={(input) => {
          setError(undefined);
          saveMutation.mutate(input);
        }}
      />
    </Drawer>
  );
}

export default TaskFormPage;
