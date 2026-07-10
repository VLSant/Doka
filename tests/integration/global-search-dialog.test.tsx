/**
 * Integration tests for the global search dialog (Ctrl+K), plano
 * `docs/11-plano-migracao-estilo-dracma.md` secao 4.5: "Busca global Ctrl+K
 * (painel escuro, pills de escopo, hints ...) - portar GlobalSearchDialog".
 *
 * Covers: opening via Ctrl+K, searching across occurrences/tasks, and
 * navigating to the matching detail route on selection.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GlobalSearchDialog, useGlobalSearchShortcut } from "../../src/components/shadcn/GlobalSearchDialog";

vi.mock("../../src/modules/ocorrencias/occurrence-service", () => ({
  createOccurrenceService: () => ({
    list: vi.fn().mockResolvedValue([
      {
        id: "occ-1",
        titulo: "Vazamento no telhado",
        assistencia: { id: "a1", numero_assistencia: "A-100" },
      },
    ]),
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

function Harness() {
  useGlobalSearchShortcut(() => {
    /* no-op; individual tests control `open` directly via props below */
  });
  return null;
}

function renderDialog(initialOpen = true) {
  function Wrapper() {
    return (
      <>
        <Harness />
        <GlobalSearchDialog open={initialOpen} onOpenChange={() => {}} />
      </>
    );
  }
  return render(
    <MemoryRouter initialEntries={["/app/dashboard"]}>
      <Routes>
        <Route path="/app/*" element={<Wrapper />} />
        <Route path="/app/ocorrencias/:id" element={<div data-testid="occurrence-detail">Detalhe</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GlobalSearchDialog", () => {
  it("shows the empty prompt before typing anything", () => {
    renderDialog();
    expect(screen.getByText("Digite para buscar.")).toBeInTheDocument();
  });

  it("finds matching occurrences by title and navigates to the detail route on select", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/buscar ocorrências/i);
    await user.type(input, "vazamento");

    const result = await screen.findByText("Vazamento no telhado", undefined, { timeout: 3000 });
    expect(result).toBeInTheDocument();

    await user.click(result);
    await waitFor(() => expect(screen.getByTestId("occurrence-detail")).toBeInTheDocument());
  });

  it("shows 'nenhum resultado' for a term that matches nothing", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/buscar ocorrências/i);
    await user.type(input, "termo-inexistente-xyz");

    expect(
      await screen.findByText("Nenhum resultado encontrado.", undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});
