import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../auth/AuthProvider";
import { createTaskService, type TaskService } from "../task-service";
import type { Routine, TaskViewer } from "../types";
import "../tasks.css";

const RECURRENCE = {
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

export function RoutineListPage({ service: injected, viewer: injectedViewer }: { service?: TaskService; viewer?: TaskViewer }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const viewer = injectedViewer ?? (auth.state.name === "autorizado" ? {
    usuarioId: auth.state.context.usuarioId,
    perfil: auth.state.context.perfil,
    postoIds: auth.state.context.postos.map(({ postoId }) => postoId),
  } : null);
  const service = useMemo(() => injected ?? createTaskService(), [injected]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try { setRoutines(await service.listRoutines()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar as rotinas."); }
    finally { setLoading(false); }
  }, [service]);
  // Initial Data API synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  if (!viewer) return null;
  if (viewer.perfil === "operador") return <FeedbackState tone="error" title="Acesso negado" description="Somente Supervisão e Direção podem administrar rotinas." />;
  return (
    <main className="tasks-module">
      <header className="tasks-header">
        <div><Link to="/app/tarefas-rotinas">Voltar para tarefas</Link><h1>Rotinas recorrentes</h1><p>Atividades geradas automaticamente conforme a frequência configurada.</p></div>
        <Link className="tasks-link-button" to="/app/tarefas-rotinas/rotinas/nova">Nova rotina</Link>
      </header>
      {loading ? <LoadingState message="Carregando rotinas..." /> : null}
      {error ? <FeedbackState tone="error" title="Falha ao carregar rotinas" description={error} actions={<Button onClick={() => void load()}>Tentar novamente</Button>} /> : null}
      {!loading && !error && routines.length === 0 ? <FeedbackState tone="empty" title="Nenhuma rotina cadastrada" description="Crie uma rotina para gerar tarefas recorrentes." /> : null}
      {routines.length ? (
        <div className="tasks-table-wrap">
          <table className="tasks-table">
            <thead><tr><th>Rotina</th><th>Frequência</th><th>Responsáveis</th><th>Posto</th><th>Status</th><th /></tr></thead>
            <tbody>{routines.map((routine) => (
              <tr key={routine.id}>
                <td><strong>{routine.nome}</strong><small>Desde {routine.data_inicio}</small></td>
                <td>{RECURRENCE[routine.recorrencia]}</td>
                <td>{routine.responsaveis.map(({ nome }) => nome).join(", ")}</td>
                <td>{routine.posto?.nome ?? "Geral"}</td>
                <td><span className={`tasks-status tasks-status--${routine.status}`}>{routine.status}</span></td>
                <td><Button variant="outline" size="sm" onClick={() => navigate(`/app/tarefas-rotinas/rotinas/${routine.id}/editar`)}>Editar</Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}

export default RoutineListPage;
