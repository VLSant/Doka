import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { Card } from "../../../components/ui/Card";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { Select, Textarea } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { StatusBadge, type StatusTone } from "../../../components/ui/StatusBadge";
import { EntityHistory } from "../../auditoria/EntityHistory";
import { isOccurrenceOverdue, nextStatuses, STATUS_LABELS } from "../occurrence-state";
import { createOccurrenceService, type OccurrenceService } from "../occurrence-service";
import type { OccurrenceStatus } from "../types";
import "./Occurrences.css";

const STATUS_TONE: Record<OccurrenceStatus, StatusTone> = {
  aberta: "warning",
  em_acompanhamento: "info",
  aguardando_retorno: "warning",
  resolvida: "success",
  encerrada: "neutral",
  reaberta: "warning",
};

export function OccurrenceDetailPage({ service: injected }: { service?: OccurrenceService }) {
  const service = useMemo(() => injected ?? createOccurrenceService(), [injected]);
  const navigate = useNavigate();
  const { ocorrenciaId = "" } = useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  const [comment, setComment] = useState("");
  const [nextStatus, setNextStatus] = useState<OccurrenceStatus | "">("");
  const [justification, setJustification] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: queryKeys.occurrences.detail(ocorrenciaId),
    queryFn: () => service.detail(ocorrenciaId),
    enabled: Boolean(ocorrenciaId),
  });
  const occurrence = detailQuery.data ?? null;
  const loading = detailQuery.isPending;
  const reloadOccurrence = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.occurrences.detail(ocorrenciaId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.occurrences.list() });
  };
  const commentMutation = useMutation({
    mutationFn: (value: string) => service.addComment(ocorrenciaId, value),
    onSuccess: async () => {
      setComment("");
      await reloadOccurrence();
    },
    onError: (cause) => setError(cause instanceof Error ? cause : new Error("Falha ao adicionar comentario.")),
  });
  const transitionMutation = useMutation({
    mutationFn: (input: { status: OccurrenceStatus; justification: string; returnDate: string }) =>
      service.transition(ocorrenciaId, input.status, input.justification, input.returnDate || null),
    onSuccess: async () => {
      setNextStatus("");
      setJustification("");
      await reloadOccurrence();
    },
    onError: (cause) => setError(cause instanceof Error ? cause : new Error("Falha ao alterar o status.")),
  });
  const removeMutation = useMutation({
    mutationFn: (reason: string) => service.remove(ocorrenciaId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.occurrences.all });
      navigate("/app/ocorrencias");
    },
    onError: (cause) => setError(cause instanceof Error ? cause : new Error("Falha ao remover a ocorrencia.")),
  });
  const isActing = commentMutation.isPending || transitionMutation.isPending || removeMutation.isPending;

  function addComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    setError(null);
    commentMutation.mutate(comment);
  }

  function transition() {
    if (!nextStatus) return;
    if (nextStatus === "reaberta" && !justification.trim()) {
      setError(new Error("Informe a justificativa para reabrir."));
      return;
    }
    setError(null);
    transitionMutation.mutate({ status: nextStatus, justification, returnDate });
  }

  function remove(reason: string) {
    setError(null);
    removeMutation.mutate(reason);
  }

  if (loading && !occurrence) return <LoadingState message="Carregando ocorrência..." />;
  if (!occurrence) {
    return (
      <FeedbackState
        tone="error"
        title="Ocorrência indisponível"
        description={error?.message ?? "O registro não foi encontrado."}
        actions={<Button onClick={() => void detailQuery.refetch()}>Tentar novamente</Button>}
      />
    );
  }

  return (
    <Page className="occurrences-page" width="narrow">
      <PageHeader
        eyebrow={`Assistência ${occurrence.assistencia?.numero_assistencia ?? ""}`.trim()}
        title={occurrence.titulo}
        description={occurrence.descricao || "Sem descrição."}
        actions={
          <div className="occurrence-actions">
            <ButtonLink variant="outline" to={`/app/ocorrencias/${occurrence.id}/editar`}>
              Editar
            </ButtonLink>
            <Button variant="danger" disabled={isActing} onClick={() => setRemoveOpen(true)}>
              Remover
            </Button>
          </div>
        }
      />

      <div className="occurrence-status-row">
        <StatusBadge tone={STATUS_TONE[occurrence.status]}>
          {STATUS_LABELS[occurrence.status]}
        </StatusBadge>
        {isOccurrenceOverdue(occurrence) ? <StatusBadge tone="danger">Atrasada</StatusBadge> : null}
      </div>

      {error ? (
        <FeedbackState
          tone="error"
          title="A operação não foi concluída"
          description={error.message}
        />
      ) : null}

      <div className="occurrence-detail-grid">
        <Card padding="lg">
          <h2>Dados principais</h2>
          <dl className="occurrence-data">
            <div>
              <dt>Tipo</dt>
              <dd>{occurrence.tipo?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd>{occurrence.prioridade?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt>Posto</dt>
              <dd>{occurrence.posto?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{occurrence.responsavel?.nome ?? "Não definido"}</dd>
            </div>
            <div>
              <dt>Retorno</dt>
              <dd>{occurrence.data_retorno ?? "Sem data"}</dd>
            </div>
            <div>
              <dt>Atualizada</dt>
              <dd>{new Date(occurrence.updated_at).toLocaleString("pt-BR")}</dd>
            </div>
          </dl>
          <h3>Descrição</h3>
          <p>{occurrence.descricao || "Sem descrição."}</p>
          <h3>Observações</h3>
          <p>{occurrence.observacoes || "Sem observações."}</p>
        </Card>

        <Card padding="lg">
          <h2>Alterar status</h2>
          <Select
            label="Novo status"
            value={nextStatus}
            disabled={isActing}
            onChange={(event) => setNextStatus(event.target.value as OccurrenceStatus | "")}
          >
            <option value="">Selecione</option>
            {nextStatuses(occurrence.status).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
          {nextStatus === "aguardando_retorno" || nextStatus === "reaberta" ? (
            <Input
              label="Data de retorno"
              type="date"
              value={returnDate}
              onChange={(event) => setReturnDate(event.target.value)}
            />
          ) : null}
          {nextStatus === "reaberta" ? (
            <Textarea
              label="Justificativa *"
              rows={3}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
            />
          ) : null}
          <Button disabled={!nextStatus} loading={isActing} onClick={() => void transition()}>
            Confirmar mudança
          </Button>
        </Card>
      </div>

      <Card padding="lg">
        <h2>Comentários e acompanhamento</h2>
        <form className="occurrence-comment-form" onSubmit={(event) => void addComment(event)}>
          <Textarea
            label="Novo comentário"
            rows={3}
            value={comment}
            disabled={isActing}
            onChange={(event) => setComment(event.target.value)}
          />
          <Button type="submit" disabled={!comment.trim()} loading={isActing}>
            Adicionar
          </Button>
        </form>
        {occurrence.comentarios.length === 0 ? (
          <p>Nenhum comentário registrado.</p>
        ) : (
          <ol className="occurrence-comments">
            {occurrence.comentarios.map((item) => (
              <li key={item.id}>
                <strong>{item.usuario?.nome ?? "Usuário"}</strong>
                <time dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString("pt-BR")}
                </time>
                <p>{item.comentario}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
      <EntityHistory entityType="ocorrencias" entityId={occurrence.id} />
      <RemovalAlertDialog
        open={removeOpen}
        title="Remover ocorrencia"
        description="Esta acao remove logicamente a ocorrencia e exige justificativa para auditoria."
        requireJustification
        loading={removeMutation.isPending}
        onOpenChange={setRemoveOpen}
        onConfirm={(reason) => void remove(reason)}
      />
    </Page>
  );
}

export default OccurrenceDetailPage;
