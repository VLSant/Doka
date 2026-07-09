import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { Skeleton } from "../../../components/ui/Skeleton";
import { createDashboardService, todayInBahia, type DashboardService } from "../dashboard-service";
import { DashboardCards } from "../components/DashboardCards";
import { DashboardFiltersForm } from "../components/DashboardFiltersForm";
import { DashboardProductivity } from "../components/DashboardProductivity";
import type { DashboardData, DashboardError, DashboardFilters } from "../types";
import "./DashboardOperationalPage.css";

function initialFilters(): DashboardFilters {
  const hoje = todayInBahia();
  return { inicio: hoje, fim: hoje, postoId: null };
}

function formatDay(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleDateString("pt-BR");
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

  const [filtersOpen, setFiltersOpen] = useState(false);

  const dataQuery = useQuery({
    queryKey: queryKeys.dashboard.data(filters),
    queryFn: () => service.load(filters),
  });
  const postosQuery = useQuery({
    queryKey: queryKeys.dashboard.postos(),
    queryFn: () => service.listPostos(),
  });
  const postos = postosQuery.data ?? [];
  const data = dataQuery.data ?? null;
  const loading = dataQuery.isPending || postosQuery.isPending;
  const rawError = dataQuery.error ?? postosQuery.error;
  // Erros fora do contrato DashboardError entram como retryable para não
  // esconder o botão "Tentar novamente".
  const error: DashboardError | null = rawError
    ? "code" in rawError
      ? (rawError as DashboardError)
      : Object.assign(rawError, { code: "falha_temporaria", retryable: true } as const)
    : null;

  return (
    <Page className="dashboard-operational">
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard operacional"
        description={`Exibindo ${filters.inicio === filters.fim ? formatDay(filters.inicio) : `${formatDay(filters.inicio)} a ${formatDay(filters.fim)}`} · ${filters.postoId ? (postos.find((posto) => posto.id === filters.postoId)?.nome ?? "Posto selecionado") : "Todos os postos"}`}
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
              <Button onClick={() => void dataQuery.refetch()}>Tentar novamente</Button>
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
