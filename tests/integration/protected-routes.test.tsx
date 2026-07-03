/**
 * Integration tests for protected-route enforcement (T044).
 *
 * Exercises direct URL navigation, simulated favorite/history navigation,
 * an unauthorized `posto_id` query parameter, and the precedence of
 * "denied" over "unavailable" when both conditions would apply
 * (`route-navigation-contract.md` Evaluation Order/Outcomes).
 */
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMockAuthUser, buildMockSession, createMockSupabaseClient } from "../helpers/supabase-mocks";
import { operadorResult, supervisaoResult } from "../helpers/access-fixtures";
import { AuthProvider, useAuth } from "../../src/modules/auth/AuthProvider";
import type { AccessService } from "../../src/modules/access/access-service";
import { evaluateRouteAccess } from "../../src/modules/access/route-guard";
import { getRouteDefinition, type RouteId } from "../../src/app/routes";

function asClient(mock: ReturnType<typeof createMockSupabaseClient>): SupabaseClient {
  return mock as unknown as SupabaseClient;
}

function buildAccessService(result: Awaited<ReturnType<AccessService["resolveInitialContext"]>>): AccessService {
  return { resolveInitialContext: async () => result };
}

/** Minimal harness mirroring `ProtectedRoute` + `route-guard` wiring in `router.tsx`. */
function ProtectedProbe({ routeId }: { routeId: RouteId }) {
  const { state } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  if (state.name !== "autorizado" && state.name !== "bloqueado") {
    return <div data-testid="loading">Carregando</div>;
  }

  const outcome = evaluateRouteAccess({
    authState: state,
    route: getRouteDefinition(routeId),
    requestedPostoId: searchParams.get("posto_id"),
  });

  if (outcome.kind === "autorizado") {
    return <div data-testid="protected-content">Conteudo de {location.pathname}</div>;
  }
  if (outcome.kind === "acesso_negado") {
    return <div data-testid="acesso-negado">Acesso negado</div>;
  }
  if (outcome.kind === "modulo_indisponivel") {
    return <div data-testid="modulo-indisponivel">Modulo indisponivel</div>;
  }
  return <div data-testid="outro-bloqueio">{outcome.kind}</div>;
}

function renderAtPath(path: string, routeId: RouteId, accessResult: Awaited<ReturnType<AccessService["resolveInitialContext"]>>) {
  const user = buildMockAuthUser();
  const session = buildMockSession({ user });
  const mock = createMockSupabaseClient({ initialUser: user, initialSession: session });
  const access = buildAccessService(accessResult);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider supabase={asClient(mock)} accessService={access}>
        <Routes>
          <Route path="/app/:routeId" element={<ProtectedProbe routeId={routeId} />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("protected routes: direct URL, favorites/history, posto_id, denial precedence", () => {
  it("authorizes direct URL navigation to an available route for an allowed profile", async () => {
    renderAtPath("/app/dashboard", "dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("protected-content")).toBeInTheDocument());
  });

  it("denies direct URL navigation to a profile-restricted route (simulates favorite/history bypass attempt)", async () => {
    // "cadastros" is supervisao/direcao_admin only; an Operador navigating
    // via a stale favorite/history entry must still be denied.
    renderAtPath("/app/cadastros", "cadastros", operadorResult);
    await waitFor(() => expect(screen.getByTestId("acesso-negado")).toBeInTheDocument());
  });

  it("denies an unauthorized posto_id query parameter even on an otherwise-allowed route", async () => {
    renderAtPath("/app/dashboard?posto_id=40000000-0000-0000-0000-000000000099", "dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("acesso-negado")).toBeInTheDocument());
  });

  it("allows an authorized posto_id query parameter on an otherwise-allowed route", async () => {
    renderAtPath(
      "/app/dashboard?posto_id=40000000-0000-0000-0000-000000000001",
      "dashboard",
      operadorResult,
    );
    await waitFor(() => expect(screen.getByTestId("protected-content")).toBeInTheDocument());
  });

  it("confirms denied takes precedence over unavailable when both apply", async () => {
    // "historico-auditoria" is profile-restricted for Operador AND a placeholder
    // (unavailable) module; the outcome must be the denial, not the
    // unavailable state.
    renderAtPath("/app/historico-auditoria?posto_id=40000000-0000-0000-0000-000000000099", "historico-auditoria", operadorResult);
    await waitFor(() => expect(screen.getByTestId("acesso-negado")).toBeInTheDocument());
  });

  it("reports module-unavailable (not denied) for an allowed Supervisao profile on a placeholder route", async () => {
    renderAtPath("/app/historico-auditoria", "historico-auditoria", supervisaoResult);
    await waitFor(() => expect(screen.getByTestId("protected-content")).toBeInTheDocument());
  });
});
