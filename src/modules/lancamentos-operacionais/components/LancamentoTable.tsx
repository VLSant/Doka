import { Link } from "react-router-dom";
import { RowActionsMenu } from "../../../components/ui/RowActionsMenu";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  TableCardHeader,
  TableCardList,
  TableCardRow,
  type TableCardHeaderColumn,
} from "../../../components/ui/TableCardRow";
import type { Lancamento } from "../types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const COLUMNS: TableCardHeaderColumn[] = [
  { key: "data", label: "Data", width: "110px", sortable: true },
  { key: "tipo", label: "Tipo", width: "130px" },
  { key: "posto", label: "Posto", width: "130px" },
  { key: "assistencia", label: "Assistencia", width: "130px" },
  { key: "responsavel", label: "Responsavel", width: "minmax(150px, 1fr)" },
  { key: "status", label: "Status", width: "110px" },
  { key: "valor", label: "Valor", width: "120px", align: "right", sortable: true },
];

export function LancamentoTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  items: Lancamento[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (item: Lancamento) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <TableCardList role="table" aria-label="Deslocamentos e custos extras">
      <TableCardHeader
        columns={COLUMNS}
        allSelected={items.length > 0 && items.every((item) => selectedIds.has(item.id))}
        onToggleAll={onToggleAll}
      />
      {items.map((item) => (
        <TableCardRow
          key={item.id}
          id={item.id}
          selected={selectedIds.has(item.id)}
          onToggleSelect={onToggleSelect}
          columns={[
            {
              key: "data",
              label: "Data",
              width: "110px",
              value: date.format(new Date(`${item.data_lancamento}T00:00:00Z`)),
            },
            {
              key: "tipo",
              label: "Tipo",
              width: "130px",
              value: (
                <StatusBadge tone="brand" className="doka-status-badge--category">
                  {item.tipo === "deslocamento" ? "Deslocamento" : "Custo extra"}
                </StatusBadge>
              ),
            },
            { key: "posto", label: "Posto", width: "130px", value: item.posto?.nome ?? "-" },
            {
              key: "assistencia",
              label: "Assistencia",
              width: "130px",
              value: item.assistencia ? (
                <Link to={`/app/custos-extras/${item.id}`}>{item.assistencia.numero_assistencia}</Link>
              ) : (
                "Sem vinculo"
              ),
            },
            {
              key: "responsavel",
              label: "Responsavel",
              width: "minmax(150px, 1fr)",
              value: item.recurso ?? item.lancador?.nome ?? "-",
            },
            {
              key: "status",
              label: "Status",
              width: "110px",
              value: (
                <StatusBadge tone={item.status === "pendente" ? "warning" : "success"}>
                  {item.status === "pendente" ? "Pendente" : "Validado"}
                </StatusBadge>
              ),
            },
            {
              key: "valor",
              label: "Valor",
              width: "120px",
              align: "right",
              value: <span className="doka-card-row__value">{currency.format(item.valor)}</span>,
            },
          ]}
          actions={
            <RowActionsMenu
              onEdit={item.status === "pendente" ? () => onEdit(item.id) : undefined}
              onDuplicate={() => onDuplicate(item)}
              onRemove={() => onRemove(item.id)}
            />
          }
        />
      ))}
    </TableCardList>
  );
}
