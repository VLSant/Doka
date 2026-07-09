/**
 * Criação/edição de ocorrência em modal sobre a lista montada (padrão Dracma,
 * plano seção 4.1): a lista nunca desmonta e fechar não refaz fetch — o cache
 * do TanStack Query preserva os dados.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "../../../app/query-keys";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalHeader,
  AppModalSubtitle,
  AppModalTitle,
} from "../../../components/shadcn/AppModal";
import { OccurrenceForm } from "./OccurrenceForm";
import { createOccurrenceService, type OccurrenceService } from "../occurrence-service";
import type { OccurrenceInput } from "../types";

export interface OccurrenceFormModalProps {
  /** undefined = criação; id = edição */
  ocorrenciaId?: string;
  onClose: () => void;
  service?: OccurrenceService;
}

export function OccurrenceFormModal({
  ocorrenciaId,
  onClose,
  service: injected,
}: OccurrenceFormModalProps) {
  const service = useMemo(() => injected ?? createOccurrenceService(), [injected]);
  const navigate = useNavigate();
  const editing = Boolean(ocorrenciaId);
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<Error | null>(null);

  const catalogsQuery = useQuery({
    queryKey: queryKeys.occurrences.catalogs(),
    queryFn: () => service.catalogs(),
  });
  const detailQuery = useQuery({
    queryKey: queryKeys.occurrences.detail(ocorrenciaId ?? "novo"),
    queryFn: () => service.detail(ocorrenciaId ?? ""),
    enabled: editing,
  });
  const catalogs = catalogsQuery.data ?? null;
  const occurrence = detailQuery.data ?? null;
  const initial = occurrence
    ? {
        assistencia_id: occurrence.assistencia_id,
        posto_id: occurrence.posto_id,
        tipo_ocorrencia_id: occurrence.tipo_ocorrencia_id,
        prioridade_id: occurrence.prioridade_id,
        responsavel_id: occurrence.responsavel_id,
        titulo: occurrence.titulo,
        descricao: occurrence.descricao,
        observacoes: occurrence.observacoes,
        data_retorno: occurrence.data_retorno,
      }
    : undefined;
  const loading = catalogsQuery.isPending || (editing && detailQuery.isPending);
  const loadError = catalogsQuery.error ?? (editing ? detailQuery.error : null);

  const saveMutation = useMutation({
    mutationFn: async (input: OccurrenceInput) => {
      if (ocorrenciaId) {
        const editable = {
          tipo_ocorrencia_id: input.tipo_ocorrencia_id,
          prioridade_id: input.prioridade_id,
          responsavel_id: input.responsavel_id,
          titulo: input.titulo,
          descricao: input.descricao,
          observacoes: input.observacoes,
          data_retorno: input.data_retorno,
        };
        await service.update(ocorrenciaId, editable);
        return { id: ocorrenciaId };
      }
      return service.create(input);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.occurrences.all });
      navigate(`/app/ocorrencias/${saved.id}`);
    },
    onError: (cause) => {
      setFormError(cause instanceof Error ? cause : new Error("Falha ao salvar a ocorrência."));
    },
  });

  function submit(input: OccurrenceInput) {
    setFormError(null);
    saveMutation.mutate(input);
  }

  return (
    <AppModal open onOpenChange={(open) => (open ? undefined : onClose())}>
      <AppModalContent size="md">
        <AppModalHeader>
          <AppModalTitle>{editing ? "Editar ocorrência" : "Nova ocorrência"}</AppModalTitle>
          <AppModalSubtitle>A assistência define automaticamente o posto.</AppModalSubtitle>
        </AppModalHeader>
        <AppModalBody className="pb-6">
          {loading ? <LoadingState message="Carregando formulário..." /> : null}
          {(formError ?? loadError) ? (
            <FeedbackState
              tone="error"
              title={editing ? "Não foi possível carregar ou salvar" : "Não foi possível salvar"}
              description={(formError ?? loadError)?.message}
              actions={
                !catalogs ? (
                  <Button onClick={() => void catalogsQuery.refetch()}>Tentar novamente</Button>
                ) : undefined
              }
            />
          ) : null}
          {!loading && catalogs ? (
            <OccurrenceForm
              catalogs={catalogs}
              initial={initial}
              editing={editing}
              saving={saveMutation.isPending}
              onSubmit={submit}
              onCancel={onClose}
            />
          ) : null}
        </AppModalBody>
      </AppModalContent>
    </AppModal>
  );
}
