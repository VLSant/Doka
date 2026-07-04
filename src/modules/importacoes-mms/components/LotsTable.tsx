import { Link } from "react-router-dom";
import { TableFrame } from "../../../components/ui/Patterns";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import type { LotSummary } from "../types";

export function LotsTable({ lots }: { lots: LotSummary[] }) {
  return (
    <TableFrame className="mms-lots-table-wrap">
      <table className="mms-lots-table">
        <caption className="sr-only">Lotes de importação MMS</caption>
        <thead><tr>
          <th scope="col">Importado em</th><th scope="col">Data operacional</th>
          <th scope="col">Postos</th><th scope="col">Arquivo</th><th scope="col">Status</th>
          <th scope="col">Linhas</th><th scope="col">Erros / alertas</th><th scope="col">Ação</th>
        </tr></thead>
        <tbody>
          {lots.map((lot) => (
            <tr key={lot.lote_id}>
              <td>{new Date(lot.importado_em).toLocaleString("pt-BR")}</td>
              <td>{lot.data_atividade ?? "—"}</td>
              <td>{lot.postos.map((posto) => posto.nome).join(", ")}{lot.visibilidade_parcial ? " (parcial)" : ""}</td>
              <td>{lot.arquivo ?? "Restrito"}</td>
              <td><StatusBadge tone={lot.status === "concluido" ? "success" : lot.status === "erro" ? "danger" : "info"}>{lot.status ?? lot.estado_processamento}</StatusBadge></td>
              <td>{lot.total_linhas} ({lot.total_assistencias} assistências / {lot.total_partes} partes)</td>
              <td>{lot.total_erros_pendentes} / {lot.total_alertas}</td>
              <td>{lot.capacidades.abrir ? <Link to={`/app/importacoes-mms/${lot.lote_id}`}>Abrir</Link> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}
