import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { OccurrenceService } from "../../src/modules/ocorrencias/occurrence-service";
import { OccurrenceListPage } from "../../src/modules/ocorrencias/pages/OccurrenceListPage";
import type { OccurrenceListItem } from "../../src/modules/ocorrencias/types";

const item: OccurrenceListItem = {
  id: "o1",
  assistencia_id: "a1",
  posto_id: "p1",
  tipo_ocorrencia_id: "t1",
  prioridade_id: null,
  responsavel_id: null,
  criada_por: "u1",
  titulo: "Retorno hoje",
  descricao: null,
  observacoes: null,
  status: "aberta",
  data_retorno: new Date().toISOString().slice(0, 10),
  resolvida_em: null,
  encerrada_em: null,
  reaberta_em: null,
  justificativa_reabertura: null,
  created_at: "2026-07-01T10:00:00Z",
  updated_at: "2026-07-01T10:00:00Z",
  assistencia: { id: "a1", numero_assistencia: "A-123", data_atividade: "2026-07-01" },
  posto: { id: "p1", nome: "Posto 1" },
  tipo: { id: "t1", nome: "Retorno futuro" },
  prioridade: null,
  responsavel: null,
};

function service(list: OccurrenceService["list"]): OccurrenceService {
  return {
    list,
    catalogs: vi.fn().mockResolvedValue({
      assistencias: [],
      tipos: [],
      prioridades: [],
      usuarios: [],
      postos: [],
    }),
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    addComment: vi.fn(),
    transition: vi.fn(),
    remove: vi.fn(),
  };
}

describe("lista de ocorrências", () => {
  it("renderiza dados reais e filtra por texto", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OccurrenceListPage service={service(vi.fn().mockResolvedValue([item]))} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Carregando ocorrências...")).toBeInTheDocument();
    expect(await screen.findByText("Retorno hoje")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Buscar"), "inexistente");
    expect(screen.getByText("Nenhuma ocorrência neste recorte")).toBeInTheDocument();
  });

  it("oferece nova tentativa depois de erro", async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error("Sem conexão"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OccurrenceListPage service={service(list)} />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Sem conexão")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Nenhuma ocorrência neste recorte")).toBeInTheDocument();
  });
});

