import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { Skeleton } from "../../../components/ui/Skeleton";
import { createDashboardService, todayInBahia, type DashboardService } from "../dashboard-service";
import { DashboardCards } from "../components/DashboardCards";
import { DashboardFiltersForm } from "../components/DashboardFiltersForm";
import { DashboardProductivity } from "../components/DashboardProductivity";
import type { DashboardData, DashboardError, DashboardFilters, DashboardPosto } from "../types";
import "./DashboardOperationalPage.css";

function initialFilters(): DashboardFilters {
  const hoje = todayInBahia();
  return { inicio: hoje, fim: hoje, postoId: null };
}

function hasOperationalData(data: DashboardData): boolean {
  return (
    Object.values(data.counters).some((value) => value > 0) ||
    data.produtividade.periodo.previstas > 0 ||
    data.produtividade.periodo.removidas > 0
  );
}

export function DashboardOperationalPage({ service: injected }: { service?: DashboardService }) {
  const service = useMemo(() => injected ?? createDashboardService(), [injected]);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [postos, setPostos] = useState<DashboardPosto[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(
    async (nextFilters: DashboardFilters) => {
      setLoading(true);
      setError(null);
      try {
        const [nextData, nextPostos] = await Promise.all([
          service.load(nextFilters),
          service.listPostos(),
        ]);
        setData(nextData);
        setPostos(nextPostos);
      } catch (cause) {
        const nextError =
          cause instanceof Error
            ? (cause as DashboardError)
            : (Object.assign(new Error("Não foi possível carregar o Dashboard."), {
                code: "falha_temporaria",
                retryable: true,
              }) as DashboardError);
        setData(null);
        setError(nextError);
      } finally {
        setLoading(false);
      }
    },
    [service],
  );

  useEffect(() => {
    // This effect synchronizes the selected filters with the remote RLS-backed data source.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(filters);
  }, [filters, load]);

  return (
    <Page className="dashboard-operational">
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard operacional"
        description={`Exibindo ${filters.inicio === filters.fim ? filters.inicio : `${filters.inicio} a ${filters.fim}`} · ${filters.postoId ? (postos.find((posto) => posto.id === filters.postoId)?.nome ?? "Posto selecionado") : "Todos os postos"}`}
        actions={
          <Button variant="outline" onClick={() => setFiltersOpen(true)}>
            Período e posto
          </Button>
        }
      />

      <Drawer open={filtersOpen} title="Filtros do dashboard" onClose={() => setFiltersOpen(false)}>
        <DashboardFiltersForm
          key={`${filters.inicio}:${filters.fim}:${filters.postoId ?? ""}`}
          value={filters}
          postos={postos}
          disabled={loading}
          onChange={(next) => {
            setFilters(next);
            setFiltersOpen(false);
          }}
        />
      </Drawer>

      {loading && !data ? <Skeleton rows={4} message="Carregando indicadores..." /> : null}

      {error ? (
        <FeedbackState
          tone="error"
          title={error.code === "acesso_negado" ? "Acesso negado" : "Falha ao carregar Dashboard"}
          description={error.message}
          actions={
            error.retryable ? (
              <Button onClick={() => void load(filters)}>Tentar novamente</Button>
            ) : undefined
          }
        />
      ) : null}

      {data ? (
        <>
          {loading ? <p role="status">Atualizando indicadores...</p> : null}
          <DashboardCards counters={data.counters} />
          <DashboardProductivity
            dia={data.produtividade.dia}
            semana={data.produtividade.semana}
            periodo={data.produtividade.periodo}
            porPosto={data.produtividade.porPosto}
            alertas={data.alertas}
          />
          {!hasOperationalData(data) ? (
            <FeedbackState
              tone="empty"
              title="Nenhum dado no período"
              description="Não há registros operacionais dentro dos filtros aplicados."
            />
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

export default DashboardOperationalPage;
