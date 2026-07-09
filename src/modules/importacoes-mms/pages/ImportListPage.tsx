import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { LotFilters as Filters, LotSummary, ManagementCursor } from "../types";
import "./ImportListPage.css";

export function ImportListPage({ service: injected }: { service?: LotService }) {
  const service = useMemo(() => injected ?? createLotService(), [injected]);
  const [filters, setFilters] = useState<Filters>({});
  const [lots, setLots] = useState<LotSummary[]>([]);
  const [cursor, setCursor] = useState<ManagementCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(
    async (nextFilters: Filters, nextCursor: ManagementCursor | null, append = false) => {
      setLoading(true);
      setError("");
      try {
        const page = await service.list(nextFilters, nextCursor);
        setLots((current) => (append ? [...current, ...page.itens] : page.itens));
        setCursor(page.proximo_cursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível carregar os lotes.");
      } finally {
        setLoading(false);
      }
    },
    [service],
  );

  // Initial RPC load is the external synchronization performed by this effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load({}, null);
  }, [load]);
  function apply(next: Filters) {
    setFilters(next);
    void load(next, null);
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
          actions={<Button onClick={() => void load(filters, null)}>Tentar novamente</Button>}
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
              onClick={() => void load(filters, cursor, true)}
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
