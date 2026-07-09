import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { AssistancePart, CorrectableField, EffectiveValue } from "../types";
import { EffectiveValue as EffectiveValueView } from "./EffectiveValue";

export function AssistanceParts({
  parts,
  hiddenRemovedCount,
  includeRemoved,
  onToggleRemoved,
  onEdit,
}: {
  parts: AssistancePart[];
  hiddenRemovedCount: number;
  includeRemoved: boolean;
  onToggleRemoved: () => void;
  onEdit: (
    part: AssistancePart,
    field: CorrectableField,
    label: string,
    value: EffectiveValue,
  ) => void;
}) {
  return (
    <section aria-labelledby="assistance-parts-title">
      <div className="assistance-section-heading">
        <div>
          <span>Conjunto</span>
          <h2 id="assistance-parts-title">Partes da assistência</h2>
        </div>
        {hiddenRemovedCount > 0 || includeRemoved ? (
          <Button variant="outline" onClick={onToggleRemoved}>
            {includeRemoved ? "Ocultar removidas" : `Incluir removidas (${hiddenRemovedCount})`}
          </Button>
        ) : null}
      </div>
      <div className="assistance-parts">
        {parts.map((part) => (
          <Card padding="lg" key={part.parte_id}>
            <div className="assistance-part__heading">
              <div>
                <span>Parte do conjunto</span>
                <h3>{part.parte_conjunto}</h3>
              </div>
              {part.situacao === "removido" ? (
                <StatusBadge tone="danger">Removida</StatusBadge>
              ) : null}
            </div>
            <dl className="assistance-summary__facts">
              <div>
                <dt>Tipo</dt>
                <dd>{part.tipo || "Não informado"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{part.status || "Não informado"}</dd>
              </div>
            </dl>
            <div className="assistance-part__values">
              <EffectiveValueView
                label="Descrição da mercadoria"
                value={part.descricao_mercadoria}
                onEdit={
                  part.pode_corrigir
                    ? () =>
                        onEdit(
                          part,
                          "descricao_mercadoria",
                          "Descrição da mercadoria",
                          part.descricao_mercadoria,
                        )
                    : undefined
                }
              />
              <EffectiveValueView
                label="Recurso/montador"
                value={part.recurso}
                onEdit={
                  part.pode_corrigir
                    ? () => onEdit(part, "recurso", "Recurso/montador", part.recurso)
                    : undefined
                }
              />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
