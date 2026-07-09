import { useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { Textarea } from "../../../components/ui/FormControls";
import type { TreatmentService } from "../treatment-service";
import type { UndoAnalysis } from "../types";

export function UndoImportDialog({ lotId, service, onComplete }: {
  lotId: string; service: TreatmentService; onComplete: () => void;
}) {
  const [analysis, setAnalysis] = useState<UndoAnalysis | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const key = useRef(crypto.randomUUID());
  async function analyze() {
    setWorking(true); setMessage("");
    try { setAnalysis(await service.analyzeUndo(lotId)); } catch (e) { setMessage(e instanceof Error ? e.message : "Falha na análise."); }
    finally { setWorking(false); }
  }
  async function undo() {
    if (!analysis?.assinatura_analise || reason.trim().length < 10) {
      setMessage("Informe uma justificativa com pelo menos 10 caracteres."); return;
    }
    setWorking(true); setMessage("");
    try { await service.undo(lotId, analysis.assinatura_analise, reason, key.current); onComplete(); setAnalysis(null); }
    catch (e) {
      if ((e as { code?: string }).code === "analise_desatualizada") setAnalysis(null);
      setMessage(e instanceof Error ? e.message : "Não foi possível desfazer.");
    } finally { setWorking(false); }
  }
  return <div className="mms-undo">
    <Button variant="outline" loading={working && !analysis} onClick={analyze}>Analisar desfazer</Button>
    <Dialog
      open={Boolean(analysis)}
      title={analysis?.elegivel ? "Desfazer importação" : "Importação não pode ser desfeita"}
      onClose={() => !working && setAnalysis(null)}
      actions={analysis?.elegivel ? <>
        <Button variant="outline" disabled={working} onClick={() => setAnalysis(null)}>Cancelar</Button>
        <Button variant="danger" loading={working} onClick={undo}>Confirmar desfazer</Button>
      </> : <Button variant="outline" onClick={() => setAnalysis(null)}>Fechar</Button>}
    >
      {analysis ? <>
      {!analysis.elegivel ? <ul>{analysis.motivos_bloqueio.map((reasonCode) => <li key={reasonCode}>{reasonCode}</li>)}</ul> : <>
        <p>Esta operação restaura o predecessor de cada posto/data sem excluir evidências.</p>
        <Textarea label="Justificativa" value={reason} onChange={(e) => setReason(e.target.value)} />
      </>}
      </> : null}
    </Dialog>
    {message ? <p role="alert">{message}</p> : null}
  </div>;
}
