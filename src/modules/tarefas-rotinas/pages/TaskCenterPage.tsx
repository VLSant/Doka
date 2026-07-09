import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Edit3, Trash2 } from "lucide-react";
import { queryKeys } from "../../../app/query-keys";
import { runBatch } from "../../../lib/batch";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips, type FilterChip } from "../../../components/ui/FilterChips";
import { Pagination } from "../../../components/ui/Pagination";
import { SearchInput } from "../../../components/ui/SearchInput";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import { Skeleton } from "../../../components/ui/Skeleton";
import { SidebarActionList } from "../../../components/ui/SidebarActionList";
import { Tabs } from "../../../components/ui/Tabs";
import type { CatalogService } from "../../../services/catalog-service";
import { useAuth } from "../../auth/AuthProvider";
import { useSearchParams } from "react-router-dom";
import { TaskFiltersForm } from "../components/TaskFilters";
import { TaskFormModal } from "../components/TaskFormModal";
import { TaskList } from "../components/TaskList";
import { createTaskService, type TaskService } from "../task-service";
import { taskMatchesSlice } from "../task-state";
import type { TaskFilters, TaskViewer } from "../types";
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
  const [filters, setFilters] = useState<TaskFilters>({ slice: "hoje" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [removeTarget, setRemoveTarget] = useState<string[] | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const creating = searchParams.get("novo") === "1";
  const editingId = searchParams.get("editar");
  const pageSize = 25;

  const queryClient = useQueryClient();
  // A geração de tarefas de rotina é uma escrita: roda a cada visita à tela,
  // fora da queryFn, para não ficar presa ao staleTime do cache de leitura.
  useEffect(() => {
    let cancelled = false;
    service
      .generateRoutineTasks()
      .then(() => {
        if (!cancelled) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
        }
      })
      .catch(() => {
        // Falha na geração não bloqueia a listagem.
      });
    return () => {
      cancelled = true;
    };
  }, [service, queryClient]);

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks.list(),
    queryFn: () => service.listTasks(),
  });
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const loading = tasksQuery.isPending;
  const error = tasksQuery.error;
  const visible = useMemo(
    () => tasks.filter((task) => taskMatchesSlice(task, filters)),
    [filters, tasks],
  );
  const paged = visible.slice((page - 1) * pageSize, page * pageSize);
  const advancedCount = [
    filters.postoId,
    filters.responsavelId,
    filters.prioridadeId,
    filters.tipo,
    filters.prazoDe,
    filters.prazoAte,
  ].filter(Boolean).length;
  const chips = useMemo<FilterChip[]>(() => {
    const result: FilterChip[] = [];
    const label = (items: Array<{ id: string; nome: string }>, id?: string) =>
      items.find((item) => item.id === id)?.nome ?? id;
    if (filters.postoId)
      result.push({ id: "postoId", label: `Posto: ${label(catalogs.postos, filters.postoId)}` });
    if (filters.responsavelId)
      result.push({
        id: "responsavelId",
        label: `Responsável: ${label(catalogs.usuarios, filters.responsavelId)}`,
      });
    if (filters.prioridadeId)
      result.push({
        id: "prioridadeId",
        label: `Prioridade: ${label(catalogs.prioridades, filters.prioridadeId)}`,
      });
    if (filters.tipo) result.push({ id: "tipo", label: `Tipo: ${filters.tipo}` });
    if (filters.prazoDe) result.push({ id: "prazoDe", label: `Prazo desde ${filters.prazoDe}` });
    if (filters.prazoAte) result.push({ id: "prazoAte", label: `Prazo até ${filters.prazoAte}` });
    return result;
  }, [catalogs, filters]);
  const updateFilters = useCallback((next: TaskFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  function openCreate() {
    setSearchParams(
      (params) => {
        params.set("novo", "1");
        params.delete("editar");
        return params;
      },
      { replace: false },
    );
  }

  function closeFormModal() {
    setSearchParams(
      (params) => {
        params.delete("novo");
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
        params.delete("novo");
        return params;
      },
      { replace: false },
    );
  }

  const selectedItems = visible.filter((task) => selectedIds.has(task.id));
  const firstSelected = selectedItems[0];
  const duplicateMutation = useMutation({
    mutationFn: (task: (typeof visible)[number]) =>
      service.createTask({
        titulo: `${task.titulo} (copia)`,
        descricao: task.descricao ?? undefined,
        tipo: task.tipo === "rotina" ? "avulsa" : task.tipo,
        postoId: task.posto_id ?? undefined,
        cargoFuncaoId: task.cargo_funcao_id ?? undefined,
        prioridadeId: task.prioridade_id ?? undefined,
        prazoData: task.prazo_data ?? undefined,
        horarioLimite: task.horario_limite ?? undefined,
        exigeValidacao: task.exige_validacao,
        observacoes: task.observacoes ?? undefined,
        responsaveis: task.responsaveis.map((item) => item.id),
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao duplicar tarefa.")),
  });
  const removeMutation = useMutation({
    mutationFn: ({ ids, justification }: { ids: string[]; justification: string }) =>
      runBatch(
        ids,
        (id) => service.removeTask(id, justification),
        (failed, total) =>
          `Falha ao remover ${failed} de ${total} tarefa(s); as demais foram removidas.`,
      ),
    onSuccess: () => {
      setRemoveTarget(null);
      setSelectedIds(new Set());
      setActionError(null);
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao remover tarefa.")),
    onSettled: async () => {
      // Invalida mesmo em falha parcial: itens já removidos saem da lista.
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

  function toggleAllPaged() {
    setSelectedIds((current) => {
      const pageIds = paged.map((task) => task.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => current.has(id));
      const next = new Set(current);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  if (!viewer) return null;

  return (
    <Page className="tasks-module">
      <PageHeader
        eyebrow="Operação"
        title="Tarefas e rotinas"
        description="Acompanhe o trabalho diário e as atividades recorrentes."
      />
      <Tabs
        label="Recortes de tarefas"
        value={filters.slice}
        items={SLICES}
        onChange={(slice) => setFilters((current) => ({ ...current, slice }))}
      />
      <div className="doka-list-toolbar">
        <SearchInput
          value={filters.termo ?? ""}
          placeholder="Buscar tarefa…"
          onChange={(termo) => updateFilters({ ...filters, termo })}
        />
        <FormSelect
          className="doka-list-toolbar__select"
          fullWidth={false}
          aria-label="Status"
          value={filters.status ?? ""}
          onChange={(next) =>
            updateFilters({ ...filters, status: next as TaskFilters["status"] })
          }
          options={[
            { value: "", label: "Todos os status" },
            { value: "pendente", label: "Pendente" },
            { value: "em_andamento", label: "Em andamento" },
            { value: "concluida", label: "Concluída" },
            { value: "validada", label: "Validada" },
            { value: "reaberta", label: "Reaberta" },
          ]}
        />
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Filtros{advancedCount ? ` (${advancedCount})` : ""}
        </Button>
        <span className="doka-list-toolbar__spacer" />
        {viewer.perfil !== "operador" ? (
          <ButtonLink variant="outline" to="/app/tarefas-rotinas/rotinas">
            Rotinas
          </ButtonLink>
        ) : null}
        <Button onClick={openCreate}>Nova tarefa</Button>
      </div>
      <FilterChips
        items={chips}
        onRemove={(id) => updateFilters({ ...filters, [id]: undefined })}
        onClear={() =>
          updateFilters({ slice: filters.slice, termo: filters.termo, status: filters.status })
        }
      />
      <Drawer
        open={filtersOpen}
        title="Filtros de tarefas"
        description="Refine a lista sem perder o contexto."
        onClose={() => setFiltersOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => updateFilters({ slice: filters.slice })}>
              Limpar
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Aplicar filtros</Button>
          </>
        }
      >
        <TaskFiltersForm
          value={filters}
          postos={catalogs.postos}
          usuarios={catalogs.usuarios}
          prioridades={catalogs.prioridades}
          disabled={loading}
          onChange={updateFilters}
        />
      </Drawer>
      {loading && tasks.length === 0 ? <Skeleton message="Carregando tarefas..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Falha ao carregar tarefas"
          description={error.message}
          actions={<Button onClick={() => void tasksQuery.refetch()}>Tentar novamente</Button>}
        />
      ) : null}
      {actionError ? (
        <FeedbackState
          tone="error"
          title="A acao nao foi concluida"
          description={actionError.message}
        />
      ) : null}
      {!loading && !error && visible.length === 0 ? (
        <FeedbackState
          tone="empty"
          title="Nenhuma tarefa encontrada"
          description="Não há tarefas neste recorte ou nos filtros selecionados."
          actions={<Button onClick={openCreate}>Nova tarefa</Button>}
        />
      ) : null}
      {visible.length > 0 ? (
        <>
          <TaskList
            tasks={paged}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
            onToggleAll={toggleAllPaged}
            onEdit={openEdit}
            onDuplicate={(task) => duplicateMutation.mutate(task)}
            onRemove={(id) => setRemoveTarget([id])}
          />
          <Pagination page={page} pageSize={pageSize} total={visible.length} onChange={setPage} />
        </>
      ) : null}
      {selectedItems.length > 0 ? (
        <SidebarActionList
          summary={
            <>
              <span>Selecionadas</span>
              <strong>{selectedItems.length}</strong>
              <span>{selectedItems.filter((task) => task.status !== "validada").length} abertas</span>
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
              onClick: () => setRemoveTarget(selectedItems.map((task) => task.id)),
            },
          ]}
        />
      ) : null}
      {creating || editingId ? (
        <TaskFormModal
          tarefaId={editingId ?? undefined}
          viewer={viewer}
          service={injected}
          catalogService={catalogService}
          onClose={closeFormModal}
        />
      ) : null}
      <RemovalAlertDialog
        open={Boolean(removeTarget)}
        title="Remover tarefa"
        description="Esta acao remove logicamente a tarefa e exige justificativa para auditoria."
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

export default TaskCenterPage;
