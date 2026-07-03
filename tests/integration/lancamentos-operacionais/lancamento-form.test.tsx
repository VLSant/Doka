import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LancamentoForm } from "../../../src/modules/lancamentos-operacionais/components/LancamentoForm";

const options = {
  postos: [{ id: "posto-1", nome: "Salvador" }],
  assistencias: [
    { id: "assistencia-1", numero: "ASS-001", cliente: "Cliente", posto_id: "posto-1" },
  ],
};

describe("lancamento form", () => {
  it("requires an assistance for extra costs before submitting", async () => {
    const submit = vi.fn();
    render(<LancamentoForm options={options} onSubmit={submit} onCancel={() => undefined} />);
    await userEvent.click(screen.getByLabelText("Custo extra"));
    await userEvent.selectOptions(screen.getByLabelText("Posto"), "posto-1");
    await userEvent.type(screen.getByLabelText("Descrição / motivo"), "Peça adicional");
    await userEvent.type(screen.getByLabelText("Valor (R$)"), "25");
    await userEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    expect(await screen.findByText(/devem estar vinculados a uma assistência/i)).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits a valid manual displacement", async () => {
    const submit = vi.fn();
    render(<LancamentoForm options={options} onSubmit={submit} onCancel={() => undefined} />);
    await userEvent.selectOptions(screen.getByLabelText("Posto"), "posto-1");
    await userEvent.type(screen.getByLabelText("Descrição / motivo"), "Visita técnica");
    await userEvent.type(screen.getByLabelText("Valor (R$)"), "45.5");
    await userEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "deslocamento",
        posto_id: "posto-1",
        assistencia_id: null,
        descricao: "Visita técnica",
        valor: 45.5,
      }),
    );
  });
});
