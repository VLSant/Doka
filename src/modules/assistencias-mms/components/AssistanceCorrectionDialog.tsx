import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import { Textarea } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import type { AssistanceService } from "../assistance-service";
import type {
  CorrectableEntity,
  CorrectableField,
  CorrectionResult,
  EffectiveValue,
} from "../types";

export interface CorrectionTarget {
  entityType: CorrectableEntity;
  entityId: string;
  field: CorrectableField;
  label: string;
  value: EffectiveValue;
  version: number;
}

export function AssistanceCorrectionDialog({
  target,
  service,
  onClose,
  onSaved,
}: {
  target: CorrectionTarget;
  service: AssistanceService;
  onClose: () => void;
  onSaved: (result: CorrectionResult) => void;
}) {
  const [value, setValue] = useState(target.value.vigente ?? "");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    if (!value.trim()) {
      setMessage("Informe o novo valor.");
      return;
    }
    if (!reason.trim()) {
      setMessage("Informe uma justificativa.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const result = await service.correctField({
        tipo_entidade: target.entityType,
        entidade_id: target.entityId,
        campo: target.field,
        valor_corrigido: value,
        justificativa: reason,
        versao_esperada: target.version,
      });
      onSaved(result);
    } catch (error) {
      const code = (error as { code?: string }).code;
      setMessage(
        code === "correcao_desatualizada"
          ? "Este valor foi alterado por outra pessoa. Seu texto foi preservado; feche, recarregue e revise antes de salvar."
          : error instanceof Error
            ? error.message
            : "Não foi possível salvar a correção.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      title={`Corrigir ${target.label.toLocaleLowerCase("pt-BR")}`}
      onClose={() => !saving && onClose()}
      actions={<>
        <Button variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button>
        <Button loading={saving} onClick={() => void save()}>Confirmar correção</Button>
      </>}
    >
        <dl>
          <dt>Importado da MMS</dt>
          <dd>{target.value.importado || "Não informado"}</dd>
          <dt>Valor vigente</dt>
          <dd>{target.value.vigente || "Não informado"}</dd>
        </dl>
        <Input label="Novo valor" autoFocus value={value} disabled={saving} onChange={(event) => setValue(event.target.value)} />
        <Textarea label="Justificativa" value={reason} disabled={saving} maxLength={1000} onChange={(event) => setReason(event.target.value)} />
        {message ? <p role="alert">{message}</p> : null}
    </Dialog>
  );
}
