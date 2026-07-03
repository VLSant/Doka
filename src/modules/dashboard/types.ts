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
  tarefasPendentes: number;
  tarefasAtrasadas: number;
  tarefasAguardandoValidacao: number;
  lancamentosPendentes: number;
}

export interface DashboardData {
  counters: DashboardCounters;
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
