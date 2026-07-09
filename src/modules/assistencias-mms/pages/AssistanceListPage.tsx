import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useSearchParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Skeleton } from "../../../components/ui/Skeleton";
import { createAssistanceService, type AssistanceService } from "../assistance-service";
import { AssistanceFiltersForm } from "../components/AssistanceFilters";
import { AssistanceTable } from "../components/AssistanceTable";
import {
  emptyStateFor,
  parseAssistanceFilters,
  serializeAssistanceFilters,
} from "../assistance-state";
import type { AssistanceCursor } from "../types";
import "./AssistanceListPage.css";

type PageError = Error & { code?: string };

export function AssistanceListPage({ service: injected }: { service?: AssistanceService }) {
  const service = useMemo(() => injected ?? createAssistanceService(), [injected]);
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseAssistanceFilters(searchParams), [searchParams]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.assistencias.list(filters),
    queryFn: ({ pageParam }) => service.list(filters, pageParam),
    initialPageParam: null as AssistanceCursor | null,
    getNextPageParam: (lastPage) => lastPage.proximo_cursor,
  });
  const items = listQuery.data?.pages.flatMap((page) => page.itens) ?? [];
  const cursor = listQuery.hasNextPage ? listQuery.data?.pages.at(-1)?.proximo_cursor ?? null : null;
  const loading = listQuery.isPending || listQuery.isFetchingNextPage;
  const error = listQuery.error as PageError | null;

  function applyFilters(next: typeof filters) {
    setSearchParams(serializeAssistanceFilters(next));
  }

  const emptyState = emptyStateFor(filters);
  const advancedEntries = Object.entries(filters).filter(
    ([key, value]) => key !== "numero_assistencia" && value && value !== "ativo",
  );
  return (
    <Page className="assistance-management">
      <PageHeader
        eyebrow="Assistências / MMS"
        title="Assistências MMS"
        description="Consulte serviços, partes, correções e origem dentro do seu escopo."
      />
      <div className="doka-list-toolbar">
        <SearchInput
          value={filters.numero_assistencia ?? ""}
          placeholder="Buscar por assistência…"
          onChange={(numero_assistencia) =>
            applyFilters({ ...filters, numero_assistencia: numero_assistencia || undefined })
          }
        />
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Filtros{advancedEntries.length ? ` (${advancedEntries.length})` : ""}
        </Button>
      </div>
      <FilterChips
        items={advancedEntries.map(([id, value]) => ({
          id,
          label: `${id.replaceAll("_", " ")}: ${value}`,
        }))}
        onRemove={(id) => applyFilters({ ...filters, [id]: undefined })}
        onClear={() => applyFilters({ numero_assistencia: filters.numero_assistencia })}
      />
      <Drawer
        open={filtersOpen}
        title="Filtros de assistências"
        onClose={() => setFiltersOpen(false)}
      >
        <AssistanceFiltersForm
          key={searchParams.toString()}
          value={filters}
          disabled={loading}
          onChange={applyFilters}
        />
      </Drawer>
      {loading && items.length === 0 ? <Skeleton message="Carregando assistências..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title={
            error.code === "acesso_negado" ? "Acesso negado" : "Falha ao carregar assistências"
          }
          description={error.message}
          actions={
            error.code === "acesso_negado" ? undefined : (
              <Button onClick={() => void listQuery.refetch()}>Tentar novamente</Button>
            )
          }
        />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <FeedbackState
          tone="empty"
          title={
            emptyState === "empty_filters"
              ? "Nenhuma assistência corresponde aos filtros"
              : "Nenhuma assistência disponível"
          }
          description={
            emptyState === "empty_filters"
              ? "Revise ou limpe os filtros aplicados."
              : "Não há assistências MMS no seu escopo atual."
          }
          actions={
            emptyState === "empty_filters" ? (
              <Button variant="outline" onClick={() => applyFilters({})}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {items.length > 0 ? (
        <>
          <AssistanceTable items={items} returnSearch={searchParams.toString()} />
          {cursor ? (
            <Button variant="outline" loading={loading} onClick={() => void listQuery.fetchNextPage()}>
              Carregar mais
            </Button>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

export default AssistanceListPage;
