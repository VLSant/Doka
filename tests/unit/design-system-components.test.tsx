import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "../../src/components/layout/Page";
import { ButtonLink } from "../../src/components/ui/ButtonLink";
import { Dialog } from "../../src/components/ui/Dialog";
import { Drawer } from "../../src/components/ui/Drawer";
import { FilterChips } from "../../src/components/ui/FilterChips";
import { Select, Textarea } from "../../src/components/ui/FormControls";
import { Pagination } from "../../src/components/ui/Pagination";
import { SearchInput } from "../../src/components/ui/SearchInput";
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

  it("fecha o drawer por Escape e mantém filtros removíveis", async () => {
    const onClose = vi.fn();
    const onRemove = vi.fn();
    render(
      <>
        <Drawer open title="Filtros" onClose={onClose}>
          <button>Aplicar</button>
        </Drawer>
        <FilterChips
          items={[{ id: "posto", label: "Posto: Salvador" }]}
          onRemove={onRemove}
          onClear={vi.fn()}
        />
      </>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: /Posto: Salvador/ }));
    expect(onRemove).toHaveBeenCalledWith("posto");
  });

  it("oferece busca com limpeza e paginação compacta", async () => {
    const onSearch = vi.fn();
    const onPage = vi.fn();
    const { rerender } = render(<SearchInput value="" onChange={onSearch} debounceMs={0} />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar" }), "tarefa");
    expect(onSearch).toHaveBeenCalled();
    rerender(
      <>
        <SearchInput value="tarefa" onChange={onSearch} />
        <Pagination page={1} pageSize={25} total={40} onChange={onPage} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(onSearch).toHaveBeenLastCalledWith("");
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPage).toHaveBeenCalledWith(2);
  });
});
