import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { AssistanceListPage } from "../../../src/modules/assistencias-mms/pages/AssistanceListPage";
import { assistanceItem, assistancePage } from "../../helpers/assistencias-mms-fixtures";

function renderList(service: { list: ReturnType<typeof vi.fn> }) {
  return render(
    <MemoryRouter initialEntries={["/app/assistencias-mms"]}>
      <AssistanceListPage service={service as never} />
    </MemoryRouter>,
  );
}

describe("assistance list", () => {
  it("renders loading and an accessible result table", async () => {
    const service = { list: vi.fn().mockResolvedValue(assistancePage([assistanceItem])) };
    renderList(service);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    expect(await screen.findByRole("table", { name: "Assistências MMS" })).toBeVisible();
    expect(screen.getByText("ASS-008")).toBeVisible();
  });

  it("distinguishes the empty scope from filtered no-results", async () => {
    const service = { list: vi.fn().mockResolvedValue(assistancePage([])) };
    renderList(service);
    expect(await screen.findByText("Nenhuma assistência disponível")).toBeVisible();
    await userEvent.type(screen.getByLabelText("Buscar"), "008");
    await waitFor(() =>
      expect(screen.getByText("Nenhuma assistência corresponde aos filtros")).toBeVisible(),
    );
  });

  it("keeps temporary failure distinct from empty", async () => {
    const service = { list: vi.fn().mockRejectedValue(new Error("Serviço indisponível")) };
    renderList(service);
    expect(await screen.findByText("Falha ao carregar assistências")).toBeVisible();
    expect(screen.queryByText("Nenhuma assistência disponível")).not.toBeInTheDocument();
  });

  it("renders access denied separately and does not offer a retry", async () => {
    const error = Object.assign(new Error("Você não possui acesso."), {
      code: "acesso_negado",
    });
    const service = { list: vi.fn().mockRejectedValue(error) };
    renderList(service);
    expect(await screen.findByText("Acesso negado")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("removes stale rows when a filtered reload is denied", async () => {
    const error = Object.assign(new Error("Você não possui acesso."), {
      code: "acesso_negado",
    });
    const service = {
      list: vi
        .fn()
        .mockResolvedValueOnce(assistancePage([assistanceItem]))
        .mockRejectedValueOnce(error),
    };
    renderList(service);
    expect(await screen.findByText("ASS-008")).toBeVisible();

    await userEvent.type(screen.getByLabelText("Buscar"), "restrito");

    expect(await screen.findByText("Acesso negado")).toBeVisible();
    expect(screen.queryByText("ASS-008")).not.toBeInTheDocument();
  });
});
