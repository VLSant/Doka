import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { AssistanceDetail, CorrectableField, EffectiveValue } from "../types";
import { EffectiveValue as EffectiveValueView } from "./EffectiveValue";

export function AssistanceSummary({
  assistance,
  onEdit,
}: {
  assistance: AssistanceDetail;
  onEdit: (field: CorrectableField, label: string, value: EffectiveValue) => void;
}) {
  const canEdit = assistance.capacidades.corrigir_assistencia;
  return (
    <Card padding="lg" className="assistance-summary">
      <div className="assistance-summary__identity">
        <div>
          <span>Número da assistência</span>
          <strong>{assistance.numero_assistencia}</strong>
        </div>
        <StatusBadge tone={assistance.situacao === "removido" ? "danger" : "success"}>
          {assistance.situacao === "removido" ? "Removida" : "Ativa"}
        </StatusBadge>
      </div>
      <dl className="assistance-summary__facts">
        <div>
          <dt>Posto</dt>
          <dd>{assistance.posto.nome}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{new Date(`${assistance.data_atividade}T00:00:00`).toLocaleDateString("pt-BR")}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{assistance.tipo || "Não informado"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{assistance.status || "Não informado"}</dd>
        </div>
      </dl>
      <div className="assistance-summary__values">
        <EffectiveValueView
          label="Cliente"
          value={assistance.cliente}
          onEdit={canEdit ? () => onEdit("cliente_nome", "Cliente", assistance.cliente) : undefined}
        />
        <EffectiveValueView
          label="Endereço"
          value={assistance.endereco}
          onEdit={canEdit ? () => onEdit("endereco", "Endereço", assistance.endereco) : undefined}
        />
      </div>
    </Card>
  );
}
