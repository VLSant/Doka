import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OccurrenceForm } from "../../src/modules/ocorrencias/components/OccurrenceForm";
import type { OccurrenceCatalogs } from "../../src/modules/ocorrencias/types";
import { pickCalendarDate, selectRadixOption } from "../helpers/radix-select";

const catalogs: OccurrenceCatalogs = {
  assistencias: [
    {
      id: "assist-1",
      numero_assistencia: "A-001",
      data_atividade: "2026-07-06",
      posto_id: "posto-1",
    },
  ],
  postos: [{ id: "posto-1", nome: "Posto 1" }],
  tipos: [{ id: "tipo-1", nome: "Reclamacao" }],
  prioridades: [{ id: "prioridade-1", nome: "Alta" }],
  usuarios: [{ id: "usuario-1", nome: "Responsavel" }],
};

describe("OccurrenceForm", () => {
  it("valida campos obrigatorios com primitives compartilhados", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<OccurrenceForm catalogs={catalogs} onSubmit={onSubmit} onCancel={() => undefined} />);

    await user.click(screen.getByRole("button", { name: "Salvar ocorrência" }));

    expect(screen.getByText("Selecione uma assistência válida.")).toBeInTheDocument();
    expect(screen.getByText("Selecione o tipo.")).toBeInTheDocument();
    expect(screen.getByText("Informe o título.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preenche e envia a ocorrencia preservando o posto da assistencia", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<OccurrenceForm catalogs={catalogs} onSubmit={onSubmit} onCancel={() => undefined} />);

    await selectRadixOption(user, "Assistência *", "A-001 · 2026-07-06");
    expect(screen.getByLabelText("Posto")).toHaveValue("Posto 1");
    await selectRadixOption(user, "Tipo *", "Reclamacao");
    await selectRadixOption(user, "Prioridade *", "Alta");
    await selectRadixOption(user, "Responsável *", "Responsavel");
    await pickCalendarDate(user, "Data de retorno *", "2026-07-10");
    await user.type(screen.getByLabelText("Título *"), "Ocorrência em aberto");
    await user.type(screen.getByLabelText("Descrição *"), "Cliente pediu acompanhamento.");
    await user.click(screen.getByRole("button", { name: "Salvar ocorrência" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        assistencia_id: "assist-1",
        posto_id: "posto-1",
        tipo_ocorrencia_id: "tipo-1",
        prioridade_id: "prioridade-1",
        responsavel_id: "usuario-1",
        titulo: "Ocorrência em aberto",
        descricao: "Cliente pediu acompanhamento.",
        data_retorno: "2026-07-10",
      }),
    );
  });
});
