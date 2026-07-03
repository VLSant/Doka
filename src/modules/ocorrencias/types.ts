export type OccurrenceStatus =
  | "aberta"
  | "em_acompanhamento"
  | "aguardando_retorno"
  | "resolvida"
  | "encerrada"
  | "reaberta";

export type OccurrenceTab = "hoje" | "abertas" | "atrasadas";

export interface NamedOption {
  id: string;
  nome: string;
}

export interface AssistanceOption {
  id: string;
  numero_assistencia: string;
  data_atividade: string;
  posto_id: string;
}

export interface OccurrenceListItem {
  id: string;
  assistencia_id: string;
  posto_id: string;
  tipo_ocorrencia_id: string;
  prioridade_id: string | null;
  responsavel_id: string | null;
  criada_por: string;
  titulo: string;
  descricao: string | null;
  observacoes: string | null;
  status: OccurrenceStatus;
  data_retorno: string | null;
  resolvida_em: string | null;
  encerrada_em: string | null;
  reaberta_em: string | null;
  justificativa_reabertura: string | null;
  created_at: string;
  updated_at: string;
  assistencia: {
    id: string;
    numero_assistencia: string;
    data_atividade: string;
    partes?: Array<{ recurso_importado: string | null; recurso_corrigido: string | null }>;
  } | null;
  posto: NamedOption | null;
  tipo: NamedOption | null;
  prioridade: NamedOption | null;
  responsavel: NamedOption | null;
}

export interface OccurrenceComment {
  id: string;
  ocorrencia_id: string;
  usuario_id: string;
  comentario: string;
  created_at: string;
  usuario: NamedOption | null;
}

export interface OccurrenceDetail extends OccurrenceListItem {
  comentarios: OccurrenceComment[];
}

export interface OccurrenceFilters {
  tab: OccurrenceTab;
  busca?: string;
  posto_id?: string;
  responsavel_id?: string;
  tipo_ocorrencia_id?: string;
  prioridade_id?: string;
  status?: OccurrenceStatus | "";
  assistencia_id?: string;
  montador?: string;
  data_de?: string;
  data_ate?: string;
}

export interface OccurrenceInput {
  assistencia_id: string;
  posto_id: string;
  tipo_ocorrencia_id: string;
  prioridade_id: string | null;
  responsavel_id: string | null;
  titulo: string;
  descricao: string | null;
  observacoes: string | null;
  data_retorno: string | null;
}

export interface OccurrenceCatalogs {
  assistencias: AssistanceOption[];
  tipos: NamedOption[];
  prioridades: NamedOption[];
  usuarios: NamedOption[];
  postos: NamedOption[];
}

export type OccurrenceErrorCode =
  | "acesso_negado"
  | "assistencia_invalida"
  | "responsavel_fora_do_posto"
  | "justificativa_obrigatoria"
  | "transicao_invalida"
  | "validacao"
  | "falha_temporaria";

export type OccurrenceError = Error & {
  code: OccurrenceErrorCode;
  retryable: boolean;
};

