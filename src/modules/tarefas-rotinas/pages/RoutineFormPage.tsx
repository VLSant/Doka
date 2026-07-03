import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import type { CatalogService } from "../../../services/catalog-service";
import { useAuth } from "../../auth/AuthProvider";
import { RoutineForm } from "../components/RoutineForm";
import { createTaskService, type TaskService } from "../task-service";
import type { Routine, TaskViewer } from "../types";
import { useTaskCatalogs } from "../use-task-catalogs";
import "../tasks.css";

export function RoutineFormPage({
  service: injected,
  catalogService,
  viewer: injectedViewer,
}: {
  service?: TaskService;
  catalogService?: CatalogService;
  viewer?: TaskViewer;
}) {
  const { rotinaId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const viewer = injectedViewer ?? (auth.state.name === "autorizado" ? {
    usuarioId: auth.state.context.usuarioId,
    perfil: auth.state.context.perfil,
    postoIds: auth.state.context.postos.map(({ postoId }) => postoId),
  } : null);
  const service = useMemo(() => injected ?? createTaskService(), [injected]);
  const { catalogs, loading: catalogsLoading, error: catalogsError } = useTaskCatalogs(catalogService);
  const [routine, setRoutine] = useState<Routine>();
  const [loading, setLoading] = useState(Boolean(rotinaId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!rotinaId) return;
    void service.getRoutine(rotinaId).then(setRoutine).catch((cause: Error) => setError(cause.message)).finally(() => setLoading(false));
  }, [rotinaId, service]);

  if (!viewer) return null;
  if (viewer.perfil === "operador") return <FeedbackState tone="error" title="Acesso negado" description="Somente Supervisão e Direção podem administrar rotinas." />;
  if (loading || catalogsLoading) return <LoadingState message="Preparando rotina..." />;
  if (catalogsError || (rotinaId && !routine)) return <FeedbackState tone="error" title="Não foi possível abrir a rotina" description={error ?? catalogsError?.message} />;

  return (
    <main className="tasks-module tasks-module--form">
      <header className="tasks-header"><div><Link to="/app/tarefas-rotinas/rotinas">Voltar para rotinas</Link><h1>{routine ? "Editar rotina" : "Nova rotina"}</h1></div></header>
      <Card padding="lg">
        <RoutineForm
          initial={routine}
          viewer={viewer}
          {...catalogs}
          saving={saving}
          error={error}
          onCancel={() => navigate("/app/tarefas-rotinas/rotinas")}
          onSubmit={async (input) => {
            setSaving(true);
            setError(undefined);
            try {
              if (routine) await service.updateRoutine(routine.id, input);
              else await service.createRoutine(input);
              navigate("/app/tarefas-rotinas/rotinas");
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Não foi possível salvar a rotina.");
            } finally { setSaving(false); }
          }}
        />
      </Card>
      {routine ? <Button variant="danger" onClick={async () => {
        const justification = window.prompt("Justificativa da remoção:")?.trim();
        if (!justification) return;
        setSaving(true);
        try { await service.removeRoutine(routine.id, justification); navigate("/app/tarefas-rotinas/rotinas"); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível remover."); setSaving(false); }
      }}>Remover rotina</Button> : null}
    </main>
  );
}

export default RoutineFormPage;
