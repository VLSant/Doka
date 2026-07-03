import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { LancamentoForm } from "../components/LancamentoForm";
import { createLancamentoService, type LancamentoService } from "../lancamento-service";
import type { LancamentoFormOptions, LancamentoInput } from "../types";
import "../lancamentos-operacionais.css";

interface Props {
  service?: LancamentoService;
  lancamentoId?: string;
}

export function LancamentoFormPage({ service: injected, lancamentoId }: Props) {
  const params = useParams();
  const id = lancamentoId ?? params.lancamentoId;
  const service = useMemo(() => injected ?? createLancamentoService(), [injected]);
  const navigate = useNavigate();
  const [options, setOptions] = useState<LancamentoFormOptions | null>(null);
  const [initial, setInitial] = useState<LancamentoInput | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [nextOptions, existing] = await Promise.all([
          service.formOptions(),
          id ? service.detail(id) : Promise.resolve(null),
        ]);
        if (!active) return;
        setOptions(nextOptions);
        if (existing) {
          setInitial({
            tipo: existing.tipo,
            assistencia_id: existing.assistencia_id,
            posto_id: existing.posto_id,
            recurso: existing.recurso,
            data_lancamento: existing.data_lancamento,
            descricao: existing.descricao,
            valor: existing.valor,
            observacoes: existing.observacoes,
          });
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause : new Error("Falha ao carregar formulário."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id, service]);

  async function save(input: LancamentoInput) {
    setSaving(true);
    setError(null);
    try {
      const result = id ? await service.update(id, input) : await service.create(input);
      navigate(`/app/custos-extras/${result.id}`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error("Falha ao salvar lançamento."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="lancamentos-page">
      <header className="lancamentos-page__header">
        <div>
          <span>Deslocamentos e custos extras</span>
          <h1>{id ? "Editar lançamento" : "Novo lançamento"}</h1>
          <p>O lançamento é manual e respeita o posto da assistência selecionada.</p>
        </div>
      </header>
      {loading ? <LoadingState message="Preparando formulário..." /> : null}
      {error ? (
        <FeedbackState
          tone="error"
          title={id ? "Não foi possível carregar ou salvar" : "Não foi possível salvar"}
          description={error.message}
          actions={loading ? undefined : <Button onClick={() => setError(null)}>Fechar</Button>}
        />
      ) : null}
      {!loading && options ? (
        <Card padding="lg">
          <LancamentoForm
            key={id ?? "novo"}
            initial={initial}
            options={options}
            saving={saving}
            onSubmit={save}
            onCancel={() => navigate(id ? `/app/custos-extras/${id}` : "/app/custos-extras")}
          />
        </Card>
      ) : null}
    </main>
  );
}

export default LancamentoFormPage;
