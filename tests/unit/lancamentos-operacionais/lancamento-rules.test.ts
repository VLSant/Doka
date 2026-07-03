import { describe, expect, it } from "vitest";
import { mapLancamentoError } from "../../../src/modules/lancamentos-operacionais/lancamento-service";
import {
  podeGerenciarLancamento,
  validateLancamentoInput,
} from "../../../src/modules/lancamentos-operacionais/types";

const validInput = {
  tipo: "deslocamento" as const,
  assistencia_id: null,
  posto_id: "posto-1",
  recurso: "Montador",
  data_lancamento: "2026-07-03",
  descricao: "Deslocamento até o cliente",
  valor: 25,
  observacoes: null,
};

describe("lancamento rules", () => {
  it("requires assistance only for an extra cost", () => {
    expect(validateLancamentoInput(validInput)).toEqual({});
    expect(validateLancamentoInput({ ...validInput, tipo: "custo_extra" })).toMatchObject({
      assistencia_id: expect.stringContaining("assistência"),
    });
  });

  it("rejects blank descriptions and non-positive values", () => {
    expect(validateLancamentoInput({ ...validInput, descricao: " ", valor: 0 })).toMatchObject({
      descricao: expect.any(String),
      valor: expect.any(String),
    });
  });

  it("allows validation and removal only for supervision or administration", () => {
    expect(podeGerenciarLancamento("operador")).toBe(false);
    expect(podeGerenciarLancamento("supervisao")).toBe(true);
    expect(podeGerenciarLancamento("direcao_admin")).toBe(true);
  });

  it("maps database command errors to actionable messages", () => {
    const error = mapLancamentoError(new Error("justificativa_obrigatoria"));
    expect(error.code).toBe("justificativa_obrigatoria");
    expect(error.message).toContain("justificativa");
    expect(error.retryable).toBe(false);
  });
});
