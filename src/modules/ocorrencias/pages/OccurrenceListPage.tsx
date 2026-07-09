import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { queryKeys } from "../../../app/query-keys";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { OccurrenceFormModal } from "../components/OccurrenceFormModal";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { Input } from "../../../components/ui/Input";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Select } from "../../../components/ui/FormControls";
import { Skeleton } from "../../../components/ui/Skeleton";
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
  const [filters, setFilters] = useState<OccurrenceFilters>({ tab: "hoje" });
  const [filtersOpen, setFiltersOpen] = useState(false);
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
        <Select
          className="doka-list-toolbar__select"
          aria-label="Status"
          value={filters.status ?? ""}
          onChange={(event) => setFilter("status", event.target.value as OccurrenceStatus | "")}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
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
          <Select
            label="Posto"
            value={filters.posto_id ?? ""}
            onChange={(event) => setFilter("posto_id", event.target.value)}
          >
            <option value="">Todos</option>
            {catalogs.postos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </Select>
          <Select
            label="Responsável"
            value={filters.responsavel_id ?? ""}
            onChange={(event) => setFilter("responsavel_id", event.target.value)}
          >
            <option value="">Todos</option>
            {catalogs.usuarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo"
            value={filters.tipo_ocorrencia_id ?? ""}
            onChange={(event) => setFilter("tipo_ocorrencia_id", event.target.value)}
          >
            <option value="">Todos</option>
            {catalogs.tipos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </Select>
          <Select
            label="Prioridade"
            value={filters.prioridade_id ?? ""}
            onChange={(event) => setFilter("prioridade_id", event.target.value)}
          >
            <option value="">Todas</option>
            {catalogs.prioridades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </Select>
          <Select
            label="Assistência"
            value={filters.assistencia_id ?? ""}
            onChange={(event) => setFilter("assistencia_id", event.target.value)}
          >
            <option value="">Todas</option>
            {catalogs.assistencias.map((item) => (
              <option key={item.id} value={item.id}>
                {item.numero_assistencia}
              </option>
            ))}
          </Select>
          <Input
            label="Montador / recurso"
            value={filters.montador ?? ""}
            onChange={(event) => setFilter("montador", event.target.value)}
          />
          <Input
            label="Registrada de"
            type="date"
            value={filters.data_de ?? ""}
            onChange={(event) => setFilter("data_de", event.target.value)}
          />
          <Input
            label="Registrada até"
            type="date"
            value={filters.data_ate ?? ""}
            onChange={(event) => setFilter("data_ate", event.target.value)}
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
          <OccurrenceTable items={visible} />
        </>
      ) : null}

      {creating || editingId ? (
        <OccurrenceFormModal
          ocorrenciaId={editingId ?? undefined}
          onClose={closeFormModal}
          service={injected}
        />
      ) : null}
    </Page>
  );
}

export default OccurrenceListPage;
