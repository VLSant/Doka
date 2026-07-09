import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LancamentoForm } from "../../../src/modules/lancamentos-operacionais/components/LancamentoForm";
import { selectRadixOption } from "../../helpers/radix-select";

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
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Custo extra"));
    await selectRadixOption(user, "Posto", "Salvador");
    await user.type(screen.getByLabelText("Descrição / motivo"), "Peça adicional");
    await user.type(screen.getByLabelText("Valor (R$)"), "25");
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    expect(await screen.findByText(/devem estar vinculados a uma assistência/i)).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits a valid manual displacement", async () => {
    const submit = vi.fn();
    render(<LancamentoForm options={options} onSubmit={submit} onCancel={() => undefined} />);
    const user = userEvent.setup();
    await selectRadixOption(user, "Posto", "Salvador");
    await user.type(screen.getByLabelText("Descrição / motivo"), "Visita técnica");
    await user.type(screen.getByLabelText("Valor (R$)"), "45.5");
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" }));
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
