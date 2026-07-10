import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { useNavigate, useParams } from "react-router-dom";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Button } from "../../../components/ui/Button";
import { Drawer } from "../../../components/ui/Drawer";
import { OccurrenceForm } from "../components/OccurrenceForm";
import { createOccurrenceService, type OccurrenceService } from "../occurrence-service";
import type { OccurrenceInput } from "../types";
import "./Occurrences.css";

export function OccurrenceFormPage({ service: injected }: { service?: OccurrenceService }) {
  const service = useMemo(() => injected ?? createOccurrenceService(), [injected]);
  const navigate = useNavigate();
  const { ocorrenciaId } = useParams();
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
    enabled: Boolean(ocorrenciaId),
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
  const loading = catalogsQuery.isPending || (Boolean(ocorrenciaId) && detailQuery.isPending);
  const loadError = catalogsQuery.error ?? detailQuery.error;
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
      setFormError(cause instanceof Error ? cause : new Error("Falha ao salvar a ocorrencia."));
    },
  });

  function submit(input: OccurrenceInput) {
    setFormError(null);
    saveMutation.mutate(input);
  }

  const closeTarget = ocorrenciaId ? `/app/ocorrencias/${ocorrenciaId}` : "/app/ocorrencias";
  return (
    <Drawer
      open
      size="lg"
      title={editing ? "Editar ocorrência" : "Nova ocorrência"}
      description="A assistência define automaticamente o posto."
      onClose={() => navigate(closeTarget)}
    >
      {loading ? <LoadingState message="Carregando formulário..." /> : null}
      {(formError ?? loadError) ? (
        <FeedbackState
          tone="error"
          title={editing ? "Não foi possível carregar ou salvar" : "Não foi possível salvar"}
          description={(formError ?? loadError)?.message}
          actions={
            !catalogs ? <Button onClick={() => void catalogsQuery.refetch()}>Tentar novamente</Button> : undefined
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
          onCancel={() => navigate(closeTarget)}
        />
      ) : null}
    </Drawer>
  );
}

export default OccurrenceFormPage;
