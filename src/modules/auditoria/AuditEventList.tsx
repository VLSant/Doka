import type { AuditEvent } from "./types";

function jsonSummary(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "—";
  return JSON.stringify(value, null, 2);
}

export function AuditEventList({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) return <p>Nenhum evento de auditoria encontrado.</p>;
  return (
    <ol className="audit-events">
      {events.map((event) => (
        <li key={event.id}>
          <div className="audit-events__heading">
            <strong>{event.acao.replaceAll("_", " ")}</strong>
            <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString("pt-BR")}</time>
          </div>
          <p>
            {event.entidade_tipo} · {event.usuario?.nome ?? "Sistema"}
          </p>
          {(event.valor_anterior || event.valor_novo) && (
            <details>
              <summary>Ver valores alterados</summary>
              <div className="audit-events__values">
                <div><h4>Anterior</h4><pre>{jsonSummary(event.valor_anterior)}</pre></div>
                <div><h4>Novo</h4><pre>{jsonSummary(event.valor_novo)}</pre></div>
              </div>
            </details>
          )}
        </li>
      ))}
    </ol>
  );
}
