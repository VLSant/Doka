import { useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import type { TreatmentService } from "../treatment-service";

export function ReprocessDialog({ lotId, version, service, onComplete }: {
  lotId: string; version: number; service: TreatmentService; onComplete: () => void;
}) {
  const key = useRef(crypto.randomUUID());
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  async function confirm() {
    setWorking(true); setMessage("");
    try {
      await service.reprocess(lotId, version, key.current);
      setOpen(false); onComplete();
    } catch {
      try {
        const operation = await service.operation(lotId, key.current);
        if (operation.estado === "concluida") { setOpen(false); onComplete(); return; }
      } catch { /* response remains uncertain */ }
      setMessage("Resposta incerta. Consulte o lote antes de repetir a operação.");
    } finally { setWorking(false); }
  }
  return <>
    <Button variant="outline" onClick={() => setOpen(true)}>Reprocessar</Button>
    <Dialog
      open={open}
      title="Confirmar reprocessamento"
      description={`O espelho operacional será atualizado atomicamente com a versão ${version}.`}
      onClose={() => !working && setOpen(false)}
      actions={<>
        <Button variant="outline" disabled={working} onClick={() => setOpen(false)}>Cancelar</Button>
        <Button loading={working} onClick={confirm}>Confirmar reprocessamento</Button>
      </>}
    >
      {message ? <p role="alert">{message}</p> : null}
    </Dialog>
  </>;
}
