import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/modules/auth/AuthProvider";
import { ProtectedRoute } from "../../src/modules/auth/ProtectedRoute";
import { AppShell } from "../../src/components/layout/AppShell";
import type { AccessService } from "../../src/modules/access/access-service";
import { direcaoAdminResult, operadorResult } from "../helpers/access-fixtures";
import { buildMockAuthUser, buildMockSession, createMockSupabaseClient } from "../helpers/supabase-mocks";

function asClient(mock: ReturnType<typeof createMockSupabaseClient>): SupabaseClient {
  return mock as unknown as SupabaseClient;
}

function Dashboard() {
  const navigate = useNavigate();
  return (
    <>
      <h1>Dashboard protegido</h1>
      <button onClick={() => navigate("/app/cadastros")}>Abrir cadastros</button>
    </>
  );
}

describe("ProtectedRoute revalidation", () => {
  it("reloads profile/posto context before rendering each protected location", async () => {
    const user = buildMockAuthUser();
    const mock = createMockSupabaseClient({ initialUser: user, initialSession: buildMockSession({ user }) });
    const resolveInitialContext = vi
      .fn<AccessService["resolveInitialContext"]>()
      .mockResolvedValueOnce(operadorResult)
      .mockResolvedValueOnce(direcaoAdminResult);

    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <AuthProvider
          supabase={asClient(mock)}
          accessService={{ resolveInitialContext }}
        >
          <Routes>
            <Route path="/app" element={<AppShell />}>
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute routeId="dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="cadastros"
                element={
                  <ProtectedRoute routeId="cadastros">
                    <div>Conteúdo final não deveria existir</div>
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="/acesso-negado" element={<div>Acesso negado</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "Dashboard protegido" })).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Abrir cadastros" }));

    await waitFor(() => expect(resolveInitialContext).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText("Conteúdo final não deveria existir")).toBeVisible());
    expect(screen.queryByText("Acesso negado")).not.toBeInTheDocument();
  });
});
