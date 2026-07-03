import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
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

export function DashboardOperationalPage({
  service: injected,
}: {
  service?: DashboardService;
}) {
  const service = useMemo(() => injected ?? createDashboardService(), [injected]);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [postos, setPostos] = useState<DashboardPosto[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);

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
    <main className="dashboard-operational">
      <header className="dashboard-operational__header">
        <span>Visão geral</span>
        <h1>Dashboard operacional</h1>
        <p>Resumo dos dados que você pode consultar por período e posto.</p>
      </header>

      <Card padding="lg">
        <DashboardFiltersForm
          key={`${filters.inicio}:${filters.fim}:${filters.postoId ?? ""}`}
          value={filters}
          postos={postos}
          disabled={loading}
          onChange={setFilters}
        />
      </Card>

      {loading && !data ? <LoadingState message="Carregando indicadores..." /> : null}

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
    </main>
  );
}

export default DashboardOperationalPage;
