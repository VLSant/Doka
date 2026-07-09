import { Link } from "react-router-dom";
import { TableFrame } from "../../../components/ui/Patterns";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { AssistanceListItem } from "../types";

export function AssistanceTable({
  items,
  returnSearch,
}: {
  items: AssistanceListItem[];
  returnSearch: string;
}) {
  return (
    <TableFrame>
      <table className="assistance-table" aria-label="Assistências MMS">
        <thead>
          <tr>
            <th>Número</th>
            <th>Posto</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Partes</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.assistencia_id}>
              <td>
                <span className="assistance-table__code">{item.numero_assistencia}</span>
                {item.situacao === "removido" ? (
                  <StatusBadge tone="danger">Removida</StatusBadge>
                ) : null}
              </td>
              <td>{item.posto.nome}</td>
              <td>{new Date(`${item.data_atividade}T00:00:00`).toLocaleDateString("pt-BR")}</td>
              <td>{item.cliente || "Não informado"}</td>
              <td>{item.tipo || "Não informado"}</td>
              <td><StatusBadge tone={item.status ? "info" : "neutral"}>{item.status || "Não informado"}</StatusBadge></td>
              <td>
                {item.total_partes_ativas}
                {item.total_partes !== item.total_partes_ativas ? ` de ${item.total_partes}` : ""}
              </td>
              <td>
                <Link to={`/app/assistencias-mms/${item.assistencia_id}`} state={{ returnSearch }}>
                  Abrir detalhe
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}
