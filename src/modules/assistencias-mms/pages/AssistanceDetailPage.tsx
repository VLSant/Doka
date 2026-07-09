import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page } from "../../../components/layout/Page";
import { Card } from "../../../components/ui/Card";
import { createAssistanceService, type AssistanceService } from "../assistance-service";
import {
  AssistanceCorrectionDialog,
  type CorrectionTarget,
} from "../components/AssistanceCorrectionDialog";
import { AssistanceHistory } from "../components/AssistanceHistory";
import { AssistanceParts } from "../components/AssistanceParts";
import { AssistanceSummary } from "../components/AssistanceSummary";
import type { AssistanceDetail, AssistancePart, CorrectableField, EffectiveValue } from "../types";
import "./AssistanceDetailPage.css";

type PageError = Error & { code?: string };

export function AssistanceDetailPage({ service: injected }: { service?: AssistanceService }) {
  const { assistenciaId = "" } = useParams();
  const location = useLocation();
  const service = useMemo(() => injected ?? createAssistanceService(), [injected]);
  const [assistance, setAssistance] = useState<AssistanceDetail | null>(null);
  const [includeRemoved, setIncludeRemoved] = useState(false);
  const [target, setTarget] = useState<CorrectionTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PageError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssistance(await service.detail(assistenciaId, includeRemoved));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? (cause as PageError)
          : new Error("Não foi possível carregar a assistência."),
      );
    } finally {
      setLoading(false);
    }
  }, [assistenciaId, includeRemoved, service]);

  // Initial/toggle RPC load is the external synchronization performed here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  function editAssistance(field: CorrectableField, label: string, value: EffectiveValue) {
    if (!assistance) return;
    setTarget({
      entityType: "assistencia",
      entityId: assistance.assistencia_id,
      field,
      label,
      value,
      version: assistance.versao_registro,
    });
  }

  function editPart(
    part: AssistancePart,
    field: CorrectableField,
    label: string,
    value: EffectiveValue,
  ) {
    setTarget({
      entityType: "parte",
      entityId: part.parte_id,
      field,
      label,
      value,
      version: part.versao_registro,
    });
  }

  const returnSearch = (location.state as { returnSearch?: string } | null)?.returnSearch;
  const returnTo = `/app/assistencias-mms${returnSearch ? `?${returnSearch}` : ""}`;

  if (loading && !assistance) return <LoadingState message="Carregando assistência..." />;
  if (error && !assistance) {
    return (
      <FeedbackState
        tone="error"
        title={error.code === "acesso_negado" ? "Acesso negado" : "Assistência indisponível"}
        description={error.message}
      />
    );
  }
  if (!assistance) return null;

  return (
    <Page className="assistance-detail">
      <header className="assistance-detail__header">
        <Link to={returnTo}>Voltar para assistências</Link>
        <span>Assistências / MMS</span>
        <h1>Detalhe da assistência</h1>
      </header>
      {error ? <p role="alert">{error.message}</p> : null}
      <AssistanceSummary assistance={assistance} onEdit={editAssistance} />
      <AssistanceParts
        parts={assistance.partes}
        hiddenRemovedCount={assistance.partes_removidas_ocultas}
        includeRemoved={includeRemoved}
        onToggleRemoved={() => setIncludeRemoved((current) => !current)}
        onEdit={editPart}
      />
      {assistance.capacidades.consultar_historico ? (
        <Card padding="lg">
          <h2>Histórico e origem</h2>
          <AssistanceHistory assistanceId={assistance.assistencia_id} service={service} />
        </Card>
      ) : null}
      {target ? (
        <AssistanceCorrectionDialog
          target={target}
          service={service}
          onClose={() => setTarget(null)}
          onSaved={() => {
            setTarget(null);
            void load();
          }}
        />
      ) : null}
    </Page>
  );
}

export default AssistanceDetailPage;
