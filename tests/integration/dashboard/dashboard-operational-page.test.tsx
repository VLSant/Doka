import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DashboardService } from "../../../src/modules/dashboard/dashboard-service";
import { DashboardOperationalPage } from "../../../src/modules/dashboard/pages/DashboardOperationalPage";
import type { DashboardCounters } from "../../../src/modules/dashboard/types";

const emptyCounters: DashboardCounters = {
  assistenciasTotal: 0,
  assistenciasExecutadas: 0,
  assistenciasPendentes: 0,
  assistenciasRemovidas: 0,
  ocorrenciasAbertas: 0,
  ocorrenciasAtrasadas: 0,
  tarefasPendentes: 0,
  tarefasAtrasadas: 0,
  tarefasAguardandoValidacao: 0,
  lancamentosPendentes: 0,
};

function service(
  counters: DashboardCounters = emptyCounters,
): DashboardService & { load: ReturnType<typeof vi.fn> } {
  return {
    load: vi.fn().mockResolvedValue({ counters }),
    listPostos: vi.fn().mockResolvedValue([
      { id: "posto-1", nome: "Salvador", codigo: "SSA" },
    ]),
  };
}

describe("DashboardOperationalPage", () => {
  it("shows loading, counters and the empty-period state", async () => {
    const mock = service();
    render(<DashboardOperationalPage service={mock} />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando indicadores");
    expect(await screen.findByRole("heading", { name: "Nenhum dado no período" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Resumo operacional" })).toBeVisible();
  });

  it("applies posto and period selected by the user", async () => {
    const mock = service({ ...emptyCounters, tarefasPendentes: 3 });
    render(<DashboardOperationalPage service={mock} />);
    await screen.findByText("SSA — Salvador");

    await userEvent.selectOptions(screen.getByLabelText("Posto"), "posto-1");
    await userEvent.clear(screen.getByLabelText("Data inicial"));
    await userEvent.type(screen.getByLabelText("Data inicial"), "2026-07-01");
    await userEvent.clear(screen.getByLabelText("Data final"));
    await userEvent.type(screen.getByLabelText("Data final"), "2026-07-03");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(mock.load).toHaveBeenLastCalledWith({
      inicio: "2026-07-01",
      fim: "2026-07-03",
      postoId: "posto-1",
    });
    expect(screen.getByText("3")).toBeVisible();
  });

  it("keeps failures distinct from an empty result and allows retry", async () => {
    const error = Object.assign(new Error("Serviço temporariamente indisponível."), {
      code: "falha_temporaria" as const,
      retryable: true,
    });
    const mock: DashboardService = {
      load: vi.fn().mockRejectedValue(error),
      listPostos: vi.fn().mockResolvedValue([]),
    };
    render(<DashboardOperationalPage service={mock} />);

    expect(await screen.findByRole("heading", { name: "Falha ao carregar Dashboard" })).toBeVisible();
    expect(screen.queryByText("Nenhum dado no período")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  });
});
