import { Link } from "react-router-dom";
import type { Lancamento } from "../types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function LancamentoTable({ items }: { items: Lancamento[] }) {
  return (
    <div className="lancamentos-table-wrap">
      <table className="lancamentos-table" aria-label="Deslocamentos e custos extras">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Posto</th>
            <th>Assistência</th>
            <th>Responsável</th>
            <th>Status</th>
            <th>Valor</th>
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{date.format(new Date(`${item.data_lancamento}T00:00:00Z`))}</td>
              <td>{item.tipo === "deslocamento" ? "Deslocamento" : "Custo extra"}</td>
              <td>{item.posto?.nome ?? "—"}</td>
              <td>{item.assistencia?.numero_assistencia ?? "Sem vínculo"}</td>
              <td>{item.recurso ?? item.lancador?.nome ?? "—"}</td>
              <td>
                <span className={`lancamentos-status lancamentos-status--${item.status}`}>
                  {item.status === "pendente" ? "Pendente" : "Validado"}
                </span>
              </td>
              <td>{currency.format(item.valor)}</td>
              <td>
                <Link to={`/app/custos-extras/${item.id}`}>Ver detalhe</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
