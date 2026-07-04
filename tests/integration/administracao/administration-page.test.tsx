import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdministrationService } from "../../../src/modules/administracao/administration-service";
import { AdministrationPage } from "../../../src/modules/administracao/pages/AdministrationPage";
import type { AdministrationSnapshot } from "../../../src/modules/administracao/types";

vi.mock("../../../src/modules/auth/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    state: {
      name: "autorizado",
      context: {
        usuarioId: "admin-1",
        nome: "Direção",
        email: "direcao@doka.test",
        perfil: "direcao_admin",
        escopoGlobal: true,
        postos: [],
        carregadoEm: "2026-07-03T00:00:00Z",
      },
    },
  })),
}));

const snapshot: AdministrationSnapshot = {
  usuarios: [
    {
      id: "user-1",
      auth_user_id: "auth-1",
      nome: "Maria Operadora",
      email: "maria@doka.test",
      perfil: "operador",
      cargo_funcao_id: null,
      ativo: true,
    },
  ],
  postos: [
    {
      id: "posto-1",
      nome: "Posto Salvador",
      codigo: "SSA",
      descricao: null,
      ativo: true,
    },
  ],
  vinculos: [],
  cargos: [],
  prioridades: [],
  tiposOcorrencia: [],
  metasEficiencia: [],
};

function service(overrides: Partial<AdministrationService> = {}): AdministrationService {
  return {
    load: vi.fn().mockResolvedValue(snapshot),
    listAvailableIdentities: vi.fn().mockResolvedValue([]),
    saveUser: vi.fn(),
    savePost: vi.fn(),
    removePost: vi.fn(),
    saveLink: vi.fn(),
    removeLink: vi.fn(),
    saveCargo: vi.fn(),
    removeCargo: vi.fn(),
    savePriority: vi.fn(),
    removePriority: vi.fn(),
    saveOccurrenceType: vi.fn(),
    removeOccurrenceType: vi.fn(),
    saveEfficiencyTarget: vi.fn(),
    removeEfficiencyTarget: vi.fn(),
    ...overrides,
  };
}

describe("AdministrationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrega usuários e navega internamente para postos", async () => {
    const user = userEvent.setup();
    render(<AdministrationPage service={service()} />);

    expect(await screen.findByText("Maria Operadora")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Postos e vínculos" }));

    expect(screen.getAllByText("Posto Salvador")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Postos e vínculos" })).toBeInTheDocument();
  });

  it("apresenta erro de carregamento e permite tentar novamente", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(snapshot);
    const user = userEvent.setup();
    render(<AdministrationPage service={service({ load })} />);

    expect(await screen.findByText("Administração indisponível")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(screen.getByText("Maria Operadora")).toBeInTheDocument());
    expect(load).toHaveBeenCalledTimes(2);
  });
});
