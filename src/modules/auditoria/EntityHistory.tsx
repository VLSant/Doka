import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../app/query-keys";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../auth/AuthProvider";
import { AuditEventList } from "./AuditEventList";
import { createAuditHistoryService, type AuditService } from "./audit-service";
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
  const allowed = state.name === "autorizado" && state.context.perfil !== "operador";
  const historyQuery = useQuery({
    queryKey: queryKeys.audit.entity(entityType, entityId),
    queryFn: () => service.entity(entityType, entityId),
    enabled: allowed,
  });
  const events = historyQuery.data ?? [];

  if (!allowed) return null;
  return (
    <Card padding="lg">
      <h2>Historico de alteracoes</h2>
      {historyQuery.error ? (
        <p role="alert">Historico indisponivel.</p>
      ) : (
        <AuditEventList events={events} />
      )}
    </Card>
  );
}
