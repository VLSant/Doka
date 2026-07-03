import { describe, expect, it } from "vitest";
import {
  calcularEficiencia,
  calcularMargemFrustracao,
  montarAlertas,
  resumirPorPosto,
  somarProdutividade,
} from "../../src/modules/dashboard/dashboard-state";
import type { DashboardCounters, ProdutividadeLinha } from "../../src/modules/dashboard/types";

const line: ProdutividadeLinha = {
  posto_id: "posto-1",
  posto_nome: "Salvador",
  data_atividade: "2026-07-03",
  tipo_atividade_normalizado: "montagem",
  previstas: 10,
  removidas: 1,
  executadas: 8,
  nao_executadas: 2,
  pendentes: 0,
  iniciadas: 0,
  canceladas: 0,
};

const counters: DashboardCounters = {
  assistenciasTotal: 0, assistenciasExecutadas: 0, assistenciasPendentes: 0,
  assistenciasRemovidas: 0, ocorrenciasAbertas: 0, ocorrenciasAtrasadas: 1,
  ocorrenciasReaparecemHoje: 2, tarefasPendentes: 0, tarefasAtrasadas: 3,
  tarefasAguardandoValidacao: 0, lancamentosPendentes: 1,
};

describe("dashboard-state", () => {
  it("calcula eficiência e totais sem incluir pendências no denominador", () => {
    expect(calcularEficiencia(8, 2)).toBe(80);
    expect(calcularEficiencia(0, 0)).toBeNull();
    expect(somarProdutividade([line])).toMatchObject({ previstas: 10, eficiencia: 80 });
  });

  it("resume por posto com meta e margem", () => {
    const result = resumirPorPosto([line], [{
      posto_id: "posto-1", tipo_atividade_normalizado: "montagem", meta_percentual: 85,
    }]);
    expect(result[0]).toMatchObject({ postoNome: "Salvador", meta: 85, eficiencia: 80 });
    expect(calcularMargemFrustracao(result[0], 85)).toBeLessThan(0);
  });

  it("gera alertas de eficiência e operação", () => {
    const posts = resumirPorPosto([line], [{
      posto_id: "posto-1", tipo_atividade_normalizado: "montagem", meta_percentual: 85,
    }]);
    expect(montarAlertas(counters, posts).map((item) => item.tipo)).toEqual(
      expect.arrayContaining(["eficiencia", "ocorrencia", "tarefa", "lancamento"]),
    );
  });
});
