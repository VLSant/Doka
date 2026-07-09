import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import type { CatalogService } from "../../../services/catalog-service";
import { useAuth } from "../../auth/AuthProvider";
import { RoutineForm } from "../components/RoutineForm";
import { createTaskService, type TaskService } from "../task-service";
import type { TaskViewer } from "../types";
import { useTaskCatalogs } from "../use-task-catalogs";
import "../tasks.css";

export function RoutineFormPage({
  service: injected,
  catalogService,
  viewer: injectedViewer,
}: {
  service?: TaskService;
  catalogService?: CatalogService;
  viewer?: TaskViewer;
}) {
  const { rotinaId } = useParams();
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

  const routineQuery = useQuery({
    queryKey: queryKeys.routines.detail(rotinaId ?? "nova"),
    queryFn: () => service.getRoutine(rotinaId ?? ""),
    enabled: Boolean(rotinaId),
  });
  const routine = routineQuery.data;
  const loading = Boolean(rotinaId) && routineQuery.isPending;
  const saveMutation = useMutation({
    mutationFn: (input: Parameters<typeof service.createRoutine>[0]) =>
      routine ? service.updateRoutine(routine.id, input) : service.createRoutine(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      navigate("/app/tarefas-rotinas/rotinas");
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Nao foi possivel salvar a rotina."),
  });
  const removeMutation = useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) =>
      service.removeRoutine(id, justification),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      navigate("/app/tarefas-rotinas/rotinas");
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Nao foi possivel remover."),
  });

  if (!viewer) return null;
  if (viewer.perfil === "operador")
    return (
      <FeedbackState
        tone="error"
        title="Acesso negado"
        description="Somente Supervisão e Direção podem administrar rotinas."
      />
    );
  if (loading || catalogsLoading) return <LoadingState message="Preparando rotina..." />;
  if (catalogsError || (rotinaId && !routine))
    return (
      <FeedbackState
        tone="error"
        title="Não foi possível abrir a rotina"
        description={error ?? catalogsError?.message ?? routineQuery.error?.message}
      />
    );

  return (
    <Drawer
      open
      size="lg"
      title={routine ? "Editar rotina" : "Nova rotina"}
      description="Configure a recorrência e os responsáveis."
      onClose={() => navigate("/app/tarefas-rotinas/rotinas")}
    >
      <RoutineForm
        initial={routine}
        viewer={viewer}
        {...catalogs}
        saving={saveMutation.isPending}
        error={error}
        onCancel={() => navigate("/app/tarefas-rotinas/rotinas")}
        onSubmit={(input) => {
          setError(undefined);
          saveMutation.mutate(input);
        }}
      />
      {routine ? (
        <Button
          variant="danger" loading={removeMutation.isPending}
          onClick={() => {
            const justification = window.prompt("Justificativa da remocao:")?.trim();
            if (!justification || !routine) return;
            setError(undefined);
            removeMutation.mutate({ id: routine.id, justification });
          }}
        >
          Remover rotina
        </Button>
      ) : null}
    </Drawer>
  );
}

export default RoutineFormPage;
