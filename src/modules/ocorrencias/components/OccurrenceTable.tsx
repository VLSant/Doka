import { Link } from "react-router-dom";
import { RowActionsMenu } from "../../../components/ui/RowActionsMenu";
import {
  TableCardHeader,
  TableCardList,
  TableCardRow,
  type TableCardHeaderColumn,
} from "../../../components/ui/TableCardRow";
import { StatusBadge, type StatusTone } from "../../../components/ui/StatusBadge";
import type { SortState } from "../../../lib/sorting";
import { isOccurrenceOverdue, STATUS_LABELS } from "../occurrence-state";
import type { OccurrenceListItem } from "../types";

const TONE: Record<OccurrenceListItem["status"], StatusTone> = {
  aberta: "warning",
  em_acompanhamento: "info",
  aguardando_retorno: "warning",
  resolvida: "success",
  encerrada: "neutral",
  reaberta: "warning",
};

export type OccurrenceSortKey = "assistencia" | "ocorrencia" | "retorno";

function getColumns(
  sort: SortState<OccurrenceSortKey>,
  onSort: (key: OccurrenceSortKey) => void,
): TableCardHeaderColumn[] {
  return [
    {
      key: "assistencia",
      label: "Assistencia",
      width: "118px",
      sortable: true,
      active: sort.key === "assistencia",
      direction: sort.direction,
      onSort: () => onSort("assistencia"),
    },
    {
      key: "ocorrencia",
      label: "Ocorrencia",
      width: "minmax(190px, 1.5fr)",
      sortable: true,
      active: sort.key === "ocorrencia",
      direction: sort.direction,
      onSort: () => onSort("ocorrencia"),
    },
    { key: "tipo", label: "Tipo", width: "130px" },
    { key: "status", label: "Status", width: "150px" },
    { key: "posto", label: "Posto", width: "130px" },
    { key: "responsavel", label: "Responsavel", width: "150px" },
    {
      key: "retorno",
      label: "Retorno",
      width: "110px",
      align: "right",
      sortable: true,
      active: sort.key === "retorno",
      direction: sort.direction,
      onSort: () => onSort("retorno"),
    },
  ];
}

export function OccurrenceTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onEdit,
  onDuplicate,
  onRemove,
  sort,
  onSort,
}: {
  items: OccurrenceListItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (item: OccurrenceListItem) => void;
  onRemove: (id: string) => void;
  sort: SortState<OccurrenceSortKey>;
  onSort: (key: OccurrenceSortKey) => void;
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id));
  return (
    <TableCardList>
      <TableCardHeader
        columns={getColumns(sort, onSort)}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={onToggleAll}
      />
      {items.map((item) => {
        const overdue = isOccurrenceOverdue(item);
        return (
          <TableCardRow
            key={item.id}
            id={item.id}
            selected={selectedIds.has(item.id)}
            highlighted={overdue}
            onToggleSelect={onToggleSelect}
            columns={[
              {
                key: "assistencia",
                label: "Assistencia",
                width: "118px",
                value: item.assistencia?.numero_assistencia ?? "-",
              },
              {
                key: "ocorrencia",
                label: "Ocorrencia",
                width: "minmax(190px, 1.5fr)",
                value: (
                  <>
                    <Link to={`/app/ocorrencias/${item.id}`}>
                      <strong>{item.titulo}</strong>
                    </Link>
                    {item.prioridade?.nome ? (
                      <span className="doka-card-row__muted">{item.prioridade.nome}</span>
                    ) : null}
                  </>
                ),
              },
              {
                key: "tipo",
                label: "Tipo",
                width: "130px",
                value: (
                  <StatusBadge tone="brand" className="doka-status-badge--category">
                    {item.tipo?.nome ?? "-"}
                  </StatusBadge>
                ),
              },
              {
                key: "status",
                label: "Status",
                width: "150px",
                value: (
                  <span className="doka-card-row__chips">
                    <StatusBadge tone={TONE[item.status]}>{STATUS_LABELS[item.status]}</StatusBadge>
                    {overdue ? <StatusBadge tone="danger">Atrasada</StatusBadge> : null}
                  </span>
                ),
              },
              { key: "posto", label: "Posto", width: "130px", value: item.posto?.nome ?? "-" },
              {
                key: "responsavel",
                label: "Responsavel",
                width: "150px",
                value: item.responsavel?.nome ?? "Nao definido",
              },
              {
                key: "retorno",
                label: "Retorno",
                width: "110px",
                align: "right",
                className: overdue ? "doka-card-row__late" : "",
                value: item.data_retorno ?? "Sem data",
              },
            ]}
            actions={
              <RowActionsMenu
                onEdit={() => onEdit(item.id)}
                onDuplicate={() => onDuplicate(item)}
                onRemove={() => onRemove(item.id)}
              />
            }
          />
        );
      })}
    </TableCardList>
  );
}
