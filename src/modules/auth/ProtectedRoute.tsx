import { type ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { ROUTE_DEFINITIONS, type RouteId } from "../../app/routes";
import { LoadingState } from "../../components/feedback/LoadingState";
import { ModuleUnavailablePage } from "../navigation/pages/ModuleUnavailablePage";
import { NotFoundPage } from "../navigation/pages/NotFoundPage";
import { useAuth } from "./AuthProvider";
import { decideProtectedRoute } from "./protected-loader";

/**
 * Shared gate for every internal route.
 *
 * Once AuthProvider has resolved a valid operational context, route checks are
 * synchronous and in-memory for the current session/posto scope. This keeps
 * AppShell mounted during navigation instead of blanking the screen for a
 * repeated route-level revalidation.
 */
export function ProtectedRoute({ routeId, children }: { routeId: RouteId; children: ReactNode }) {
  const { state } = useAuth();
  const [searchParams] = useSearchParams();
  const route = ROUTE_DEFINITIONS.find((definition) => definition.id === routeId) ?? null;
  const requestedPostoId = searchParams.get("posto_id");

  const decision = decideProtectedRoute({ authState: state, route, requestedPostoId });

  if (decision.kind === "loading") {
    return <LoadingState message="Verificando sessao..." />;
  }
  if (decision.kind === "redirect") {
    return <Navigate to={decision.to} replace />;
  }
  if (decision.kind === "modulo_indisponivel") {
    return <ModuleUnavailablePage moduleLabel={route?.label ?? "Modulo"} />;
  }
  if (decision.kind === "rota_nao_encontrada") {
    return <NotFoundPage />;
  }

  return <>{children}</>;
}
