import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useSearchParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Select } from "../../../components/ui/FormControls";
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
  const [filters, setFilters] = useState<LancamentoFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
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
          placeholder="Buscar responsável ou recurso…"
          onChange={(recurso) =>
            setFilters((current) => ({ ...current, recurso: recurso || undefined }))
          }
        />
        <Select
          className="doka-list-toolbar__select"
          aria-label="Status"
          value={filters.status ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value as LancamentoFilters["status"],
            }))
          }
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="validado">Validado</option>
        </Select>
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
                {pendentes.length} · {currency.format(totalPendente)}
              </strong>
            </Card>
          </section>
          <LancamentoTable items={items} />
        </>
      ) : null}
      {creating || editingId ? (
        <LancamentoFormModal
          lancamentoId={editingId ?? undefined}
          service={injected}
          onClose={closeFormModal}
        />
      ) : null}
    </Page>
  );
}

export default LancamentoListPage;
