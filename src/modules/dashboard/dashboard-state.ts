/**
 * Funções puras de agregação de produtividade/eficiência do Dashboard.
 *
 * Regra de eficiência (PRD, módulo Produtividade/Eficiência):
 * eficiência = executadas / (executadas + não executadas). Pendentes e
 * canceladas não entram no denominador porque ainda não foram baixadas ou
 * foram retiradas do dia pela própria operação.
 *
 * Margem de frustração: com a meta M (%), o total de baixas relevantes do
 * recorte (executadas + não executadas + pendentes ainda por baixar) admite
 * no máximo floor(total * (1 - M/100)) não executadas. A margem é esse teto
 * menos as não executadas já registradas — negativa quando a meta já foi
 * perdida.
 */
import type {
  DashboardAlerta,
  DashboardCounters,
  MetaEficiencia,
  ProdutividadeLinha,
  ProdutividadeTotais,
  ResumoPosto,
} from "./types";

const TOTAIS_VAZIOS: Omit<ProdutividadeTotais, "eficiencia"> = {
  previstas: 0,
  removidas: 0,
  executadas: 0,
  naoExecutadas: 0,
  pendentes: 0,
  iniciadas: 0,
  canceladas: 0,
};

export function calcularEficiencia(executadas: number, naoExecutadas: number): number | null {
  const baixadas = executadas + naoExecutadas;
  if (baixadas === 0) return null;
  return Math.round((executadas / baixadas) * 1000) / 10;
}

export function somarProdutividade(linhas: ProdutividadeLinha[]): ProdutividadeTotais {
  const totais = linhas.reduce(
    (acc, linha) => ({
      previstas: acc.previstas + linha.previstas,
      removidas: acc.removidas + linha.removidas,
      executadas: acc.executadas + linha.executadas,
      naoExecutadas: acc.naoExecutadas + linha.nao_executadas,
      pendentes: acc.pendentes + linha.pendentes,
      iniciadas: acc.iniciadas + linha.iniciadas,
      canceladas: acc.canceladas + linha.canceladas,
    }),
    { ...TOTAIS_VAZIOS },
  );
  return {
    ...totais,
    eficiencia: calcularEficiencia(totais.executadas, totais.naoExecutadas),
  };
}

export function calcularMargemFrustracao(
  totais: Pick<ProdutividadeTotais, "executadas" | "naoExecutadas" | "pendentes">,
  metaPercentual: number,
): number {
  const relevantes = totais.executadas + totais.naoExecutadas + totais.pendentes;
  const tetoNaoExecutadas = Math.floor(relevantes * (1 - metaPercentual / 100));
  return tetoNaoExecutadas - totais.naoExecutadas;
}

/** Meta aplicável ao posto: a mais exigente (maior percentual) entre os tipos vigentes. */
export function metaDoPosto(metas: MetaEficiencia[], postoId: string): number | null {
  const doPosto = metas.filter((meta) => meta.posto_id === postoId);
  if (doPosto.length === 0) return null;
  return Math.max(...doPosto.map((meta) => Number(meta.meta_percentual)));
}

export function resumirPorPosto(
  linhas: ProdutividadeLinha[],
  metas: MetaEficiencia[],
): ResumoPosto[] {
  const porPosto = new Map<string, ProdutividadeLinha[]>();
  for (const linha of linhas) {
    const grupo = porPosto.get(linha.posto_id) ?? [];
    grupo.push(linha);
    porPosto.set(linha.posto_id, grupo);
  }

  return [...porPosto.entries()]
    .map(([postoId, grupo]) => {
      const totais = somarProdutividade(grupo);
      const meta = metaDoPosto(metas, postoId);
      return {
        postoId,
        postoNome: grupo[0].posto_nome,
        ...totais,
        meta,
        margemFrustracao: meta === null ? null : calcularMargemFrustracao(totais, meta),
      };
    })
    .sort((a, b) => a.postoNome.localeCompare(b.postoNome, "pt-BR"));
}

export function montarAlertas(
  counters: DashboardCounters,
  porPosto: ResumoPosto[],
): DashboardAlerta[] {
  const alertas: DashboardAlerta[] = [];

  for (const posto of porPosto) {
    if (posto.meta !== null && posto.eficiencia !== null && posto.eficiencia < posto.meta) {
      alertas.push({
        id: `eficiencia-${posto.postoId}`,
        tipo: "eficiencia",
        mensagem: `${posto.postoNome}: eficiência ${posto.eficiencia}% abaixo da meta de ${posto.meta}%.`,
      });
    } else if (posto.meta !== null && posto.margemFrustracao !== null && posto.margemFrustracao <= 1 && posto.pendentes > 0) {
      alertas.push({
        id: `margem-${posto.postoId}`,
        tipo: "eficiencia",
        mensagem: `${posto.postoNome}: restam ${Math.max(posto.margemFrustracao, 0)} baixa(s) como não executado antes de perder a meta de ${posto.meta}%.`,
      });
    }
  }

  if (counters.ocorrenciasReaparecemHoje > 0) {
    alertas.push({
      id: "ocorrencias-hoje",
      tipo: "ocorrencia",
      mensagem: `${counters.ocorrenciasReaparecemHoje} ocorrência(s) com retorno marcado para hoje.`,
    });
  }
  if (counters.ocorrenciasAtrasadas > 0) {
    alertas.push({
      id: "ocorrencias-atrasadas",
      tipo: "ocorrencia",
      mensagem: `${counters.ocorrenciasAtrasadas} ocorrência(s) atrasada(s) aguardando tratativa.`,
    });
  }
  if (counters.tarefasAtrasadas > 0) {
    alertas.push({
      id: "tarefas-atrasadas",
      tipo: "tarefa",
      mensagem: `${counters.tarefasAtrasadas} tarefa(s) além do prazo.`,
    });
  }
  if (counters.lancamentosPendentes > 0) {
    alertas.push({
      id: "lancamentos-pendentes",
      tipo: "lancamento",
      mensagem: `${counters.lancamentosPendentes} lançamento(s) aguardando validação.`,
    });
  }

  return alertas;
}
