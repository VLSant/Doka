import { Link } from "react-router-dom";
import { isTaskLate } from "../task-state";
import type { Task } from "../types";

const STATUS_LABEL: Record<Task["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  validada: "Validada",
  reaberta: "Reaberta",
};

function dateLabel(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="tasks-table-wrap">
      <table className="tasks-table">
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
                {task.rotina_id ? <small>Gerada por rotina</small> : null}
              </td>
              <td>{task.responsaveis.map(({ nome }) => nome).join(", ") || "Não informado"}</td>
              <td>{task.posto?.nome ?? "Geral"}</td>
              <td className={isTaskLate(task) ? "tasks-table__late" : ""}>
                {dateLabel(task.prazo_data)}
                {isTaskLate(task) ? <small>Atrasada</small> : null}
              </td>
              <td>
                <span className={`tasks-status tasks-status--${task.status}`}>
                  {STATUS_LABEL[task.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
