import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { Card } from "../../../components/ui/Card";
import { Drawer } from "../../../components/ui/Drawer";
import { FilterChips } from "../../../components/ui/FilterChips";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Select } from "../../../components/ui/FormControls";
import { Skeleton } from "../../../components/ui/Skeleton";
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      />

      <div className="doka-list-toolbar">
        <SearchInput
          value={filters.recurso ?? ""}
          placeholder="Buscar responsável ou recurso…"
          onChange={(recurso) =>
            setFilters((current) => ({ ...current, recurso: recurso || undefined }))
          }
        />
        <Select
          className="doka-list-toolbar__select"
          aria-label="Status"
          value={filters.status ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value as LancamentoFilters["status"],
            }))
          }
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="validado">Validado</option>
        </Select>
        <Button variant="outline" onClick={() => setFiltersOpen(true)}>
          Filtros ({Object.values(filters).filter(Boolean).length})
        </Button>
        <span className="doka-list-toolbar__spacer" />
        <ButtonLink to="/app/custos-extras/novo">Novo lançamento</ButtonLink>
      </div>
      <FilterChips
        items={Object.entries(filters)
          .filter(([key, value]) => !["recurso", "status"].includes(key) && value)
          .map(([id, value]) => ({ id, label: `${id.replaceAll("_", " ")}: ${value}` }))}
        onRemove={(id) => setFilters((current) => ({ ...current, [id]: undefined }))}
        onClear={() => setFilters({ recurso: filters.recurso, status: filters.status })}
      />
      <Drawer
        open={filtersOpen}
        title="Filtros de lançamentos"
        onClose={() => setFiltersOpen(false)}
      >
        <LancamentoFiltersForm
          value={filters}
          postos={options.postos}
          assistencias={options.assistencias}
          disabled={loading}
          onChange={setFilters}
        />
      </Drawer>

      {loading ? <Skeleton message="Carregando lançamentos..." /> : null}
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
