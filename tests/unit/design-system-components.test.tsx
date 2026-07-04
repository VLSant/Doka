import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "../../src/components/layout/Page";
import { ButtonLink } from "../../src/components/ui/ButtonLink";
import { Dialog } from "../../src/components/ui/Dialog";
import { Select, Textarea } from "../../src/components/ui/FormControls";
import { StatusBadge } from "../../src/components/ui/StatusBadge";
import { Tabs } from "../../src/components/ui/Tabs";

describe("componentes compartilhados do design system", () => {
  it("mantém navegação, campos e status semanticamente acessíveis", () => {
    render(
      <MemoryRouter>
        <PageHeader
          eyebrow="Operação"
          title="Ocorrências"
          description="Acompanhe o trabalho."
          actions={<ButtonLink to="/nova">Nova ocorrência</ButtonLink>}
        />
        <Select label="Status" defaultValue="">
          <option value="">Todos</option>
        </Select>
        <Textarea label="Justificativa" required />
        <StatusBadge tone="warning">Pendente</StatusBadge>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Ocorrências" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nova ocorrência" })).toHaveAttribute("href", "/nova");
    expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Justificativa" })).toBeRequired();
    expect(screen.getByText("Pendente")).toHaveClass("doka-status-badge--warning");
  });

  it("altera a aba selecionada sem depender de estilo local", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        label="Recortes"
        value="hoje"
        items={[
          { id: "hoje", label: "Hoje" },
          { id: "abertas", label: "Abertas" },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("tab", { name: "Hoje" })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("tab", { name: "Abertas" }));
    expect(onChange).toHaveBeenCalledWith("abertas");
  });

  it("fecha o diálogo por Escape e devolve o foco", async () => {
    const onClose = vi.fn();
    render(
      <>
        <button>Origem</button>
        <Dialog open title="Confirmar operação" onClose={onClose}>
          <button>Conteúdo</button>
        </Dialog>
      </>,
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
