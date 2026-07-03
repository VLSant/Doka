import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { OccurrenceForm } from "../components/OccurrenceForm";
import {
  createOccurrenceService,
  type OccurrenceService,
} from "../occurrence-service";
import type { OccurrenceCatalogs, OccurrenceInput } from "../types";
import "./Occurrences.css";

export function OccurrenceFormPage({ service: injected }: { service?: OccurrenceService }) {
  const service = useMemo(() => injected ?? createOccurrenceService(), [injected]);
  const navigate = useNavigate();
  const { occurrenceId } = useParams();
  const editing = Boolean(occurrenceId);
  const [catalogs, setCatalogs] = useState<OccurrenceCatalogs | null>(null);
  const [initial, setInitial] = useState<OccurrenceInput | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [options, occurrence] = await Promise.all([
        service.catalogs(),
        occurrenceId ? service.detail(occurrenceId) : Promise.resolve(null),
      ]);
      setCatalogs(options);
      if (occurrence) {
        setInitial({
          assistencia_id: occurrence.assistencia_id,
          posto_id: occurrence.posto_id,
          tipo_ocorrencia_id: occurrence.tipo_ocorrencia_id,
          prioridade_id: occurrence.prioridade_id,
          responsavel_id: occurrence.responsavel_id,
          titulo: occurrence.titulo,
          descricao: occurrence.descricao,
          observacoes: occurrence.observacoes,
          data_retorno: occurrence.data_retorno,
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao carregar o formulário."));
    } finally {
      setLoading(false);
    }
  }, [occurrenceId, service]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  async function submit(input: OccurrenceInput) {
    setSaving(true);
    setError(null);
    try {
      if (occurrenceId) {
        const editable = {
          tipo_ocorrencia_id: input.tipo_ocorrencia_id,
          prioridade_id: input.prioridade_id,
          responsavel_id: input.responsavel_id,
          titulo: input.titulo,
          descricao: input.descricao,
          observacoes: input.observacoes,
          data_retorno: input.data_retorno,
        };
        await service.update(occurrenceId, editable);
        navigate(`/app/ocorrencias/${occurrenceId}`);
      } else {
        const created = await service.create(input);
        navigate(`/app/ocorrencias/${created.id}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao salvar a ocorrência."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="occurrences-page occurrences-page--narrow">
      <header className="occurrences-header">
        <div>
          <span>Ocorrências</span>
          <h1>{editing ? "Editar ocorrência" : "Nova ocorrência"}</h1>
          <p>A assistência é obrigatória e define automaticamente o posto.</p>
        </div>
      </header>
      {loading ? <LoadingState message="Carregando formulário..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title={editing ? "Não foi possível carregar ou salvar" : "Não foi possível salvar"}
          description={error.message}
          actions={
            !catalogs ? <Button onClick={() => void load()}>Tentar novamente</Button> : undefined
          }
        />
      ) : null}
      {!loading && catalogs ? (
        <Card padding="lg">
          <OccurrenceForm
            catalogs={catalogs}
            initial={initial}
            editing={editing}
            saving={saving}
            onSubmit={submit}
            onCancel={() => navigate(occurrenceId ? `/app/ocorrencias/${occurrenceId}` : "/app/ocorrencias")}
          />
        </Card>
      ) : null}
    </main>
  );
}

export default OccurrenceFormPage;
