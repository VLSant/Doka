import { describe, expect, it } from "vitest";
import { availableTaskActions, isTaskLate, taskMatchesSlice } from "../../../src/modules/tarefas-rotinas/task-state";
import type { Task } from "../../../src/modules/tarefas-rotinas/types";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    titulo: "Conferir estoque",
    descricao: "Contagem diária",
    tipo: "avulsa",
    posto_id: "posto-1",
    cargo_funcao_id: null,
    prioridade_id: null,
    status: "pendente",
    prazo_data: "2026-07-02",
    horario_limite: null,
    exige_validacao: false,
    observacoes: null,
    rotina_id: null,
    criada_por: "supervisor-1",
    iniciada_em: null,
    concluida_em: null,
    validada_em: null,
    reaberta_em: null,
    justificativa_reabertura: null,
    created_at: "2026-07-01T12:00:00Z",
    updated_at: "2026-07-01T12:00:00Z",
    posto: { id: "posto-1", nome: "Posto 1" },
    prioridade: null,
    cargo_funcao: null,
    responsaveis: [{ id: "operator-1", nome: "Operador" }],
    ...overrides,
  };
}

describe("task-state", () => {
  it("classifica atraso apenas para tarefas abertas com prazo anterior", () => {
    const today = new Date(2026, 6, 3);
    expect(isTaskLate(task(), today)).toBe(true);
    expect(isTaskLate(task({ status: "concluida" }), today)).toBe(false);
    expect(isTaskLate(task({ prazo_data: null }), today)).toBe(false);
  });

  it("combina recorte e filtros sem depender do banco", () => {
    const today = new Date(2026, 6, 3);
    expect(taskMatchesSlice(task(), { slice: "atrasadas", termo: "estoque" }, today)).toBe(true);
    expect(taskMatchesSlice(task(), { slice: "concluidas" }, today)).toBe(false);
  });

  it("permite ao responsável iniciar e concluir, mas não validar", () => {
    const actions = availableTaskActions(task(), {
      usuarioId: "operator-1",
      perfil: "operador",
      postoIds: ["posto-1"],
    });
    expect(actions).toEqual(["iniciar", "concluir"]);
  });

  it("permite à supervisão validar tarefa concluída de seu posto", () => {
    const actions = availableTaskActions(task({ status: "concluida", exige_validacao: true }), {
      usuarioId: "supervisor-2",
      perfil: "supervisao",
      postoIds: ["posto-1"],
    });
    expect(actions).toEqual(["validar", "reabrir"]);
  });
});
