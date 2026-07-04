import type { AuditEvent } from "./types";
import { StatusBadge } from "../../components/ui/StatusBadge";

function jsonSummary(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "—";
  return JSON.stringify(value, null, 2);
}

export function AuditEventList({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) return <p>Nenhum evento de auditoria encontrado.</p>;
  const groups = events.reduce<Map<string, AuditEvent[]>>((result, event) => {
    const day = new Date(event.created_at).toLocaleDateString("pt-BR", { dateStyle: "long" });
    result.set(day, [...(result.get(day) ?? []), event]);
    return result;
  }, new Map());
  return (
    <div className="audit-timeline">
      {Array.from(groups, ([day, dayEvents]) => (
        <section key={day}>
          <h2>{day}</h2>
          <ol className="audit-events">
            {dayEvents.map((event) => (
              <li key={event.id}>
                <div className="audit-events__heading">
                  <strong>{event.acao.replaceAll("_", " ")}</strong>
                  <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleTimeString("pt-BR")}</time>
                </div>
                <p><StatusBadge tone="brand">{event.entidade_tipo}</StatusBadge> {event.usuario?.nome ?? "Sistema"}</p>
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
        </section>
      ))}
    </div>
  );
}
