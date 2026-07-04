import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { Card } from "../../../components/ui/Card";
import { createLancamentoService, type LancamentoService } from "../lancamento-service";
import { LancamentoFiltersForm } from "../components/LancamentoFilters";
import { LancamentoTable } from "../components/LancamentoTable";
import type { Lancamento, LancamentoFilters, LancamentoFormOptions } from "../types";
import "../lancamentos-operacionais.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function LancamentoListPage({ service: injected }: { service?: LancamentoService }) {
  const service = useMemo(() => injected ?? createLancamentoService(), [injected]);
  const [items, setItems] = useState<Lancamento[]>([]);
  const [options, setOptions] = useState<LancamentoFormOptions>({
    postos: [],
    assistencias: [],
  });
  const [filters, setFilters] = useState<LancamentoFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, nextOptions] = await Promise.all([service.list(filters), service.formOptions()]);
      setItems(rows);
      setOptions(nextOptions);
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause : new Error("Falha ao carregar lançamentos."));
    } finally {
      setLoading(false);
    }
  }, [filters, service]);

  // Remote synchronization for the current filter set.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  const total = items.reduce((sum, item) => sum + item.valor, 0);
  const pendentes = items.filter((item) => item.status === "pendente");
  const totalPendente = pendentes.reduce((sum, item) => sum + item.valor, 0);

  return (
    <Page className="lancamentos-page">
      <PageHeader
        eyebrow="Operação"
        title="Deslocamentos e custos extras"
        description="Lance, consulte e valide despesas operacionais em um único lugar."
        actions={<ButtonLink to="/app/custos-extras/novo">Novo lançamento</ButtonLink>}
      />

      <Card padding="lg">
        <LancamentoFiltersForm
          value={filters}
          postos={options.postos}
          assistencias={options.assistencias}
          disabled={loading}
          onChange={setFilters}
        />
      </Card>

      {loading ? <LoadingState message="Carregando lançamentos..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Falha ao carregar lançamentos"
          description={error.message}
          actions={<Button onClick={() => void load()}>Tentar novamente</Button>}
        />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <FeedbackState
          tone="empty"
          title="Nenhum lançamento encontrado"
          description="Registre um lançamento ou ajuste os filtros."
          actions={<ButtonLink to="/app/custos-extras/novo">Novo lançamento</ButtonLink>}
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
    </Page>
  );
}

export default LancamentoListPage;
