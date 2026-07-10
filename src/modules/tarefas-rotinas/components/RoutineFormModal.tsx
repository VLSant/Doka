import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { Button } from "../../../components/ui/Button";
import type { CatalogService } from "../../../services/catalog-service";
import { RoutineForm } from "./RoutineForm";
import { createTaskService, type TaskService } from "../task-service";
import type { TaskViewer } from "../types";
import { useTaskCatalogs } from "../use-task-catalogs";

interface RoutineFormModalProps {
  rotinaId?: string;
  viewer: TaskViewer;
  service?: TaskService;
  catalogService?: CatalogService;
  onClose: () => void;
}

export function RoutineFormModal({
  rotinaId,
  viewer,
  service: injected,
  catalogService,
  onClose,
}: RoutineFormModalProps) {
  const service = useMemo(() => injected ?? createTaskService(), [injected]);
  const queryClient = useQueryClient();
  const { catalogs, loading: catalogsLoading, error: catalogsError } = useTaskCatalogs(catalogService);
  const [error, setError] = useState<string>();
  const [removeOpen, setRemoveOpen] = useState(false);

  const routineQuery = useQuery({
    queryKey: queryKeys.routines.detail(rotinaId ?? "nova"),
    queryFn: () => service.getRoutine(rotinaId ?? ""),
    enabled: Boolean(rotinaId),
  });
  const routine = routineQuery.data;
  const editing = Boolean(rotinaId);
  const loading = catalogsLoading || (editing && routineQuery.isPending);

  const saveMutation = useMutation({
    mutationFn: (input: Parameters<typeof service.createRoutine>[0]) =>
      routine ? service.updateRoutine(routine.id, input) : service.createRoutine(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      onClose();
    },
    onError: (cause) =>
      setError(cause instanceof Error ? cause.message : "Nao foi possivel salvar a rotina."),
  });
  const removeMutation = useMutation({
    mutationFn: (justification: string) => service.removeRoutine(rotinaId ?? "", justification),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      onClose();
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : "Nao foi possivel remover."),
  });

  return (
    <AppModal open onOpenChange={(open) => (open ? undefined : onClose())}>
      <AppModalContent size="lg">
        <AppModalHeader>
          <AppModalTitle>{editing ? "Editar rotina" : "Nova rotina"}</AppModalTitle>
          <AppModalSubtitle>Configure a recorrencia e os responsaveis.</AppModalSubtitle>
        </AppModalHeader>
        <AppModalBody className="pb-6">
          {loading ? <LoadingState message="Preparando rotina..." /> : null}
          {catalogsError || (editing && routineQuery.error) || (editing && !loading && !routine) ? (
            <FeedbackState
              tone="error"
              title="Nao foi possivel abrir a rotina"
              description={error ?? catalogsError?.message ?? routineQuery.error?.message}
            />
          ) : null}
          {!loading && !(catalogsError || (editing && !routine)) ? (
            <>
              <RoutineForm
                initial={routine}
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
              {routine ? (
                <Button
                  variant="danger"
                  loading={removeMutation.isPending}
                  onClick={() => setRemoveOpen(true)}
                >
                  Remover rotina
                </Button>
              ) : null}
            </>
          ) : null}
        </AppModalBody>
      </AppModalContent>
      <RemovalAlertDialog
        open={removeOpen}
        title="Remover rotina"
        description="Esta acao remove logicamente a rotina e exige justificativa para auditoria."
        requireJustification
        loading={removeMutation.isPending}
        onOpenChange={setRemoveOpen}
        onConfirm={(justification) => {
          setError(undefined);
          removeMutation.mutate(justification);
        }}
      />
    </AppModal>
  );
}
