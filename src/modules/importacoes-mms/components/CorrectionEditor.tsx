import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { TreatmentService } from "../treatment-service";
import type { JsonSafeValue } from "../types";

export function CorrectionEditor({
  lotId,
  lineId,
  field,
  original,
  normalized,
  current,
  version,
  service,
  onSaved,
}: {
  lotId: string;
  lineId: string;
  field: string;
  original: JsonSafeValue;
  normalized: JsonSafeValue;
  current: JsonSafeValue;
  version: number;
  service: TreatmentService;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(String(current ?? ""));
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      await service.saveCorrection({
        lote_id: lotId,
        linha_id: lineId,
        campo: field,
        valor: value,
        versao_esperada: version,
      });
      setStatus("Correção salva.");
      onSaved();
    } catch (error) {
      const code = (error as { code?: string }).code;
      setStatus(
        code === "correcao_desatualizada"
          ? "Esta linha foi corrigida por outro usuário. Revise os novos valores antes de salvar novamente."
          : error instanceof Error
            ? error.message
            : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mms-correction-editor">
      <dl>
        <dt>Original</dt>
        <dd>{String(original ?? "—")}</dd>
        <dt>Normalizado</dt>
        <dd>{String(normalized ?? "—")}</dd>
      </dl>
      <Input
        label="Correção vigente"
        value={value}
        disabled={saving}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button loading={saving} onClick={save}>
        Salvar correção
      </Button>
      {status ? <p role={status === "Correção salva." ? "status" : "alert"}>{status}</p> : null}
    </div>
  );
}
