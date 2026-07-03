import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EntityHistory } from "../../auditoria/EntityHistory";
import { isOccurrenceOverdue, nextStatuses, STATUS_LABELS } from "../occurrence-state";
import {
  createOccurrenceService,
  type OccurrenceService,
} from "../occurrence-service";
import type { OccurrenceDetail, OccurrenceStatus } from "../types";
import "./Occurrences.css";

export function OccurrenceDetailPage({ service: injected }: { service?: OccurrenceService }) {
  const service = useMemo(() => injected ?? createOccurrenceService(), [injected]);
  const navigate = useNavigate();
  const { ocorrenciaId = "" } = useParams();
  const [occurrence, setOccurrence] = useState<OccurrenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [comment, setComment] = useState("");
  const [nextStatus, setNextStatus] = useState<OccurrenceStatus | "">("");
  const [justification, setJustification] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOccurrence(await service.detail(ocorrenciaId));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao carregar a ocorrência."));
    } finally {
      setLoading(false);
    }
  }, [ocorrenciaId, service]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    setActing(true);
    setError(null);
    try {
      await service.addComment(ocorrenciaId, comment);
      setComment("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao adicionar comentário."));
    } finally {
      setActing(false);
    }
  }

  async function transition() {
    if (!nextStatus) return;
    if (nextStatus === "reaberta" && !justification.trim()) {
      setError(new Error("Informe a justificativa para reabrir."));
      return;
    }
    setActing(true);
    setError(null);
    try {
      await service.transition(
        ocorrenciaId,
        nextStatus,
        justification,
        returnDate || null,
      );
      setNextStatus("");
      setJustification("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao alterar o status."));
    } finally {
      setActing(false);
    }
  }

  async function remove() {
    const reason = window.prompt("Justificativa para remover a ocorrência:");
    if (!reason?.trim()) return;
    setActing(true);
    setError(null);
    try {
      await service.remove(ocorrenciaId, reason);
      navigate("/app/ocorrencias");
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao remover a ocorrência."));
      setActing(false);
    }
  }

  if (loading && !occurrence) return <LoadingState message="Carregando ocorrência..." />;
  if (!occurrence) {
    return (
      <FeedbackState
        tone="error"
        title="Ocorrência indisponível"
        description={error?.message ?? "O registro não foi encontrado."}
        actions={<Button onClick={() => void load()}>Tentar novamente</Button>}
      />
    );
  }

  return (
    <main className="occurrences-page occurrences-page--narrow">
      <header className="occurrences-header">
        <div>
          <span>Assistência {occurrence.assistencia?.numero_assistencia}</span>
          <h1>{occurrence.titulo}</h1>
          <p>
            {STATUS_LABELS[occurrence.status]}
            {isOccurrenceOverdue(occurrence) ? " · Atrasada" : ""}
          </p>
        </div>
        <div className="occurrence-actions">
          <Link className="occurrences-secondary-link" to={`/app/ocorrencias/${occurrence.id}/editar`}>
            Editar
          </Link>
          <Button variant="danger" disabled={acting} onClick={() => void remove()}>
            Remover
          </Button>
        </div>
      </header>

      {error ? (
        <FeedbackState tone="error" title="A operação não foi concluída" description={error.message} />
      ) : null}

      <div className="occurrence-detail-grid">
        <Card padding="lg">
          <h2>Dados principais</h2>
          <dl className="occurrence-data">
            <div><dt>Tipo</dt><dd>{occurrence.tipo?.nome ?? "—"}</dd></div>
            <div><dt>Prioridade</dt><dd>{occurrence.prioridade?.nome ?? "—"}</dd></div>
            <div><dt>Posto</dt><dd>{occurrence.posto?.nome ?? "—"}</dd></div>
            <div><dt>Responsável</dt><dd>{occurrence.responsavel?.nome ?? "Não definido"}</dd></div>
            <div><dt>Retorno</dt><dd>{occurrence.data_retorno ?? "Sem data"}</dd></div>
            <div><dt>Atualizada</dt><dd>{new Date(occurrence.updated_at).toLocaleString("pt-BR")}</dd></div>
          </dl>
          <h3>Descrição</h3>
          <p>{occurrence.descricao || "Sem descrição."}</p>
          <h3>Observações</h3>
          <p>{occurrence.observacoes || "Sem observações."}</p>
        </Card>

        <Card padding="lg">
          <h2>Alterar status</h2>
          <label>
            Novo status
            <select
              value={nextStatus}
              disabled={acting}
              onChange={(event) => setNextStatus(event.target.value as OccurrenceStatus | "")}
            >
              <option value="">Selecione</option>
              {nextStatuses(occurrence.status).map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </label>
          {nextStatus === "aguardando_retorno" || nextStatus === "reaberta" ? (
            <label>
              Data de retorno
              <input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} />
            </label>
          ) : null}
          {nextStatus === "reaberta" ? (
            <label>
              Justificativa *
              <textarea rows={3} value={justification} onChange={(event) => setJustification(event.target.value)} />
            </label>
          ) : null}
          <Button disabled={!nextStatus} loading={acting} onClick={() => void transition()}>
            Confirmar mudança
          </Button>
        </Card>
      </div>

      <Card padding="lg">
        <h2>Comentários e acompanhamento</h2>
        <form className="occurrence-comment-form" onSubmit={(event) => void addComment(event)}>
          <label>
            Novo comentário
            <textarea
              rows={3}
              value={comment}
              disabled={acting}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
          <Button type="submit" disabled={!comment.trim()} loading={acting}>Adicionar</Button>
        </form>
        {occurrence.comentarios.length === 0 ? (
          <p>Nenhum comentário registrado.</p>
        ) : (
          <ol className="occurrence-comments">
            {occurrence.comentarios.map((item) => (
              <li key={item.id}>
                <strong>{item.usuario?.nome ?? "Usuário"}</strong>
                <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("pt-BR")}</time>
                <p>{item.comentario}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
      <EntityHistory entityType="ocorrencias" entityId={occurrence.id} />
    </main>
  );
}

export default OccurrenceDetailPage;

