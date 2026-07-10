import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { CorrectionEditor } from "../components/CorrectionEditor";
import { ReprocessDialog } from "../components/ReprocessDialog";
import { createLotService, type LotService } from "../lot-service";
import { createTreatmentService, type TreatmentService } from "../treatment-service";
import type { JsonSafeValue } from "../types";
import { canonicalCorrectionField } from "../correction-fields";
import "./ImportListPage.css";

export function ImportTreatmentPage({ lotService: injectedLot, treatmentService: injectedTreatment }: {
  lotService?: LotService; treatmentService?: TreatmentService;
}) {
  const { loteId = "" } = useParams();
  const lotService = useMemo(() => injectedLot ?? createLotService(), [injectedLot]);
  const treatment = useMemo(() => injectedTreatment ?? createTreatmentService(), [injectedTreatment]);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const lotQuery = useQuery({
    queryKey: queryKeys.importacoes.lot(loteId),
    queryFn: () => lotService.detail(loteId),
    enabled: Boolean(loteId),
  });
  const errorsQuery = useQuery({
    queryKey: queryKeys.importacoes.lotItems(loteId, "erros"),
    queryFn: () => lotService.items(loteId, "erros"),
    enabled: Boolean(loteId),
  });
  const lot = lotQuery.data ?? null;
  const errors = errorsQuery.data?.itens ?? [];
  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.importacoes.all });
  };
  const concludeMutation = useMutation({
    mutationFn: () => treatment.conclude(lot!.lote_id, lot!.versao_tratamento),
    onSuccess: reload,
    onError: (e) => setMessage(e instanceof Error ? e.message : "Não foi possível concluir."),
  });
  function conclude() {
    if (!lot) return;
    setMessage("");
    concludeMutation.mutate();
  }
  if (message && !lot) return <FeedbackState tone="error" title="Tratamento indisponível" description={message} />;
  if (!lot) return <p role="status">Carregando tratamento...</p>;
  return <main className="mms-management">
    <header><Link to={`/app/importacoes-mms/${lot.lote_id}`}>Voltar ao lote</Link><h1>Tratamento da importação</h1>
      <p>{lot.total_erros_pendentes} erro(s) pendente(s), versão {lot.versao_tratamento}.</p></header>
    {message ? <p role="alert">{message}</p> : null}
    <Card padding="lg"><h2>Erros e correções</h2>
      {errors.length === 0 ? <p>Nenhum erro pendente.</p> : <div className="mms-treatment-errors">
        {errors.map((error) => {
          const correctionField = String(error.campo_correcao ?? "")
            || canonicalCorrectionField(error.campo, error.codigo);
          return <section key={error.id} aria-labelledby={`error-${error.id}`}>
            <h3 id={`error-${error.id}`}>{String(error.campo ?? "Linha")} — {String(error.codigo ?? "erro_validacao")}</h3>
            <p>{String(error.mensagem ?? "Erro de validação")}</p>
            {lot.capacidades.corrigir && error.linha_importacao_id && correctionField ? <CorrectionEditor
              lotId={lot.lote_id}
              lineId={String(error.linha_importacao_id)}
              field={correctionField}
              original={(error.valor_original ?? null) as JsonSafeValue}
              normalized={(error.valor_normalizado ?? null) as JsonSafeValue}
              current={(error.valor_efetivo ?? "") as JsonSafeValue}
              version={Number(error.versao_correcao ?? 0)}
              service={treatment}
              onSaved={reload}
            /> : null}
          </section>;
        })}
      </div>}
    </Card>
    <div>{lot.capacidades.concluir_tratamento ? <Button onClick={conclude}>Concluir tratamento</Button> : null}
      {lot.capacidades.reprocessar ? <ReprocessDialog lotId={lot.lote_id} version={lot.versao_tratamento} service={treatment} onComplete={reload} /> : null}</div>
  </main>;
}
export default ImportTreatmentPage;
