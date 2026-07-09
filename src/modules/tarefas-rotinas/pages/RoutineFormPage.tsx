import { Navigate, useParams } from "react-router-dom";

export function RoutineFormPage() {
  const { rotinaId } = useParams();
  const target = rotinaId
    ? `/app/tarefas-rotinas/rotinas?editar=${rotinaId}`
    : "/app/tarefas-rotinas/rotinas?nova=1";
  return <Navigate to={target} replace />;
}

export default RoutineFormPage;
