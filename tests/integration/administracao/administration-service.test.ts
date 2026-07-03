import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  AdministrationError,
  createAdministrationService,
} from "../../../src/modules/administracao/administration-service";

function mutationClient(errorMessage?: string) {
  const update = vi.fn();
  const insert = vi.fn();
  const eq = vi.fn();
  const is = vi.fn();

  const terminal = Promise.resolve({
    data: null,
    error: errorMessage ? { message: errorMessage } : null,
  });
  is.mockReturnValue(terminal);
  eq.mockReturnValue({ is });
  update.mockReturnValue({ eq });
  insert.mockReturnValue(terminal);

  const client = {
    from: vi.fn(() => ({ update, insert })),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;

  return { client, update, insert };
}

describe("AdministrationService", () => {
  it("associa uma identidade Auth sem usar credenciais privilegiadas", async () => {
    const mock = mutationClient();
    const service = createAdministrationService(mock.client);

    await service.saveUser(
      null,
      {
        auth_user_id: "auth-1",
        nome: "  Maria Operadora ",
        email: " MARIA@DOKA.TEST ",
        perfil: "operador",
        cargo_funcao_id: null,
        ativo: true,
      },
      "admin-1",
    );

    expect(mock.insert).toHaveBeenCalledWith({
      auth_user_id: "auth-1",
      nome: "Maria Operadora",
      email: "maria@doka.test",
      perfil: "operador",
      cargo_funcao_id: null,
      ativo: true,
      created_by: "admin-1",
    });
  });

  it("traduz a proteção do último administrador em mensagem operacional", async () => {
    const service = createAdministrationService(mutationClient("ultimo_admin_protegido").client);

    await expect(
      service.saveUser(
        "user-1",
        {
          auth_user_id: "auth-1",
          nome: "Direção",
          email: "direcao@doka.test",
          perfil: "operador",
          cargo_funcao_id: null,
          ativo: true,
        },
        "admin-1",
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AdministrationError>>({
        code: "ultimo_admin_protegido",
      }),
    );
  });

  it("executa remoção lógica com autoria e justificativa", async () => {
    const mock = mutationClient();
    const service = createAdministrationService(mock.client);

    await service.removePost("posto-1", "admin-1");

    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_by: "admin-1",
        delete_reason: "Removido pela administração",
      }),
    );
  });
});
