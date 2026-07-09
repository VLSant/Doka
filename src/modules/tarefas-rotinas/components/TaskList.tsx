import { Link } from "react-router-dom";
import { TableFrame } from "../../../components/ui/Patterns";
import { StatusBadge, type StatusTone } from "../../../components/ui/StatusBadge";
import { isTaskLate } from "../task-state";
import type { Task } from "../types";

const STATUS_LABEL: Record<Task["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
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

function dateLabel(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <TableFrame>
      <table>
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Responsável</th>
            <th>Posto</th>
            <th>Prazo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <Link to={`/app/tarefas-rotinas/${task.id}`}>{task.titulo}</Link>
                {task.rotina_id ? (
                  <small className="tasks-table__meta">Gerada por rotina</small>
                ) : null}
              </td>
              <td>{task.responsaveis.map(({ nome }) => nome).join(", ") || "Não informado"}</td>
              <td>{task.posto?.nome ?? "Geral"}</td>
              <td className={isTaskLate(task) ? "tasks-table__late" : ""}>
                {dateLabel(task.prazo_data)}
                {isTaskLate(task) ? <small className="tasks-table__meta">Atrasada</small> : null}
              </td>
              <td>
                <StatusBadge tone={STATUS_TONE[task.status]}>
                  {STATUS_LABEL[task.status]}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}
