import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LancamentoListPage } from "../../../src/modules/lancamentos-operacionais/pages/LancamentoListPage";
import type { Lancamento } from "../../../src/modules/lancamentos-operacionais/types";

const item: Lancamento = {
  id: "lancamento-1",
  tipo: "deslocamento",
  assistencia_id: null,
  posto_id: "posto-1",
  recurso: "João",
  data_lancamento: "2026-07-03",
  descricao: "Visita ao cliente",
  valor: 50,
  observacoes: null,
  status: "pendente",
  validado_em: null,
  created_at: "2026-07-03T10:00:00Z",
  updated_at: "2026-07-03T10:00:00Z",
  posto: { id: "posto-1", nome: "Salvador" },
  assistencia: null,
  lancador: { id: "usuario-1", nome: "João" },
  validador: null,
};

function renderPage(service: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={["/app/custos-extras"]}>
      <LancamentoListPage service={service as never} />
    </MemoryRouter>,
  );
}

describe("lancamento list", () => {
  it("renders the unified list and filtered totals", async () => {
    renderPage({
      list: vi
        .fn()
        .mockResolvedValue([item, { ...item, id: "lancamento-2", tipo: "custo_extra", valor: 30 }]),
      formOptions: vi.fn().mockResolvedValue({ postos: [], assistencias: [] }),
    });
    expect(screen.getByText("Carregando lançamentos...")).toBeVisible();
    expect(
      await screen.findByRole("table", { name: "Deslocamentos e custos extras" }),
    ).toBeVisible();
    expect(screen.getByText("R$ 80,00")).toBeVisible();
    expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);
  });

  it("keeps empty and failure states distinct", async () => {
    const emptyService = {
      list: vi.fn().mockResolvedValue([]),
      formOptions: vi.fn().mockResolvedValue({ postos: [], assistencias: [] }),
    };
    const { unmount } = renderPage(emptyService);
    expect(await screen.findByText("Nenhum lançamento encontrado")).toBeVisible();
    unmount();

    renderPage({
      list: vi.fn().mockRejectedValue(new Error("Serviço indisponível")),
      formOptions: vi.fn().mockResolvedValue({ postos: [], assistencias: [] }),
    });
    expect(await screen.findByText("Falha ao carregar lançamentos")).toBeVisible();
    expect(screen.queryByText("Nenhum lançamento encontrado")).not.toBeInTheDocument();
  });
});
