import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../auth/AuthProvider";
import { createLancamentoService, type LancamentoService } from "../lancamento-service";
import type { Lancamento } from "../types";
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
  const [item, setItem] = useState<Lancamento | null>(null);
  const [reason, setReason] = useState("");
  const [removing, setRemoving] = useState(false);
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const canManage = state.name === "autorizado" && podeGerenciarLancamento(state.context.perfil);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItem(await service.detail(id));
    } catch (cause) {
      setItem(null);
      setError(cause instanceof Error ? cause : new Error("Falha ao carregar lançamento."));
    } finally {
      setLoading(false);
    }
  }, [id, service]);

  // Remote synchronization for the route identifier.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void load(), [load]);

  async function validate() {
    setWorking(true);
    setError(null);
    try {
      await service.validate(id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao validar lançamento."));
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!reason.trim()) return;
    setWorking(true);
    setError(null);
    try {
      await service.remove(id, reason);
      navigate("/app/custos-extras", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao remover lançamento."));
      setWorking(false);
    }
  }

  return (
    <main className="lancamentos-page">
      <header className="lancamentos-page__header">
        <div>
          <span>Deslocamentos e custos extras</span>
          <h1>Detalhe do lançamento</h1>
        </div>
        <Button variant="outline" onClick={() => navigate("/app/custos-extras")}>
          Voltar
        </Button>
      </header>
      {loading ? <LoadingState message="Carregando lançamento..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title="Não foi possível concluir a operação"
          description={error.message}
          actions={<Button onClick={() => void load()}>Tentar novamente</Button>}
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
                <dd>{item.status === "pendente" ? "Pendente" : "Validado"}</dd>
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
                <Link
                  className="lancamentos-link-button lancamentos-link-button--outline"
                  to={`/app/custos-extras/${id}/editar`}
                >
                  Editar
                </Link>
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
            {removing ? (
              <div>
                <label htmlFor="remove-reason">Justificativa da remoção</label>
                <textarea
                  id="remove-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className="lancamento-actions__row">
                  <Button
                    variant="danger"
                    loading={working}
                    disabled={!reason.trim()}
                    onClick={() => void remove()}
                  >
                    Confirmar remoção
                  </Button>
                  <Button variant="outline" disabled={working} onClick={() => setRemoving(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </>
      ) : null}
    </main>
  );
}

export default LancamentoDetailPage;
