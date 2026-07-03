export interface DashboardFilters {
  inicio: string;
  fim: string;
  postoId: string | null;
}

export interface DashboardCounters {
  assistenciasTotal: number;
  assistenciasExecutadas: number;
  assistenciasPendentes: number;
  assistenciasRemovidas: number;
  ocorrenciasAbertas: number;
  ocorrenciasAtrasadas: number;
  ocorrenciasReaparecemHoje: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
  tarefasAguardandoValidacao: number;
  lancamentosPendentes: number;
}

/** Linha da view_produtividade_mms (agregado por posto/dia/tipo). */
export interface ProdutividadeLinha {
  posto_id: string;
  posto_nome: string;
  data_atividade: string;
  tipo_atividade_normalizado: string | null;
  previstas: number;
  removidas: number;
  executadas: number;
  nao_executadas: number;
  pendentes: number;
  iniciadas: number;
  canceladas: number;
}

export interface MetaEficiencia {
  posto_id: string;
  tipo_atividade_normalizado: string;
  meta_percentual: number;
}

/** Totais de produtividade de um recorte (período, posto ou geral). */
export interface ProdutividadeTotais {
  previstas: number;
  removidas: number;
  executadas: number;
  naoExecutadas: number;
  pendentes: number;
  iniciadas: number;
  canceladas: number;
  /** executadas / (executadas + não executadas), em %; null sem baixas. */
  eficiencia: number | null;
}

export interface ResumoPosto extends ProdutividadeTotais {
  postoId: string;
  postoNome: string;
  /** Meta vigente aplicável ao posto (menor meta entre os tipos), em %. */
  meta: number | null;
  /**
   * Quantas baixas como "não executado" ainda cabem sem perder a meta;
   * negativo indica que a meta já foi perdida no período.
   */
  margemFrustracao: number | null;
}

export interface DashboardAlerta {
  id: string;
  tipo: "eficiencia" | "ocorrencia" | "tarefa" | "lancamento";
  mensagem: string;
}

export interface DashboardData {
  counters: DashboardCounters;
  produtividade: {
    periodo: ProdutividadeTotais;
    dia: ProdutividadeTotais;
    semana: ProdutividadeTotais;
    porPosto: ResumoPosto[];
  };
  alertas: DashboardAlerta[];
}

export interface DashboardPosto {
  id: string;
  nome: string;
  codigo: string | null;
}

export type DashboardError = Error & {
  code: "filtros_invalidos" | "acesso_negado" | "falha_temporaria";
  retryable: boolean;
};
