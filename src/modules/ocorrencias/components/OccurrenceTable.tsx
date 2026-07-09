import { Link } from "react-router-dom";
import { TableFrame } from "../../../components/ui/Patterns";
import { StatusBadge, type StatusTone } from "../../../components/ui/StatusBadge";
import { isOccurrenceOverdue, STATUS_LABELS } from "../occurrence-state";
import type { OccurrenceListItem } from "../types";

export function OccurrenceTable({ items }: { items: OccurrenceListItem[] }) {
  const tone: Record<OccurrenceListItem["status"], StatusTone> = {
    aberta: "warning",
    em_acompanhamento: "info",
    aguardando_retorno: "warning",
    resolvida: "success",
    encerrada: "neutral",
    reaberta: "warning",
  };
  return (
    <TableFrame>
      <table>
        <thead>
          <tr>
            <th>Assistência</th>
            <th>Ocorrência</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Posto</th>
            <th>Responsável</th>
            <th>Retorno</th>
            <th aria-label="Ações" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.assistencia?.numero_assistencia ?? "—"}</td>
              <td>
                <strong>{item.titulo}</strong>
              </td>
              <td>{item.tipo?.nome ?? "—"}</td>
              <td>
                <StatusBadge tone={tone[item.status]}>{STATUS_LABELS[item.status]}</StatusBadge>
                {isOccurrenceOverdue(item) ? (
                  <StatusBadge tone="danger">Atrasada</StatusBadge>
                ) : null}
              </td>
              <td>{item.prioridade?.nome ?? "—"}</td>
              <td>{item.posto?.nome ?? "—"}</td>
              <td>{item.responsavel?.nome ?? "Não definido"}</td>
              <td>{item.data_retorno ?? "Sem data"}</td>
              <td>
                <Link to={`/app/ocorrencias/${item.id}`}>Abrir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}
