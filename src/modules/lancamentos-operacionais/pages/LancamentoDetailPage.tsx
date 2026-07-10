import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { Button } from "../../../components/ui/Button";
import { ButtonLink } from "../../../components/ui/ButtonLink";
import { Card } from "../../../components/ui/Card";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useAuth } from "../../auth/AuthProvider";
import { EntityHistory } from "../../auditoria/EntityHistory";
import { createLancamentoService, type LancamentoService } from "../lancamento-service";
import { podeGerenciarLancamento } from "../types";
import "../lancamentos-operacionais.css";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

interface Props {
  service?: LancamentoService;
  lancamentoId?: string;
}

export function LancamentoDetailPage({ service: injected, lancamentoId }: Props) {
  const params = useParams();
  const id = lancamentoId ?? params.lancamentoId ?? "";
  const service = useMemo(() => injected ?? createLancamentoService(), [injected]);
  const { state } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const canManage = state.name === "autorizado" && podeGerenciarLancamento(state.context.perfil);

  const detailQuery = useQuery({
    queryKey: queryKeys.lancamentos.detail(id),
    queryFn: () => service.detail(id),
    enabled: Boolean(id),
  });
  const item = detailQuery.data ?? null;
  const loading = detailQuery.isPending;
  const validateMutation = useMutation({
    mutationFn: () => service.validate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.all });
    },
    onError: (cause) => setError(cause instanceof Error ? cause : new Error("Falha ao validar lancamento.")),
  });
  const removeMutation = useMutation({
    mutationFn: (value: string) => service.remove(id, value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.all });
      navigate("/app/custos-extras", { replace: true });
    },
    onError: (cause) => setError(cause instanceof Error ? cause : new Error("Falha ao remover lancamento.")),
  });
  const working = validateMutation.isPending || removeMutation.isPending;

  function validate() {
    setError(null);
    validateMutation.mutate();
  }

  function remove(reason: string) {
    setError(null);
    removeMutation.mutate(reason);
  }

  return (
    <Page className="lancamentos-page">
      <PageHeader
        eyebrow="Deslocamentos e custos extras"
        title="Detalhe do lançamento"
        actions={
          <Button variant="outline" onClick={() => navigate("/app/custos-extras")}>
            Voltar
          </Button>
        }
      />
      {loading ? <LoadingState message="Carregando lançamento..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Não foi possível concluir a operação"
          description={error.message}
          actions={<Button onClick={() => void detailQuery.refetch()}>Tentar novamente</Button>}
        />
      ) : null}
      {!loading && !error && !item ? (
        <FeedbackState tone="empty" title="Lançamento não encontrado" />
      ) : null}
      {item ? (
        <>
          <Card padding="lg">
            <dl className="lancamento-detail">
              <div>
                <dt>Tipo</dt>
                <dd>{item.tipo === "deslocamento" ? "Deslocamento" : "Custo extra"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge tone={item.status === "pendente" ? "warning" : "success"}>
                    {item.status === "pendente" ? "Pendente" : "Validado"}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{date.format(new Date(`${item.data_lancamento}T00:00:00Z`))}</dd>
              </div>
              <div>
                <dt>Valor</dt>
                <dd>{currency.format(item.valor)}</dd>
              </div>
              <div>
                <dt>Posto</dt>
                <dd>{item.posto?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt>Assistência</dt>
                <dd>{item.assistencia?.numero_assistencia ?? "Sem vínculo"}</dd>
              </div>
              <div>
                <dt>Responsável / recurso</dt>
                <dd>{item.recurso ?? "—"}</dd>
              </div>
              <div>
                <dt>Lançado por</dt>
                <dd>{item.lancador?.nome ?? "—"}</dd>
              </div>
              <div>
                <dt>Descrição</dt>
                <dd>{item.descricao}</dd>
              </div>
              <div>
                <dt>Observações</dt>
                <dd>{item.observacoes ?? "—"}</dd>
              </div>
              {item.status === "validado" ? (
                <div>
                  <dt>Validado por</dt>
                  <dd>{item.validador?.nome ?? "—"}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
          <Card padding="lg" className="lancamento-actions">
            <h2>Ações</h2>
            <div className="lancamento-actions__row">
              {item.status === "pendente" ? (
                <ButtonLink variant="outline" to={`/app/custos-extras/${id}/editar`}>
                  Editar
                </ButtonLink>
              ) : null}
              {canManage && item.status === "pendente" ? (
                <Button loading={working} onClick={() => void validate()}>
                  Validar
                </Button>
              ) : null}
              {canManage ? (
                <Button variant="danger" disabled={working} onClick={() => setRemoving(true)}>
                  Remover
                </Button>
              ) : null}
            </div>
          </Card>
          <RemovalAlertDialog
            open={removing}
            title="Remover lançamento"
            description="Esta acao remove logicamente o lancamento e exige justificativa para auditoria."
            requireJustification
            loading={working}
            onOpenChange={setRemoving}
            onConfirm={(justification) => void remove(justification)}
          />
          <EntityHistory entityType="lancamentos_operacionais" entityId={item.id} />
        </>
      ) : null}
    </Page>
  );
}

export default LancamentoDetailPage;
