import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "../../../app/query-keys";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalHeader,
  AppModalSubtitle,
  AppModalTitle,
} from "../../../components/shadcn/AppModal";
import type { CatalogService } from "../../../services/catalog-service";
import { TaskForm } from "./TaskForm";
import { createTaskService, type TaskService } from "../task-service";
import type { TaskViewer } from "../types";
import { useTaskCatalogs } from "../use-task-catalogs";

interface TaskFormModalProps {
  tarefaId?: string;
  viewer: TaskViewer;
  service?: TaskService;
  catalogService?: CatalogService;
  onClose: () => void;
}

export function TaskFormModal({
  tarefaId,
  viewer,
  service: injected,
  catalogService,
  onClose,
}: TaskFormModalProps) {
  const service = useMemo(() => injected ?? createTaskService(), [injected]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { catalogs, loading: catalogsLoading, error: catalogsError } = useTaskCatalogs(catalogService);
  const [error, setError] = useState<string>();

  const taskQuery = useQuery({
    queryKey: queryKeys.tasks.detail(tarefaId ?? "novo"),
    queryFn: () => service.getTask(tarefaId ?? ""),
    enabled: Boolean(tarefaId),
  });
  const task = taskQuery.data;
  const editing = Boolean(tarefaId);
  const loading = catalogsLoading || (editing && taskQuery.isPending);

  const saveMutation = useMutation({
    mutationFn: (input: Parameters<typeof service.createTask>[0]) =>
      task
        ? service.updateTask(task.id, input, viewer.perfil !== "operador", task.tipo)
        : service.createTask(input),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      navigate(`/app/tarefas-rotinas/${saved.id}`);
    },
    onError: (cause) =>
      setError(cause instanceof Error ? cause.message : "Nao foi possivel salvar a tarefa."),
  });

  return (
    <AppModal open onOpenChange={(open) => (open ? undefined : onClose())}>
      <AppModalContent size="lg">
        <AppModalHeader>
          <AppModalTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</AppModalTitle>
          <AppModalSubtitle>Preencha os dados operacionais da tarefa.</AppModalSubtitle>
        </AppModalHeader>
        <AppModalBody className="pb-6">
          {loading ? <LoadingState message="Preparando formulario..." /> : null}
          {catalogsError || (editing && taskQuery.error) || (editing && !loading && !task) ? (
            <FeedbackState
              tone="error"
              title="Nao foi possivel abrir a tarefa"
              description={error ?? catalogsError?.message ?? taskQuery.error?.message}
            />
          ) : null}
          {!loading && !(catalogsError || (editing && !task)) ? (
            <TaskForm
              initial={task}
              viewer={viewer}
              {...catalogs}
              saving={saveMutation.isPending}
              error={error}
              onCancel={onClose}
              onSubmit={(input) => {
                setError(undefined);
                saveMutation.mutate(input);
              }}
            />
          ) : null}
        </AppModalBody>
      </AppModalContent>
    </AppModal>
  );
}
