import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "../../../app/query-keys";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalHeader,
  AppModalSubtitle,
  AppModalTitle,
} from "../../../components/shadcn/AppModal";
import { Button } from "../../../components/ui/Button";
import { LancamentoForm } from "./LancamentoForm";
import { createLancamentoService, type LancamentoService } from "../lancamento-service";
import type { LancamentoInput } from "../types";

interface LancamentoFormModalProps {
  lancamentoId?: string;
  service?: LancamentoService;
  onClose: () => void;
}

export function LancamentoFormModal({
  lancamentoId,
  service: injected,
  onClose,
}: LancamentoFormModalProps) {
  const service = useMemo(() => injected ?? createLancamentoService(), [injected]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<Error | null>(null);
  const editing = Boolean(lancamentoId);

  const optionsQuery = useQuery({
    queryKey: queryKeys.lancamentos.options(),
    queryFn: () => service.formOptions(),
  });
  const detailQuery = useQuery({
    queryKey: queryKeys.lancamentos.detail(lancamentoId ?? "novo"),
    queryFn: () => service.detail(lancamentoId ?? ""),
    enabled: editing,
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
  const loading = optionsQuery.isPending || (editing && detailQuery.isPending);
  const loadError = optionsQuery.error ?? (editing ? detailQuery.error : null);
  const saveMutation = useMutation({
    mutationFn: (input: LancamentoInput) =>
      lancamentoId ? service.update(lancamentoId, input) : service.create(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.lancamentos.all });
      navigate(`/app/custos-extras/${result.id}`);
    },
    onError: (cause) =>
      setFormError(cause instanceof Error ? cause : new Error("Falha ao salvar lancamento.")),
  });

  return (
    <AppModal open onOpenChange={(open) => (open ? undefined : onClose())}>
      <AppModalContent size="lg">
        <AppModalHeader>
          <AppModalTitle>{editing ? "Editar lancamento" : "Novo lancamento"}</AppModalTitle>
          <AppModalSubtitle>O lancamento respeita o posto da assistencia selecionada.</AppModalSubtitle>
        </AppModalHeader>
        <AppModalBody className="pb-6">
          {loading ? <LoadingState message="Preparando formulario..." /> : null}
          {(formError ?? loadError) ? (
            <FeedbackState
              tone="error"
              title={editing ? "Nao foi possivel carregar ou salvar" : "Nao foi possivel salvar"}
              description={(formError ?? loadError)?.message}
              actions={loading ? undefined : <Button onClick={() => setFormError(null)}>Fechar</Button>}
            />
          ) : null}
          {!loading && options ? (
            <LancamentoForm
              key={lancamentoId ?? "novo"}
              initial={initial}
              options={options}
              saving={saveMutation.isPending}
              onSubmit={(input) => {
                setFormError(null);
                saveMutation.mutate(input);
              }}
              onCancel={onClose}
            />
          ) : null}
        </AppModalBody>
      </AppModalContent>
    </AppModal>
  );
}
