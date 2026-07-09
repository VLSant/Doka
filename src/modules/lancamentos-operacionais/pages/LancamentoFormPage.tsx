import { Navigate, useParams } from "react-router-dom";

export function LancamentoFormPage() {
  const { lancamentoId } = useParams();
  const target = lancamentoId
    ? `/app/custos-extras?editar=${lancamentoId}`
    : "/app/custos-extras?novo=1";
  return <Navigate to={target} replace />;
}

export default LancamentoFormPage;
