/**
 * Unit tests for the global posto filter context (plano de migracao Dracma,
 * secao 4.5/5: "Filtro global persistente na topbar").
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PostoFilterProvider, usePostoFilter } from "../../src/app/posto-filter";
import type { PostoAccess } from "../../src/modules/access/types";

function buildPosto(overrides: Partial<PostoAccess> = {}): PostoAccess {
  return {
    postoId: "posto-a",
    nome: "Posto A",
    codigo: "POSTO_A",
    nivelAcesso: "operacional",
    ...overrides,
  };
}

function Probe() {
  const { postoId, setPostoId, postos, selectable } = usePostoFilter();
  return (
    <div>
      <span data-testid="selectable">{String(selectable)}</span>
      <span data-testid="posto-count">{postos.length}</span>
      <span data-testid="posto-id">{postoId ?? "todos"}</span>
      {postos.map((posto) => (
        <button key={posto.postoId} onClick={() => setPostoId(posto.postoId)}>
          {posto.nome}
        </button>
      ))}
      <button onClick={() => setPostoId(null)}>Todos os postos</button>
    </div>
  );
}

describe("PostoFilterProvider", () => {
  it("returns 'sem filtro' (todos) as the default value outside a provider", () => {
    render(<Probe />);
    expect(screen.getByTestId("selectable")).toHaveTextContent("false");
    expect(screen.getByTestId("posto-id")).toHaveTextContent("todos");
  });

  it("is not selectable and locks to the single posto for a user with only one posto", () => {
    localStorage.clear();
    render(
      <PostoFilterProvider postos={[buildPosto()]} escopoGlobal={false}>
        <Probe />
      </PostoFilterProvider>,
    );
    expect(screen.getByTestId("selectable")).toHaveTextContent("false");
    expect(screen.getByTestId("posto-id")).toHaveTextContent("posto-a");
  });

  it("is selectable for a user with escopo global and defaults to 'todos os postos'", () => {
    localStorage.clear();
    render(
      <PostoFilterProvider postos={[buildPosto()]} escopoGlobal>
        <Probe />
      </PostoFilterProvider>,
    );
    expect(screen.getByTestId("selectable")).toHaveTextContent("true");
    expect(screen.getByTestId("posto-id")).toHaveTextContent("todos");
  });

  it("persists the selected posto across remounts (localStorage)", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const postos = [buildPosto(), buildPosto({ postoId: "posto-b", nome: "Posto B" })];

    const { unmount } = render(
      <PostoFilterProvider postos={postos} escopoGlobal={false}>
        <Probe />
      </PostoFilterProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Posto B" }));
    expect(screen.getByTestId("posto-id")).toHaveTextContent("posto-b");
    unmount();

    render(
      <PostoFilterProvider postos={postos} escopoGlobal={false}>
        <Probe />
      </PostoFilterProvider>,
    );
    expect(screen.getByTestId("posto-id")).toHaveTextContent("posto-b");
  });

  it("discards a persisted posto that is no longer accessible to the current user", () => {
    localStorage.setItem("doka.posto-filter.selected", "posto-obsoleto");
    render(
      <PostoFilterProvider
        postos={[buildPosto(), buildPosto({ postoId: "posto-b", nome: "Posto B" })]}
        escopoGlobal
      >
        <Probe />
      </PostoFilterProvider>,
    );
    expect(screen.getByTestId("posto-id")).toHaveTextContent("todos");
  });
});
