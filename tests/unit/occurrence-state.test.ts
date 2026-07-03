import { describe, expect, it } from "vitest";
import {
  isOccurrenceOverdue,
  nextStatuses,
  occurrenceMatchesFilters,
  validateOccurrenceInput,
} from "../../src/modules/ocorrencias/occurrence-state";
import type {
  OccurrenceInput,
  OccurrenceListItem,
} from "../../src/modules/ocorrencias/types";

function occurrence(overrides: Partial<OccurrenceListItem> = {}): OccurrenceListItem {
  return {
    id: "o1",
    assistencia_id: "a1",
    posto_id: "p1",
    tipo_ocorrencia_id: "t1",
    prioridade_id: null,
    responsavel_id: "u1",
    criada_por: "u1",
    titulo: "Retorno do cliente",
    descricao: null,
    observacoes: null,
    status: "aberta",
    data_retorno: "2026-07-03",
    resolvida_em: null,
    encerrada_em: null,
    reaberta_em: null,
    justificativa_reabertura: null,
    created_at: "2026-07-01T10:00:00Z",
    updated_at: "2026-07-01T10:00:00Z",
    assistencia: { id: "a1", numero_assistencia: "123", data_atividade: "2026-07-01" },
    posto: { id: "p1", nome: "Posto 1" },
    tipo: { id: "t1", nome: "Retorno futuro" },
    prioridade: null,
    responsavel: { id: "u1", nome: "Ana" },
    ...overrides,
  };
}

describe("estado das ocorrências", () => {
  it("calcula atraso sem substituir o status", () => {
    expect(isOccurrenceOverdue(occurrence({ data_retorno: "2026-07-02" }), "2026-07-03")).toBe(true);
    expect(
      isOccurrenceOverdue(
        occurrence({ data_retorno: "2026-07-02", status: "resolvida" }),
        "2026-07-03",
      ),
    ).toBe(false);
  });

  it("separa Hoje, Abertas e Atrasadas", () => {
    const today = occurrence();
    const future = occurrence({ id: "o2", data_retorno: "2026-07-04" });
    const late = occurrence({ id: "o3", data_retorno: "2026-07-02" });
    expect(occurrenceMatchesFilters(today, { tab: "hoje" }, "2026-07-03")).toBe(true);
    expect(occurrenceMatchesFilters(future, { tab: "abertas" }, "2026-07-03")).toBe(true);
    expect(occurrenceMatchesFilters(late, { tab: "atrasadas" }, "2026-07-03")).toBe(true);
  });

  it("exige os campos operacionais definidos pelo PRD", () => {
    const empty: OccurrenceInput = {
      assistencia_id: "",
      posto_id: "",
      tipo_ocorrencia_id: "",
      prioridade_id: null,
      responsavel_id: null,
      titulo: " ",
      descricao: null,
      observacoes: null,
      data_retorno: null,
    };
    expect(validateOccurrenceInput(empty)).toEqual({
      assistencia_id: "Selecione uma assistência válida.",
      tipo_ocorrencia_id: "Selecione o tipo.",
      prioridade_id: "Selecione a prioridade.",
      responsavel_id: "Selecione o responsável.",
      data_retorno: "Informe a data de retorno.",
      titulo: "Informe o título.",
      descricao: "Informe a descrição.",
    });
  });

  it("só oferece transições aceitas pelo banco", () => {
    expect(nextStatuses("encerrada")).toEqual(["reaberta"]);
    expect(nextStatuses("aberta")).toContain("resolvida");
  });
});

