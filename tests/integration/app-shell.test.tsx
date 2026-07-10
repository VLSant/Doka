/**
 * Component tests for the authenticated App Shell (T057).
 *
 * Verifies logo, current user name, profile display label, postos/global
 * scope, active menu item, disabled semantics for unavailable routes,
 * keyboard access, and logout, per `route-navigation-contract.md` "App
 * Shell" and "Menu Contract".
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMockAuthUser,
  buildMockSession,
  createMockSupabaseClient,
} from "../helpers/supabase-mocks";
import { operadorResult, supervisaoResult, direcaoAdminContext } from "../helpers/access-fixtures";
import { AuthProvider } from "../../src/modules/auth/AuthProvider";
import type { AccessService } from "../../src/modules/access/access-service";
import { AppShell } from "../../src/components/layout/AppShell";

vi.mock("../../src/modules/ocorrencias/occurrence-service", () => ({
  createOccurrenceService: () => ({
    list: vi.fn().mockResolvedValue([]),
    catalogs: vi.fn(),
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    addComment: vi.fn(),
    transition: vi.fn(),
    remove: vi.fn(),
  }),
}));
vi.mock("../../src/modules/tarefas-rotinas/task-service", () => ({
  createTaskService: () => ({
    listTasks: vi.fn().mockResolvedValue([]),
    listRoutines: vi.fn().mockResolvedValue([]),
    getTask: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    transitionTask: vi.fn(),
    removeTask: vi.fn(),
    getRoutine: vi.fn(),
    createRoutine: vi.fn(),
    updateRoutine: vi.fn(),
    removeRoutine: vi.fn(),
    generateRoutineTasks: vi.fn(),
  }),
}));
vi.mock("../../src/modules/lancamentos-operacionais/lancamento-service", () => ({
  createLancamentoService: () => ({
    list: vi.fn().mockResolvedValue([]),
    detail: vi.fn(),
    formOptions: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    validate: vi.fn(),
    remove: vi.fn(),
  }),
}));
vi.mock("../../src/modules/assistencias-mms/assistance-service", () => ({
  createAssistanceService: () => ({
    list: vi.fn().mockResolvedValue({ itens: [], proximo_cursor: null }),
    detail: vi.fn(),
    correctField: vi.fn(),
    history: vi.fn(),
  }),
}));

function asClient(mock: ReturnType<typeof createMockSupabaseClient>): SupabaseClient {
  return mock as unknown as SupabaseClient;
}

function buildAccessService(
  result: Awaited<ReturnType<AccessService["resolveInitialContext"]>>,
): AccessService {
  return { resolveInitialContext: vi.fn().mockResolvedValue(result) };
}

function renderShellAt(
  path: string,
  accessResult: Awaited<ReturnType<AccessService["resolveInitialContext"]>>,
) {
  const user = buildMockAuthUser();
  const session = buildMockSession({ user });
  const mock = createMockSupabaseClient({ initialUser: user, initialSession: session });
  const access = buildAccessService(accessResult);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider supabase={asClient(mock)} accessService={access}>
        <Routes>
          <Route path="/app/*" element={<AppShell />}>
            <Route path="dashboard" element={<div data-testid="dashboard-outlet">Dashboard</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("shows the Doka logo", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByRole("img", { name: /doka/i })).toBeInTheDocument());
  });

  it("shows the authenticated user's name and profile display label", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByText("Operador Teste")).toBeInTheDocument());
    expect(screen.getByText("Operador")).toBeInTheDocument();
  });

  it("shows accessible postos for a scoped profile", async () => {
    renderShellAt("/app/dashboard", supervisaoResult);
    await waitFor(() => expect(screen.getByText(/posto a/i)).toBeInTheDocument());
  });

  it('shows "Escopo global" for Direcao/Administracao instead of a postos list', async () => {
    renderShellAt("/app/dashboard", { status: "autorizado", context: direcaoAdminContext });
    await waitFor(() => expect(screen.getByText(/escopo global/i)).toBeInTheDocument());
  });

  it("marks the current route's menu item as active", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => {
      const link = screen.getByRole("link", { name: /dashboard/i });
      expect(link).toHaveAttribute("aria-current", "page");
    });
  });

  it("renders the route outlet content", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());
  });

  it("renders available operational routes as links", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());

    const occurrenceLink = screen.getByRole("link", { name: /ocorrências/i });
    expect(occurrenceLink).toHaveAttribute("href", "/app/ocorrencias");
    expect(occurrenceLink.closest("[aria-disabled]")).toBeNull();
  });

  it("hides administrative-only entries from an Operador menu", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());
    expect(screen.queryByText("Cadastros")).not.toBeInTheDocument();
    expect(screen.queryByText(/hist[oó]rico\s*\/\s*auditoria/i)).not.toBeInTheDocument();
  });

  it("supports keyboard navigation through the available menu link", async () => {
    const userEventSession = userEvent.setup();
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());

    const link = screen.getByRole("link", { name: /dashboard/i });
    link.focus();
    expect(link).toHaveFocus();
    await userEventSession.tab();
  });

  it("provides an accessible logout action", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("persists the collapsed navigation preference", async () => {
    const user = userEvent.setup();
    localStorage.clear();
    renderShellAt("/app/dashboard", operadorResult);
    const toggle = await screen.findByRole("button", { name: "Recolher menu" });
    await user.click(toggle);
    expect(localStorage.getItem("doka.sidebar.collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: "Expandir menu" })).toBeVisible();
  });

  it("clears protected content after logout", async () => {
    const userEventSession = userEvent.setup();
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());

    await userEventSession.click(screen.getByRole("button", { name: /sair/i }));

    await waitFor(() => expect(screen.queryByTestId("dashboard-outlet")).not.toBeInTheDocument());
  });

  it("opens the global search dialog from the topbar search trigger", async () => {
    const user = userEvent.setup();
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());

    expect(screen.queryByPlaceholderText(/buscar ocorrências/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /busca global/i }));
    expect(await screen.findByPlaceholderText(/buscar ocorrências/i)).toBeInTheDocument();
  });

  it("opens the global search dialog with Ctrl+K", async () => {
    const user = userEvent.setup();
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());

    await user.keyboard("{Control>}k{/Control}");
    expect(await screen.findByPlaceholderText(/buscar ocorrências/i)).toBeInTheDocument();
  });

  it("shows a static posto pill for a single-posto profile (Operador)", async () => {
    renderShellAt("/app/dashboard", operadorResult);
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());
    const pill = screen.getByTitle("Seu acesso está limitado a este posto.");
    expect(pill).toHaveTextContent("Posto A");
    expect(pill).toHaveAttribute("aria-disabled", "true");
  });

  it("shows a real posto selector defaulting to 'Todos os postos' for Direcao/Administracao", async () => {
    renderShellAt("/app/dashboard", { status: "autorizado", context: direcaoAdminContext });
    await waitFor(() => expect(screen.getByTestId("dashboard-outlet")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /todos os postos/i })).toBeInTheDocument();
  });
});
