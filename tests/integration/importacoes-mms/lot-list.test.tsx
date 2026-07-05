import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImportListPage } from "../../../src/modules/importacoes-mms/pages/ImportListPage";
import { lotSummary, page } from "../../helpers/importacao-mms-management-fixtures";
import { renderManagementRoute } from "./management-test-utils";

describe("import lot list", () => {
  it("renders loading, result and an accessible table", async () => {
    const service = { list: vi.fn().mockResolvedValue(page([lotSummary])) };
    renderManagementRoute(<ImportListPage service={service as never} />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    expect(await screen.findByRole("table", { name: "Lotes de importação MMS" })).toBeVisible();
    expect(screen.getByText("spec007.csv")).toBeVisible();
  });

  it("distinguishes an empty central from filtered no-results", async () => {
    const service = { list: vi.fn().mockResolvedValue(page([])) };
    renderManagementRoute(<ImportListPage service={service as never} />);
    expect(await screen.findByText("Nenhuma importação disponível")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Filtros" }));
    await userEvent.selectOptions(screen.getByLabelText("Status"), "erro");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() =>
      expect(screen.getByText("Nenhum lote corresponde aos filtros")).toBeVisible(),
    );
  });

  it("keeps temporary failure distinct from an empty response", async () => {
    const service = { list: vi.fn().mockRejectedValue(new Error("Serviço indisponível")) };
    renderManagementRoute(<ImportListPage service={service as never} />);
    expect(await screen.findByText("Falha ao carregar importações")).toBeVisible();
    expect(screen.queryByText("Nenhuma importação disponível")).not.toBeInTheDocument();
  });
});
