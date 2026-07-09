import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, Edit3, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { queryKeys } from "../../../app/query-keys";
import { runBatch } from "../../../lib/batch";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { SearchInput } from "../../../components/ui/SearchInput";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import { SidebarActionList } from "../../../components/ui/SidebarActionList";
import { Skeleton } from "../../../components/ui/Skeleton";
import { createLancamentoService, type LancamentoService } from "../lancamento-service";
import { LancamentoFiltersForm } from "../components/LancamentoFilters";
import { LancamentoFormModal } from "../components/LancamentoFormModal";
import { LancamentoTable } from "../components/LancamentoTable";
import type { LancamentoFilters } from "../types";
import "../lancamentos-operacionais.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function LancamentoListPage({ service: injected }: { service?: LancamentoService }) {
  const service = useMemo(() => injected ?? createLancamentoService(), [injected]);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LancamentoFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [removeTarget, setRemoveTarget] = useState<string[] | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const creating = searchParams.get("novo") === "1";
  const editingId = searchParams.get("editar");

  const listQuery = useQuery({
    queryKey: queryKeys.lancamentos.list(filters),
    queryFn: () => service.list(filters),
  });
  const optionsQuery = useQuery({
    queryKey: queryKeys.lancamentos.options(),
    queryFn: () => service.formOptions(),
  });
  const items = listQuery.data ?? [];
  const options = optionsQuery.data ?? { postos: [], assistencias: [] };
  const loading = listQuery.isPending || optionsQuery.isPending;
  const error = listQuery.error ?? optionsQuery.error;
  const reload = () => {
    void listQuery.refetch();
    void optionsQuery.refetch();
  };

  const total = items.reduce((sum, item) => sum + item.valor, 0);
  const pendentes = items.filter((item) => item.status === "pendente");
  const totalPendente = pendentes.reduce((sum, item) => sum + item.valor, 0);
  const advancedCount = Object.entries(filters).filter(
    ([key, value]) => !["recurso", "status"].includes(key) && Boolean(value),
  ).length;
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const firstSelected = selectedItems[0];
  const selectedPendentes = selectedItems.filter((item) => item.status === "pendente");

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

  const duplicateMutation = useMutation({
    mutationFn: (item: (typeof items)[number]) =>
      service.create({
        tipo: item.tipo,
        assistencia_id: item.assistencia_id,
        posto_id: item.posto_id,
        recurso: item.recurso,
        data_lancamento: item.data_lancamento,
        descricao: `${item.descricao} (copia)`,
        valor: item.valor,
        observacoes: item.observacoes,
      }),
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.all });
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao duplicar lancamento.")),
  });
  const validateMutation = useMutation({
    mutationFn: (ids: string[]) =>
      runBatch(
        ids,
        (id) => service.validate(id),
        (failed, total) =>
          `Falha ao validar ${failed} de ${total} lançamento(s); os demais foram validados.`,
      ),
    onSuccess: () => {
      setSelectedIds(new Set());
      setActionError(null);
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao validar lancamentos.")),
    onSettled: async () => {
      // Invalida mesmo em falha parcial: itens já validados refletem na lista.
      await queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.all });
    },
  });
  const removeMutation = useMutation({
    mutationFn: ({ ids, justification }: { ids: string[]; justification: string }) =>
      runBatch(
        ids,
        (id) => service.remove(id, justification),
        (failed, total) =>
          `Falha ao remover ${failed} de ${total} lançamento(s); os demais foram removidos.`,
      ),
    onSuccess: () => {
      setRemoveTarget(null);
      setSelectedIds(new Set());
      setActionError(null);
    },
    onError: (cause) =>
      setActionError(cause instanceof Error ? cause : new Error("Falha ao remover lancamento.")),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.all });
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
      const ids = items.map((item) => item.id);
      const allSelected = ids.length > 0 && ids.every((id) => current.has(id));
      const next = new Set(current);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  return (
    <Page className="lancamentos-page">
      <PageHeader
        eyebrow="Operação"
        title="Deslocamentos e custos extras"
        description="Lance, consulte e valide despesas operacionais em um único lugar."
      />

      <div className="doka-list-toolbar">
        <SearchInput
          value={filters.recurso ?? ""}
          placeholder="Buscar responsável ou recurso..."
          onChange={(recurso) =>
            setFilters((current) => ({ ...current, recurso: recurso || undefined }))
          }
        />
        <FormSelect
          className="doka-list-toolbar__select"
          fullWidth={false}
          aria-label="Status"
          value={filters.status ?? ""}
          onChange={(next) =>
            setFilters((current) => ({
              ...current,
              status: next as LancamentoFilters["status"],
            }))
          }
          options={[
            { value: "", label: "Todos os status" },
            { value: "pendente", label: "Pendente" },
            { value: "validado", label: "Validado" },
          ]}
        />
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Filtros{advancedCount ? ` (${advancedCount})` : ""}
        </Button>
        <span className="doka-list-toolbar__spacer" />
        <Button onClick={openCreate}>Novo lançamento</Button>
      </div>
      <FilterChips
        items={Object.entries(filters)
          .filter(([key, value]) => !["recurso", "status"].includes(key) && value)
          .map(([id, value]) => ({ id, label: `${id.replaceAll("_", " ")}: ${value}` }))}
        onRemove={(id) => setFilters((current) => ({ ...current, [id]: undefined }))}
        onClear={() => setFilters({ recurso: filters.recurso, status: filters.status })}
      />
      <Drawer
        open={filtersOpen}
        title="Filtros de lançamentos"
        onClose={() => setFiltersOpen(false)}
      >
        <LancamentoFiltersForm
          value={filters}
          postos={options.postos}
          assistencias={options.assistencias}
          disabled={loading}
          onChange={setFilters}
        />
      </Drawer>

      {loading ? <Skeleton message="Carregando lançamentos..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Falha ao carregar lançamentos"
          description={error.message}
          actions={<Button onClick={() => reload()}>Tentar novamente</Button>}
        />
      ) : null}
      {actionError ? (
        <FeedbackState
          tone="error"
          title="A acao nao foi concluida"
          description={actionError.message}
        />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <FeedbackState
          tone="empty"
          title="Nenhum lançamento encontrado"
          description="Registre um lançamento ou ajuste os filtros."
          actions={<Button onClick={openCreate}>Novo lançamento</Button>}
        />
      ) : null}

      {!error && items.length > 0 ? (
        <>
          <section className="lancamentos-summary" aria-label="Resumo dos lançamentos filtrados">
            <Card>
              <span>Lançamentos</span>
              <strong>{items.length}</strong>
            </Card>
            <Card>
              <span>Valor total</span>
              <strong>{currency.format(total)}</strong>
            </Card>
            <Card>
              <span>Pendente de validação</span>
              <strong>
                {pendentes.length} - {currency.format(totalPendente)}
              </strong>
            </Card>
          </section>
          <LancamentoTable
            items={items}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
            onToggleAll={toggleAll}
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
              <span>Selecionados</span>
              <strong>{selectedItems.length}</strong>
              <span>{currency.format(selectedItems.reduce((sum, item) => sum + item.valor, 0))}</span>
            </>
          }
          onClear={() => setSelectedIds(new Set())}
          items={[
            {
              label: "Editar primeiro",
              icon: <Edit3 size={15} aria-hidden="true" />,
              disabled: !firstSelected || firstSelected.status !== "pendente",
              onClick: () => firstSelected && openEdit(firstSelected.id),
            },
            {
              label: "Duplicar primeiro",
              icon: <Copy size={15} aria-hidden="true" />,
              disabled: !firstSelected || duplicateMutation.isPending,
              onClick: () => firstSelected && duplicateMutation.mutate(firstSelected),
            },
            {
              label: "Validar pendentes",
              icon: <CheckCircle2 size={15} aria-hidden="true" />,
              disabled: selectedPendentes.length === 0 || validateMutation.isPending,
              onClick: () => validateMutation.mutate(selectedPendentes.map((item) => item.id)),
            },
            {
              label: "Excluir selecionados",
              icon: <Trash2 size={15} aria-hidden="true" />,
              variant: "destructive",
              disabled: removeMutation.isPending,
              onClick: () => setRemoveTarget(selectedItems.map((item) => item.id)),
            },
          ]}
        />
      ) : null}
      {creating || editingId ? (
        <LancamentoFormModal
          lancamentoId={editingId ?? undefined}
          service={injected}
          onClose={closeFormModal}
        />
      ) : null}
      <RemovalAlertDialog
        open={Boolean(removeTarget)}
        title="Remover lancamento"
        description="Esta acao remove logicamente o lancamento e exige justificativa para auditoria."
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

export default LancamentoListPage;
