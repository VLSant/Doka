import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { LancamentoForm } from "../components/LancamentoForm";
import { createLancamentoService, type LancamentoService } from "../lancamento-service";
import type { LancamentoInput } from "../types";
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
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<Error | null>(null);

  const optionsQuery = useQuery({
    queryKey: queryKeys.lancamentos.options(),
    queryFn: () => service.formOptions(),
  });
  const detailQuery = useQuery({
    queryKey: queryKeys.lancamentos.detail(id ?? "novo"),
    queryFn: () => service.detail(id ?? ""),
    enabled: Boolean(id),
  });
  const options = optionsQuery.data ?? null;
  const existing = detailQuery.data ?? null;
  const initial = existing
    ? {
        tipo: existing.tipo,
        assistencia_id: existing.assistencia_id,
        posto_id: existing.posto_id,
        recurso: existing.recurso,
        data_lancamento: existing.data_lancamento,
        descricao: existing.descricao,
        valor: existing.valor,
        observacoes: existing.observacoes,
      }
    : undefined;
  const loading = optionsQuery.isPending || (Boolean(id) && detailQuery.isPending);
  const loadError = optionsQuery.error ?? detailQuery.error;
  const saveMutation = useMutation({
    mutationFn: (input: LancamentoInput) => (id ? service.update(id, input) : service.create(input)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.all });
      navigate(`/app/custos-extras/${result.id}`, { replace: true });
    },
    onError: (cause) => setFormError(cause instanceof Error ? cause : new Error("Falha ao salvar lancamento.")),
  });

  function save(input: LancamentoInput) {
    setFormError(null);
    saveMutation.mutate(input);
  }

  const closeTarget = id ? `/app/custos-extras/${id}` : "/app/custos-extras";
  return (
    <Drawer
      open
      size="lg"
      title={id ? "Editar lançamento" : "Novo lançamento"}
      description="O lançamento respeita o posto da assistência selecionada."
      onClose={() => navigate(closeTarget)}
    >
      {loading ? <LoadingState message="Preparando formulário..." /> : null}
      {(formError ?? loadError) ? (
        <FeedbackState
          tone="error"
          title={id ? "Não foi possível carregar ou salvar" : "Não foi possível salvar"}
          description={(formError ?? loadError)?.message}
          actions={loading ? undefined : <Button onClick={() => setFormError(null)}>Fechar</Button>}
        />
      ) : null}
      {!loading && options ? (
        <LancamentoForm
          key={id ?? "novo"}
          initial={initial}
          options={options}
          saving={saveMutation.isPending}
          onSubmit={save}
          onCancel={() => navigate(closeTarget)}
        />
      ) : null}
    </Drawer>
  );
}

export default LancamentoFormPage;
