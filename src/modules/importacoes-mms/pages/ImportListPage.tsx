import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { Card } from "../../../components/ui/Card";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
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

  const load = useCallback(async (nextFilters: Filters, nextCursor: ManagementCursor | null, append = false) => {
    setLoading(true); setError("");
    try {
      const page = await service.list(nextFilters, nextCursor);
      setLots((current) => append ? [...current, ...page.itens] : page.itens);
      setCursor(page.proximo_cursor);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar os lotes."); }
    finally { setLoading(false); }
  }, [service]);

  // Initial RPC load is the external synchronization performed by this effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load({}, null); }, [load]);
  function apply(next: Filters) { setFilters(next); void load(next, null); }

  return <Page className="mms-management">
    <PageHeader eyebrow="Importações MMS" title="Central de importações"
      description="Consulte, audite e trate os lotes dentro do seu escopo operacional."
      actions={<ButtonLink to="/app/importacoes-mms/nova">Nova importação</ButtonLink>} />
    <Card padding="lg"><LotFilters value={filters} disabled={loading} onChange={apply} /></Card>
    {loading && lots.length === 0 ? <LoadingState message="Carregando importações..." /> : null}
    {error ? <FeedbackState tone="error" title="Falha ao carregar importações" description={error}
      actions={<Button onClick={() => void load(filters, null)}>Tentar novamente</Button>} /> : null}
    {!loading && !error && lots.length === 0 ? <FeedbackState tone="empty"
      title={Object.keys(filters).length ? "Nenhum lote corresponde aos filtros" : "Nenhuma importação disponível"}
      description={Object.keys(filters).length ? "Revise ou limpe os filtros aplicados." : "Inicie uma nova importação MMS."}
      actions={!Object.keys(filters).length ? <ButtonLink to="/app/importacoes-mms/nova">Nova importação</ButtonLink> : undefined} /> : null}
    {lots.length ? <><p role="status">{lots.length} lote(s) exibido(s).</p><LotsTable lots={lots} />
      {cursor ? <Button variant="outline" loading={loading} onClick={() => void load(filters, cursor, true)}>Carregar mais</Button> : null}</> : null}
  </Page>;
}

export default ImportListPage;
