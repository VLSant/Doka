import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../auth/AuthProvider";
import { AuditEventList } from "./AuditEventList";
import { createAuditHistoryService, type AuditService } from "./audit-service";
import type { AuditEvent } from "./types";
import "./auditoria.css";

export function EntityHistory({
  entityType,
  entityId,
  service: injected,
}: {
  entityType: string;
  entityId: string;
  service?: AuditService;
}) {
  const { state } = useAuth();
  const service = useMemo(() => injected ?? createAuditHistoryService(), [injected]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState("");
  const allowed = state.name === "autorizado" && state.context.perfil !== "operador";

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void service.entity(entityType, entityId)
      .then((data) => { if (active) setEvents(data); })
      .catch(() => { if (active) setError("Histórico indisponível."); });
    return () => { active = false; };
  }, [allowed, entityId, entityType, service]);

  if (!allowed) return null;
  return (
    <Card padding="lg">
      <h2>Histórico de alterações</h2>
      {error ? <p role="alert">{error}</p> : <AuditEventList events={events} />}
    </Card>
  );
}
