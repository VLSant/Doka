import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Edit3, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { queryKeys } from "../../../app/query-keys";
import { runBatch } from "../../../lib/batch";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { Button } from "../../../components/ui/Button";
import { RowActionsMenu } from "../../../components/ui/RowActionsMenu";
import { SidebarActionList } from "../../../components/ui/SidebarActionList";
import { Skeleton } from "../../../components/ui/Skeleton";
import { StatusBadge, type StatusTone } from "../../../components/ui/StatusBadge";
import {
  TableCardHeader,
  TableCardList,
  TableCardRow,
  type TableCardHeaderColumn,
} from "../../../components/ui/TableCardRow";
import { useAuth } from "../../auth/AuthProvider";
import { usePostoFilter } from "../../../app/posto-filter";
import { RoutineFormModal } from "../components/RoutineFormModal";
import { createTaskService, type TaskService } from "../task-service";
import type { Routine, TaskViewer } from "../types";
import { applySort, toggleSort, type SortState } from "../../../lib/sorting";
import "../tasks.css";

const RECURRENCE = {
  diaria: "Diaria",
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

type RoutineSortKey = "rotina";

function getColumns(
  sort: SortState<RoutineSortKey>,
  onSort: (key: RoutineSortKey) => void,
): TableCardHeaderColumn[] {
  return [
    {
      key: "rotina",
      label: "Rotina",
      width: "minmax(220px, 1.6fr)",
      sortable: true,
      active: sort.key === "rotina",
      direction: sort.direction,
      onSort: () => onSort("rotina"),
    },
    { key: "frequencia", label: "Frequencia", width: "130px" },
    { key: "responsaveis", label: "Responsaveis", width: "minmax(160px, 1fr)" },
    { key: "posto", label: "Posto", width: "130px" },
    { key: "status", label: "Status", width: "120px" },
  ];
}

export function RoutineListPage({
  service: injected,
  viewer: injectedViewer,
}: {
  service?: TaskService;
  viewer?: TaskViewer;
}) {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [removeTarget, setRemoveTarget] = useState<string[] | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [sort, setSort] = useState<SortState<RoutineSortKey>>({ key: null, direction: "asc" });
  const creating = searchParams.get("nova") === "1";
  const editingId = searchParams.get("editar");
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
  const routinesQuery = useQuery({
    queryKey: queryKeys.routines.list(),
    queryFn: () => service.listRoutines(),
  });
  // A pagina de rotinas nao tem filtro local de posto; o filtro global da
  // topbar entao se aplica diretamente como unico recorte por posto.
  const { postoId: globalPostoId } = usePostoFilter();
  const routines = useMemo(() => {
    const scoped = globalPostoId
      ? (routinesQuery.data ?? []).filter((routine) => routine.posto_id === globalPostoId)
      : (routinesQuery.data ?? []);
    return applySort(scoped, sort, (routine) => routine.nome);
  }, [routinesQuery.data, sort, globalPostoId]);
  const loading = routinesQuery.isPending;
  const error = routinesQuery.error?.message;
  const selectedItems = routines.filter((routine) => selectedIds.has(routine.id));
  const firstSelected = selectedItems[0];

  function handleSort(key: RoutineSortKey) {
    setSort((current) => toggleSort(current, key));
  }

  function openCreate() {
    setSearchParams(
      (params) => {
        params.set("nova", "1");
        params.delete("editar");
        return params;
      },
      { replace: false },
    );
  }

  function openEdit(id: string) {
    setSearchParams(
      (params) => {
        params.set("editar", id);
        params.delete("nova");
        return params;
      },
      { replace: false },
    );
  }

  function closeFormModal() {
    setSearchParams(
      (params) => {
        params.delete("nova");
        params.delete("editar");
        return params;
      },
      { replace: false },
    );
  }

  const duplicateMutation = useMutation({
    mutationFn: (routine: Routine) =>
      service.createRoutine({
        nome: `${routine.nome} (copia)`,
        descricao: routine.descricao ?? undefined,
        postoId: routine.posto_id ?? undefined,
        cargoFuncaoId: routine.cargo_funcao_id ?? undefined,
        prioridadeId: routine.prioridade_id ?? undefined,
        recorrencia: routine.recorrencia,
        diasSemana: routine.dias_semana ?? undefined,
        diaMes: routine.dia_mes ?? undefined,
        horarioLimite: routine.horario_limite ?? undefined,
        exigeValidacao: routine.exige_validacao,
        dataInicio: routine.data_inicio,
        dataFim: routine.data_fim ?? undefined,
        responsaveis: routine.responsaveis.map((item) => item.id),
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao duplicar rotina.")),
  });
  const removeMutation = useMutation({
    mutationFn: ({ ids, justification }: { ids: string[]; justification: string }) =>
      runBatch(
        ids,
        (id) => service.removeRoutine(id, justification),
        (failed, total) =>
          `Falha ao remover ${failed} de ${total} rotina(s); as demais foram removidas.`,
      ),
    onSuccess: () => {
      setRemoveTarget(null);
      setSelectedIds(new Set());
      setActionError(null);
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao remover rotina.")),
    onSettled: async () => {
      // Invalida mesmo em falha parcial: itens já removidos saem da lista.
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((current) => {
      const ids = routines.map((routine) => routine.id);
      const allSelected = ids.length > 0 && ids.every((id) => current.has(id));
      const next = new Set(current);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  if (!viewer) return null;
  if (viewer.perfil === "operador")
    return (
      <FeedbackState
        tone="error"
        title="Acesso negado"
        description="Somente Supervisao e Direcao podem administrar rotinas."
      />
    );
  return (
    <Page className="tasks-module">
      <PageHeader
        eyebrow="Operacao"
        title="Rotinas recorrentes"
        description="Atividades geradas automaticamente conforme a frequencia configurada."
        actions={<Button onClick={openCreate}>Nova rotina</Button>}
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
      {actionError ? (
        <FeedbackState
          tone="error"
          title="A acao nao foi concluida"
          description={actionError.message}
        />
      ) : null}
      {!loading && !error && routines.length === 0 ? (
        <FeedbackState
          tone="empty"
          title="Nenhuma rotina cadastrada"
          description="Crie uma rotina para gerar tarefas recorrentes."
          actions={<Button onClick={openCreate}>Nova rotina</Button>}
        />
      ) : null}
      {routines.length ? (
        <TableCardList>
          <TableCardHeader
            columns={getColumns(sort, handleSort)}
            allSelected={routines.length > 0 && routines.every((routine) => selectedIds.has(routine.id))}
            someSelected={routines.some((routine) => selectedIds.has(routine.id))}
            onToggleAll={toggleAll}
          />
          {routines.map((routine) => (
            <TableCardRow
              key={routine.id}
              id={routine.id}
              selected={selectedIds.has(routine.id)}
              onToggleSelect={toggleSelected}
              columns={[
                {
                  key: "rotina",
                  label: "Rotina",
                  width: "minmax(220px, 1.6fr)",
                  value: (
                    <>
                      <strong>{routine.nome}</strong>
                      <span className="doka-card-row__muted">Desde {routine.data_inicio}</span>
                    </>
                  ),
                },
                {
                  key: "frequencia",
                  label: "Frequencia",
                  width: "130px",
                  value: RECURRENCE[routine.recorrencia],
                },
                {
                  key: "responsaveis",
                  label: "Responsaveis",
                  width: "minmax(160px, 1fr)",
                  value: routine.responsaveis.map(({ nome }) => nome).join(", ") || "Nao informado",
                },
                { key: "posto", label: "Posto", width: "130px", value: routine.posto?.nome ?? "Geral" },
                {
                  key: "status",
                  label: "Status",
                  width: "120px",
                  value: <StatusBadge tone={STATUS_TONE[routine.status]}>{STATUS_LABEL[routine.status]}</StatusBadge>,
                },
              ]}
              actions={
                <RowActionsMenu
                  onEdit={() => openEdit(routine.id)}
                  onDuplicate={() => duplicateMutation.mutate(routine)}
                  onRemove={() => setRemoveTarget([routine.id])}
                />
              }
            />
          ))}
        </TableCardList>
      ) : null}
      {selectedItems.length > 0 ? (
        <SidebarActionList
          summary={
            <>
              <span>Selecionadas</span>
              <strong>{selectedItems.length}</strong>
              <span>{selectedItems.filter((routine) => routine.status === "ativa").length} ativas</span>
            </>
          }
          onClear={() => setSelectedIds(new Set())}
          items={[
            {
              label: "Editar primeira",
              icon: <Edit3 size={15} aria-hidden="true" />,
              disabled: !firstSelected,
              onClick: () => firstSelected && openEdit(firstSelected.id),
            },
            {
              label: "Duplicar primeira",
              icon: <Copy size={15} aria-hidden="true" />,
              disabled: !firstSelected || duplicateMutation.isPending,
              onClick: () => firstSelected && duplicateMutation.mutate(firstSelected),
            },
            {
              label: "Excluir selecionadas",
              icon: <Trash2 size={15} aria-hidden="true" />,
              variant: "destructive",
              disabled: removeMutation.isPending,
              onClick: () => setRemoveTarget(selectedItems.map((routine) => routine.id)),
            },
          ]}
        />
      ) : null}
      {creating || editingId ? (
        <RoutineFormModal
          rotinaId={editingId ?? undefined}
          viewer={viewer}
          service={injected}
          onClose={closeFormModal}
        />
      ) : null}
      <RemovalAlertDialog
        open={Boolean(removeTarget)}
        title="Remover rotina"
        description="Esta acao remove logicamente a rotina e exige justificativa para auditoria."
        requireJustification
        loading={removeMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={(justification) => {
          if (removeTarget) removeMutation.mutate({ ids: removeTarget, justification });
        }}
      />
    </Page>
  );
}

export default RoutineListPage;
