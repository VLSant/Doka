import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LotItemsTabs } from "../components/LotItemsTabs";
import { LotSummary } from "../components/LotSummary";
import { UndoImportDialog } from "../components/UndoImportDialog";
import { createLotService, type LotService } from "../lot-service";
import { createTreatmentService, type TreatmentService } from "../treatment-service";
import type { LotDetail } from "../types";
import "./ImportListPage.css";

export function ImportDetailPage({ lotService: injectedLot, treatmentService: injectedTreatment }: {
  lotService?: LotService; treatmentService?: TreatmentService;
}) {
  const { loteId = "" } = useParams();
  const lotService = useMemo(() => injectedLot ?? createLotService(), [injectedLot]);
  const treatment = useMemo(() => injectedTreatment ?? createTreatmentService(), [injectedTreatment]);
  const [lot, setLot] = useState<LotDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setLot(await lotService.detail(loteId)); } catch (e) { setError(e instanceof Error ? e.message : "Lote indisponível."); }
    finally { setLoading(false); }
  }, [lotService, loteId]);
  // Initial RPC load is the external synchronization performed by this effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  if (loading) return <p role="status">Carregando lote...</p>;
  if (error || !lot) return <FeedbackState tone="error" title="Lote indisponível" description={error || "Acesso negado."} />;
  return <main className="mms-management">
    <header className="mms-management__header"><div><Link to="/app/importacoes-mms">Voltar à central</Link><h1>Detalhe da importação</h1></div>
      <div>{lot.capacidades.corrigir ? <ButtonLink to={`/app/importacoes-mms/${lot.lote_id}/tratamento`}>Tratar erros</ButtonLink> : null}</div>
    </header>
    <Card padding="lg"><LotSummary lot={lot} onDownload={() => void lotService.downloadOriginal(lot)} /></Card>
    {lot.capacidades.analisar_desfazer ? <UndoImportDialog lotId={lot.lote_id} service={treatment} onComplete={load} /> : null}
    <Card padding="lg"><LotItemsTabs lotId={lot.lote_id} service={lotService} /></Card>
  </main>;
}
export default ImportDetailPage;
