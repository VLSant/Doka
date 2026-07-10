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
import { isTaskLate } from "../task-state";
import type { Task } from "../types";

const STATUS_LABEL: Record<Task["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  validada: "Validada",
  reaberta: "Reaberta",
};

const STATUS_TONE: Record<Task["status"], StatusTone> = {
  pendente: "neutral",
  em_andamento: "info",
  concluida: "success",
  validada: "success",
  reaberta: "warning",
};

export type TaskSortKey = "tarefa" | "prazo";

function getColumns(
  sort: SortState<TaskSortKey>,
  onSort: (key: TaskSortKey) => void,
): TableCardHeaderColumn[] {
  return [
    {
      key: "tarefa",
      label: "Tarefa",
      width: "minmax(220px, 1.7fr)",
      sortable: true,
      active: sort.key === "tarefa",
      direction: sort.direction,
      onSort: () => onSort("tarefa"),
    },
    { key: "responsavel", label: "Responsavel", width: "minmax(150px, 1fr)" },
    { key: "posto", label: "Posto", width: "130px" },
    {
      key: "prazo",
      label: "Prazo",
      width: "120px",
      align: "right",
      sortable: true,
      active: sort.key === "prazo",
      direction: sort.direction,
      onSort: () => onSort("prazo"),
    },
    { key: "status", label: "Status", width: "130px" },
  ];
}

function dateLabel(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export function TaskList({
  tasks,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onEdit,
  onDuplicate,
  onRemove,
  sort,
  onSort,
}: {
  tasks: Task[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (task: Task) => void;
  onRemove: (id: string) => void;
  sort: SortState<TaskSortKey>;
  onSort: (key: TaskSortKey) => void;
}) {
  const allSelected = tasks.length > 0 && tasks.every((task) => selectedIds.has(task.id));
  const someSelected = tasks.some((task) => selectedIds.has(task.id));
  return (
    <TableCardList>
      <TableCardHeader
        columns={getColumns(sort, onSort)}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={onToggleAll}
      />
      {tasks.map((task) => {
        const late = isTaskLate(task);
        return (
          <TableCardRow
            key={task.id}
            id={task.id}
            selected={selectedIds.has(task.id)}
            highlighted={late}
            onToggleSelect={onToggleSelect}
            columns={[
              {
                key: "tarefa",
                label: "Tarefa",
                width: "minmax(220px, 1.7fr)",
                value: (
                  <>
                    <Link to={`/app/tarefas-rotinas/${task.id}`}>
                      <strong>{task.titulo}</strong>
                    </Link>
                    <span className="doka-card-row__muted">
                      {task.rotina_id ? "Gerada por rotina" : task.tipo}
                    </span>
                  </>
                ),
              },
              {
                key: "responsavel",
                label: "Responsavel",
                width: "minmax(150px, 1fr)",
                value: task.responsaveis.map(({ nome }) => nome).join(", ") || "Nao informado",
              },
              { key: "posto", label: "Posto", width: "130px", value: task.posto?.nome ?? "Geral" },
              {
                key: "prazo",
                label: "Prazo",
                width: "120px",
                align: "right",
                className: late ? "doka-card-row__late" : "",
                value: (
                  <>
                    {dateLabel(task.prazo_data)}
                    {late ? <span className="doka-card-row__muted">Atrasada</span> : null}
                  </>
                ),
              },
              {
                key: "status",
                label: "Status",
                width: "130px",
                value: <StatusBadge tone={STATUS_TONE[task.status]}>{STATUS_LABEL[task.status]}</StatusBadge>,
              },
            ]}
            actions={
              <RowActionsMenu
                onEdit={() => onEdit(task.id)}
                onDuplicate={() => onDuplicate(task)}
                onRemove={() => onRemove(task.id)}
              />
            }
          />
        );
      })}
    </TableCardList>
  );
}
