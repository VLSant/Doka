import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { occurrenceMatchesFilters, STATUS_LABELS } from "../occurrence-state";
import {
  createOccurrenceService,
  type OccurrenceService,
} from "../occurrence-service";
import { OccurrenceTable } from "../components/OccurrenceTable";
import type {
  OccurrenceCatalogs,
  OccurrenceFilters,
  OccurrenceListItem,
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
  const [items, setItems] = useState<OccurrenceListItem[]>([]);
  const [catalogs, setCatalogs] = useState(EMPTY_CATALOGS);
  const [filters, setFilters] = useState<OccurrenceFilters>({ tab: "hoje" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [occurrences, options] = await Promise.all([service.list(), service.catalogs()]);
      setItems(occurrences);
      setCatalogs(options);
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause : new Error("Falha ao carregar ocorrências."));
    } finally {
      setLoading(false);
    }
  }, [service]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  const visible = useMemo(
    () => items.filter((item) => occurrenceMatchesFilters(item, filters)),
    [filters, items],
  );

  function setFilter<K extends keyof OccurrenceFilters>(key: K, value: OccurrenceFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="occurrences-page">
      <header className="occurrences-header">
        <div>
          <span>Operação</span>
          <h1>Ocorrências</h1>
          <p>Acompanhe pendências, reclamações e retornos vinculados às assistências.</p>
        </div>
        <Link className="occurrences-primary-link" to="/app/ocorrencias/nova">
          Nova ocorrência
        </Link>
      </header>

      <nav className="occurrence-tabs" aria-label="Recortes de ocorrências">
        {(["hoje", "abertas", "atrasadas"] as OccurrenceTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-current={filters.tab === tab ? "page" : undefined}
            onClick={() => setFilter("tab", tab)}
          >
            {tab === "hoje" ? "Hoje" : tab === "abertas" ? "Abertas" : "Atrasadas"}
          </button>
        ))}
      </nav>

      <Card padding="lg">
        <div className="occurrence-filters">
          <label>
            Buscar
            <input
              type="search"
              value={filters.busca ?? ""}
              placeholder="Título ou assistência"
              onChange={(event) => setFilter("busca", event.target.value)}
            />
          </label>
          <label>
            Posto
            <select
              value={filters.posto_id ?? ""}
              onChange={(event) => setFilter("posto_id", event.target.value)}
            >
              <option value="">Todos</option>
              {catalogs.postos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select
              value={filters.responsavel_id ?? ""}
              onChange={(event) => setFilter("responsavel_id", event.target.value)}
            >
              <option value="">Todos</option>
              {catalogs.usuarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select
              value={filters.tipo_ocorrencia_id ?? ""}
              onChange={(event) => setFilter("tipo_ocorrencia_id", event.target.value)}
            >
              <option value="">Todos</option>
              {catalogs.tipos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prioridade
            <select
              value={filters.prioridade_id ?? ""}
              onChange={(event) => setFilter("prioridade_id", event.target.value)}
            >
              <option value="">Todas</option>
              {catalogs.prioridades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilter("status", event.target.value as OccurrenceStatus | "")
              }
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assistência
            <select value={filters.assistencia_id ?? ""} onChange={(event) => setFilter("assistencia_id", event.target.value)}>
              <option value="">Todas</option>
              {catalogs.assistencias.map((item) => <option key={item.id} value={item.id}>{item.numero_assistencia}</option>)}
            </select>
          </label>
          <label>Montador / recurso<input value={filters.montador ?? ""} onChange={(event) => setFilter("montador", event.target.value)} /></label>
          <label>Registrada de<input type="date" value={filters.data_de ?? ""} onChange={(event) => setFilter("data_de", event.target.value)} /></label>
          <label>Registrada até<input type="date" value={filters.data_ate ?? ""} onChange={(event) => setFilter("data_ate", event.target.value)} /></label>
        </div>
      </Card>

      {loading ? <LoadingState message="Carregando ocorrências..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Falha ao carregar ocorrências"
          description={error.message}
          actions={<Button onClick={() => void load()}>Tentar novamente</Button>}
        />
      ) : null}
      {!loading && !error && visible.length === 0 ? (
        <FeedbackState
          tone="empty"
          title="Nenhuma ocorrência neste recorte"
          description="Altere os filtros ou registre uma nova ocorrência."
        />
      ) : null}
      {!loading && !error && visible.length > 0 ? (
        <>
          <p role="status">{visible.length} ocorrência(s) exibida(s)</p>
          <OccurrenceTable items={visible} />
        </>
      ) : null}
    </main>
  );
}

export default OccurrenceListPage;

