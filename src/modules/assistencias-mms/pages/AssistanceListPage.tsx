import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { createAssistanceService, type AssistanceService } from "../assistance-service";
import { AssistanceFiltersForm } from "../components/AssistanceFilters";
import { AssistanceTable } from "../components/AssistanceTable";
import {
  emptyStateFor,
  parseAssistanceFilters,
  serializeAssistanceFilters,
} from "../assistance-state";
import type { AssistanceCursor, AssistanceListItem } from "../types";
import "./AssistanceListPage.css";

type PageError = Error & { code?: string };

export function AssistanceListPage({ service: injected }: { service?: AssistanceService }) {
  const service = useMemo(() => injected ?? createAssistanceService(), [injected]);
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseAssistanceFilters(searchParams), [searchParams]);
  const [items, setItems] = useState<AssistanceListItem[]>([]);
  const [cursor, setCursor] = useState<AssistanceCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PageError | null>(null);

  const load = useCallback(
    async (nextCursor: AssistanceCursor | null, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const page = await service.list(filters, nextCursor);
        setItems((current) => (append ? [...current, ...page.itens] : page.itens));
        setCursor(page.proximo_cursor);
      } catch (cause) {
        const nextError: PageError =
          cause instanceof Error
            ? (cause as PageError)
            : (new Error("Não foi possível carregar as assistências.") as PageError);
        setError(nextError);
        if (!append || nextError.code === "acesso_negado") {
          setItems([]);
          setCursor(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, service],
  );

  // Initial/filter RPC load is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(null), [load]);

  function applyFilters(next: typeof filters) {
    setSearchParams(serializeAssistanceFilters(next));
  }

  const emptyState = emptyStateFor(filters);
  return (
    <Page className="assistance-management">
      <PageHeader
        eyebrow="Assistências / MMS"
        title="Assistências MMS"
        description="Consulte serviços, partes, correções e origem dentro do seu escopo."
      />
      <Card padding="lg">
        <AssistanceFiltersForm
          key={searchParams.toString()}
          value={filters}
          disabled={loading}
          onChange={applyFilters}
        />
      </Card>
      {loading && items.length === 0 ? <LoadingState message="Carregando assistências..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title={
            error.code === "acesso_negado" ? "Acesso negado" : "Falha ao carregar assistências"
          }
          description={error.message}
          actions={
            error.code === "acesso_negado" ? undefined : (
              <Button onClick={() => void load(null)}>Tentar novamente</Button>
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
          <p role="status">
            {items.length} assistência(s) exibida(s){loading ? " · Atualizando..." : ""}
          </p>
          <AssistanceTable items={items} returnSearch={searchParams.toString()} />
          {cursor ? (
            <Button variant="outline" loading={loading} onClick={() => void load(cursor, true)}>
              Carregar mais
            </Button>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

export default AssistanceListPage;
