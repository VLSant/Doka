import { Navigate, useParams } from "react-router-dom";

export function TaskFormPage() {
  const { tarefaId } = useParams();
  const target = tarefaId
    ? `/app/tarefas-rotinas?editar=${tarefaId}`
    : "/app/tarefas-rotinas?novo=1";
  return <Navigate to={target} replace />;
}

export default TaskFormPage;
