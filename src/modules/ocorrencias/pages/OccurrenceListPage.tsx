import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Edit3, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { queryKeys } from "../../../app/query-keys";
import { runBatch } from "../../../lib/batch";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { OccurrenceFormModal } from "../components/OccurrenceFormModal";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { Input } from "../../../components/ui/Input";
import { SearchInput } from "../../../components/ui/SearchInput";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import { Skeleton } from "../../../components/ui/Skeleton";
import { SidebarActionList } from "../../../components/ui/SidebarActionList";
import { Tabs } from "../../../components/ui/Tabs";
import { occurrenceMatchesFilters, STATUS_LABELS } from "../occurrence-state";
import { createOccurrenceService, type OccurrenceService } from "../occurrence-service";
import { OccurrenceTable } from "../components/OccurrenceTable";
import type {
  OccurrenceCatalogs,
  OccurrenceFilters,
  OccurrenceStatus,
  OccurrenceTab,
} from "../types";
import "./Occurrences.css";

const EMPTY_CATALOGS: OccurrenceCatalogs = {
  assistencias: [],
  tipos: [],
  prioridades: [],
  usuarios: [],
  postos: [],
};

export function OccurrenceListPage({ service: injected }: { service?: OccurrenceService }) {
  const service = useMemo(() => injected ?? createOccurrenceService(), [injected]);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<OccurrenceFilters>({ tab: "hoje" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [removeTarget, setRemoveTarget] = useState<string[] | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const creating = searchParams.get("novo") === "1";
  const editingId = searchParams.get("editar");

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

  const occurrencesQuery = useQuery({
    queryKey: queryKeys.occurrences.list(),
    queryFn: () => service.list(),
  });
  const catalogsQuery = useQuery({
    queryKey: queryKeys.occurrences.catalogs(),
    queryFn: () => service.catalogs(),
  });
  const items = useMemo(() => occurrencesQuery.data ?? [], [occurrencesQuery.data]);
  const catalogs = catalogsQuery.data ?? EMPTY_CATALOGS;
  const loading = occurrencesQuery.isPending || catalogsQuery.isPending;
  const error = occurrencesQuery.error ?? catalogsQuery.error;
  const reload = () => {
    void occurrencesQuery.refetch();
    void catalogsQuery.refetch();
  };

  const visible = useMemo(
    () => items.filter((item) => occurrenceMatchesFilters(item, filters)),
    [filters, items],
  );
  const selectedItems = visible.filter((item) => selectedIds.has(item.id));
  const firstSelected = selectedItems[0];

  const duplicateMutation = useMutation({
    mutationFn: (item: (typeof visible)[number]) =>
      service.create({
        assistencia_id: item.assistencia_id,
        posto_id: item.posto_id,
        tipo_ocorrencia_id: item.tipo_ocorrencia_id,
        prioridade_id: item.prioridade_id,
        responsavel_id: item.responsavel_id,
        titulo: `${item.titulo} (copia)`,
        descricao: item.descricao,
        observacoes: item.observacoes,
        data_retorno: item.data_retorno,
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.occurrences.all });
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao duplicar ocorrencia.")),
  });

  const removeMutation = useMutation({
    mutationFn: ({ ids, justification }: { ids: string[]; justification: string }) =>
      runBatch(
        ids,
        (id) => service.remove(id, justification),
        (failed, total) =>
          `Falha ao remover ${failed} de ${total} ocorrência(s); as demais foram removidas.`,
      ),
    onSuccess: () => {
      setRemoveTarget(null);
      setSelectedIds(new Set());
      setActionError(null);
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao remover ocorrencia.")),
    onSettled: async () => {
      // Invalida mesmo em falha parcial: itens já removidos saem da lista.
      await queryClient.invalidateQueries({ queryKey: queryKeys.occurrences.all });
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

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const visibleIds = visible.map((item) => item.id);
      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => current.has(id));
      const next = new Set(current);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function setFilter<K extends keyof OccurrenceFilters>(key: K, value: OccurrenceFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }
  const advancedKeys: Array<keyof OccurrenceFilters> = [
    "posto_id",
    "responsavel_id",
    "tipo_ocorrencia_id",
    "prioridade_id",
    "assistencia_id",
    "montador",
    "data_de",
    "data_ate",
  ];
  const advancedCount = advancedKeys.filter((key) => filters[key]).length;
  const chips = advancedKeys
    .filter((key) => filters[key])
    .map((key) => ({ id: key, label: `${key.replaceAll("_", " ")}: ${filters[key]}` }));

  return (
    <Page className="occurrences-page">
      <PageHeader
        eyebrow="Operação"
        title="Ocorrências"
        description="Acompanhe pendências, reclamações e retornos vinculados às assistências."
      />

      <Tabs
        label="Recortes de ocorrências"
        value={filters.tab}
        items={(["hoje", "abertas", "atrasadas"] as OccurrenceTab[]).map((tab) => ({
          id: tab,
          label: tab === "hoje" ? "Hoje" : tab === "abertas" ? "Abertas" : "Atrasadas",
        }))}
        onChange={(tab) => setFilter("tab", tab)}
      />

      <div className="doka-list-toolbar">
        <SearchInput
          value={filters.busca ?? ""}
          placeholder="Buscar ocorrência…"
          onChange={(busca) => setFilter("busca", busca)}
        />
        <FormSelect
          className="doka-list-toolbar__select"
          fullWidth={false}
          aria-label="Status"
          value={filters.status ?? ""}
          onChange={(next) => setFilter("status", next as OccurrenceStatus | "")}
          options={[
            { value: "", label: "Todos os status" },
            ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Filtros{advancedCount ? ` (${advancedCount})` : ""}
        </Button>
        <span className="doka-list-toolbar__spacer" />
        <Button onClick={openCreate}>Nova ocorrência</Button>
      </div>
      <FilterChips
        items={chips}
        onRemove={(id) => setFilter(id as keyof OccurrenceFilters, undefined)}
        onClear={() =>
          setFilters({ tab: filters.tab, busca: filters.busca, status: filters.status })
        }
      />
      <Drawer
        open={filtersOpen}
        title="Filtros de ocorrências"
        onClose={() => setFiltersOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setFilters({ tab: filters.tab })}>
              Limpar
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Aplicar filtros</Button>
          </>
        }
      >
        <div className="occurrence-filters">
          <FormSelect
            label="Posto"
            value={filters.posto_id ?? ""}
            onChange={(next) => setFilter("posto_id", next)}
            options={[
              { value: "", label: "Todos" },
              ...catalogs.postos.map((item) => ({ value: item.id, label: item.nome })),
            ]}
          />
          <FormSelect
            label="Responsável"
            value={filters.responsavel_id ?? ""}
            onChange={(next) => setFilter("responsavel_id", next)}
            options={[
              { value: "", label: "Todos" },
              ...catalogs.usuarios.map((item) => ({ value: item.id, label: item.nome })),
            ]}
          />
          <FormSelect
            label="Tipo"
            value={filters.tipo_ocorrencia_id ?? ""}
            onChange={(next) => setFilter("tipo_ocorrencia_id", next)}
            options={[
              { value: "", label: "Todos" },
              ...catalogs.tipos.map((item) => ({ value: item.id, label: item.nome })),
            ]}
          />
          <FormSelect
            label="Prioridade"
            value={filters.prioridade_id ?? ""}
            onChange={(next) => setFilter("prioridade_id", next)}
            options={[
              { value: "", label: "Todas" },
              ...catalogs.prioridades.map((item) => ({ value: item.id, label: item.nome })),
            ]}
          />
          <FormSelect
            label="Assistência"
            value={filters.assistencia_id ?? ""}
            onChange={(next) => setFilter("assistencia_id", next)}
            options={[
              { value: "", label: "Todas" },
              ...catalogs.assistencias.map((item) => ({
                value: item.id,
                label: item.numero_assistencia,
              })),
            ]}
          />
          <Input
            label="Montador / recurso"
            value={filters.montador ?? ""}
            onChange={(event) => setFilter("montador", event.target.value)}
          />
          <DatePickerField
            label="Registrada de"
            value={filters.data_de ?? ""}
            onChange={(next) => setFilter("data_de", next)}
          />
          <DatePickerField
            label="Registrada até"
            value={filters.data_ate ?? ""}
            onChange={(next) => setFilter("data_ate", next)}
          />
        </div>
      </Drawer>

      {loading ? <Skeleton message="Carregando ocorrências..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Falha ao carregar ocorrências"
          description={error.message}
          actions={<Button onClick={reload}>Tentar novamente</Button>}
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
          title="Nenhuma ocorrência neste recorte"
          description="Altere os filtros ou registre uma nova ocorrência."
          actions={<Button onClick={openCreate}>Nova ocorrência</Button>}
        />
      ) : null}
      {!loading && !error && visible.length > 0 ? (
        <>
          <OccurrenceTable
            items={visible}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
            onToggleAll={toggleAllVisible}
            onEdit={openEdit}
            onDuplicate={(item) => duplicateMutation.mutate(item)}
            onRemove={(id) => setRemoveTarget([id])}
          />
        </>
      ) : null}
      {selectedItems.length > 0 ? (
        <SidebarActionList
          summary={
            <>
              <span>Selecionadas</span>
              <strong>{selectedItems.length}</strong>
              <span>{selectedItems.filter((item) => item.status !== "encerrada").length} ativas</span>
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
              onClick: () => setRemoveTarget(selectedItems.map((item) => item.id)),
            },
          ]}
        />
      ) : null}

      {creating || editingId ? (
        <OccurrenceFormModal
          ocorrenciaId={editingId ?? undefined}
          onClose={closeFormModal}
          service={injected}
        />
      ) : null}
      <RemovalAlertDialog
        open={Boolean(removeTarget)}
        title="Remover ocorrencia"
        description="Esta acao remove logicamente a ocorrencia e exige justificativa para auditoria."
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

export default OccurrenceListPage;
