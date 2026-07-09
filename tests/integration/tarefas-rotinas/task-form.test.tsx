import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskForm } from "../../../src/modules/tarefas-rotinas/components/TaskForm";
import { pickCalendarDate, selectRadixOption } from "../../helpers/radix-select";

describe("TaskForm", () => {
  it("fixa o operador como único responsável", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TaskForm
        viewer={{ usuarioId: "operator-1", perfil: "operador", postoIds: ["posto-1"] }}
        postos={[{ id: "posto-1", nome: "Posto 1" }]}
        prioridades={[{ id: "priority-1", nome: "Alta", nivel: 1, cor: "#f00" }]}
        cargos={[]}
        usuarios={[
          { id: "operator-1", nome: "Operador Um", perfil: "operador" },
          { id: "operator-2", nome: "Operador Dois", perfil: "operador" },
        ]}
        onSubmit={onSubmit}
        onCancel={() => undefined}
      />,
    );

    expect(screen.queryByRole("listbox", { name: /responsáveis/i })).not.toBeInTheDocument();
    expect(screen.getByText("Operador Um")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Título *"), "Minha tarefa");
    await user.type(screen.getByLabelText("Descrição *"), "Executar conferência");
    await selectRadixOption(user, "Posto", "Posto 1");
    await selectRadixOption(user, "Prioridade *", "Alta");
    await pickCalendarDate(user, "Prazo *", "2026-07-04");
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      titulo: "Minha tarefa",
      responsaveis: ["operator-1"],
    }));
  });

  it("exige título antes de enviar", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TaskForm
        viewer={{ usuarioId: "admin-1", perfil: "direcao_admin", postoIds: [] }}
        postos={[]}
        prioridades={[]}
        cargos={[]}
        usuarios={[{ id: "admin-1", nome: "Direção", perfil: "direcao_admin" }]}
        onSubmit={onSubmit}
        onCancel={() => undefined}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));
    expect(screen.getByText("Informe o título.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
