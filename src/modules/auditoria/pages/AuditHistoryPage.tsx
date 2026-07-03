import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { AuditEventList } from "../AuditEventList";
import { createAuditHistoryService, type AuditService } from "../audit-service";
import type { AuditCatalogs, AuditEvent, AuditFilters } from "../types";
import "../auditoria.css";

const EMPTY_CATALOGS: AuditCatalogs = { usuarios: [], postos: [] };

export function AuditHistoryPage({ service: injected }: { service?: AuditService }) {
  const service = useMemo(() => injected ?? createAuditHistoryService(), [injected]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [catalogs, setCatalogs] = useState(EMPTY_CATALOGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (next: AuditFilters) => {
    setLoading(true);
    setError("");
    try {
      const [rows, options] = await Promise.all([service.list(next), service.catalogs()]);
      setEvents(rows);
      setCatalogs(options);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Histórico indisponível.");
    } finally {
      setLoading(false);
    }
  }, [service]);

  // Initial Data API synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load({}); }, [load]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim() || undefined;
    const next: AuditFilters = {
      usuarioId: value("usuarioId"), entidadeTipo: value("entidadeTipo"),
      acao: value("acao"), postoId: value("postoId"),
      dataDe: value("dataDe"), dataAte: value("dataAte"),
    };
    void load(next);
  }

  return (
    <main className="audit-page">
      <header><span>Governança</span><h1>Histórico e auditoria</h1>
        <p>Consulte alterações e operações críticas dentro do seu escopo.</p></header>
      <Card padding="lg">
        <form className="audit-filters" onSubmit={submit}>
          <label>Usuário<select name="usuarioId"><option value="">Todos</option>
            {catalogs.usuarios.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select></label>
          <label>Módulo<select name="entidadeTipo"><option value="">Todos</option>
            {["tarefas","rotinas","ocorrencias","lancamentos_operacionais","mms_assistencias","mms_lotes_importacao","usuarios","postos","metas_eficiencia"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
          </select></label>
          <label>Evento<input name="acao" placeholder="Ex.: status alterado" /></label>
          <label>Posto<select name="postoId"><option value="">Todos</option>
            {catalogs.postos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select></label>
          <label>De<input name="dataDe" type="date" /></label>
          <label>Até<input name="dataAte" type="date" /></label>
          <Button type="submit" disabled={loading}>Aplicar filtros</Button>
        </form>
      </Card>
      {loading ? <LoadingState message="Carregando histórico..." /> : null}
      {error ? <FeedbackState tone="error" title="Histórico indisponível" description={error} /> : null}
      {!loading && !error ? <AuditEventList events={events} /> : null}
    </main>
  );
}

export default AuditHistoryPage;
