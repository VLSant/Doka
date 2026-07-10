import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Skeleton } from "../../../components/ui/Skeleton";
import { LotFilters } from "../components/LotFilters";
import { LotsTable } from "../components/LotsTable";
import { createLotService, type LotService } from "../lot-service";
import type { LotFilters as Filters, ManagementCursor } from "../types";
import "./ImportListPage.css";

export function ImportListPage({ service: injected }: { service?: LotService }) {
  const service = useMemo(() => injected ?? createLotService(), [injected]);
  const [filters, setFilters] = useState<Filters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const lotsQuery = useInfiniteQuery({
    queryKey: queryKeys.importacoes.lots(filters),
    queryFn: ({ pageParam }) => service.list(filters, pageParam),
    initialPageParam: null as ManagementCursor | null,
    getNextPageParam: (lastPage) => lastPage.proximo_cursor,
  });
  const lots = lotsQuery.data?.pages.flatMap((page) => page.itens) ?? [];
  const cursor = lotsQuery.hasNextPage ? lotsQuery.data?.pages.at(-1)?.proximo_cursor ?? null : null;
  const loading = lotsQuery.isPending || lotsQuery.isFetchingNextPage;
  const error = lotsQuery.error?.message ?? "";
  function apply(next: Filters) {
    setFilters(next);
  }
  const visibleLots = lots.filter((lot) =>
    `${lot.arquivo ?? ""} ${lot.postos.map((posto) => posto.nome).join(" ")}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );

  return (
    <Page className="mms-management">
      <PageHeader
        eyebrow="Importações MMS"
        title="Central de importações"
        description="Consulte, audite e trate os lotes dentro do seu escopo operacional."
      />
      <div className="doka-list-toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar arquivo ou posto…" />
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Filtros
          {Object.values(filters).filter(Boolean).length
            ? ` (${Object.values(filters).filter(Boolean).length})`
            : ""}
        </Button>
        <span className="doka-list-toolbar__spacer" />
        <ButtonLink to="/app/importacoes-mms/nova">Nova importação</ButtonLink>
      </div>
      <FilterChips
        items={Object.entries(filters)
          .filter(([, value]) => value)
          .map(([id, value]) => ({ id, label: `${id.replaceAll("_", " ")}: ${value}` }))}
        onRemove={(id) => apply({ ...filters, [id]: undefined })}
        onClear={() => apply({})}
      />
      <Drawer
        open={filtersOpen}
        title="Filtros de importações"
        onClose={() => setFiltersOpen(false)}
      >
        <LotFilters
          value={filters}
          disabled={loading}
          onChange={(next) => {
            apply(next);
            setFiltersOpen(false);
          }}
        />
      </Drawer>
      {loading && lots.length === 0 ? <Skeleton message="Carregando importações..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Falha ao carregar importações"
          description={error}
          actions={<Button onClick={() => void lotsQuery.refetch()}>Tentar novamente</Button>}
        />
      ) : null}
      {!loading && !error && lots.length === 0 ? (
        <FeedbackState
          tone="empty"
          title={
            Object.keys(filters).length
              ? "Nenhum lote corresponde aos filtros"
              : "Nenhuma importação disponível"
          }
          description={
            Object.keys(filters).length
              ? "Revise ou limpe os filtros aplicados."
              : "Inicie uma nova importação MMS."
          }
          actions={
            !Object.keys(filters).length ? (
              <ButtonLink to="/app/importacoes-mms/nova">Nova importação</ButtonLink>
            ) : undefined
          }
        />
      ) : null}
      {visibleLots.length ? (
        <>
          <LotsTable lots={visibleLots} />
          {cursor ? (
            <Button
              variant="outline"
              loading={loading}
              onClick={() => void lotsQuery.fetchNextPage()}
            >
              Carregar mais
            </Button>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

export default ImportListPage;
