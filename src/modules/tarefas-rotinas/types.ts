import type { PerfilUsuario } from "../access/types";

export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "validada" | "reaberta";
export type TaskType = "avulsa" | "rotina" | "estrategia";
export type RoutineStatus = "ativa" | "pausada" | "inativa";
export type Recurrence = "diaria" | "semanal" | "quinzenal" | "mensal";
export type TaskSlice = "hoje" | "pendentes" | "atrasadas" | "validacao" | "concluidas" | "todas";

export interface NamedReference {
  id: string;
  nome: string;
}

export type TaskResponsible = NamedReference;

export interface Task {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: TaskType;
  posto_id: string | null;
  cargo_funcao_id: string | null;
  prioridade_id: string | null;
  status: TaskStatus;
  prazo_data: string | null;
  horario_limite: string | null;
  exige_validacao: boolean;
  observacoes: string | null;
  rotina_id: string | null;
  criada_por: string;
  iniciada_em: string | null;
  concluida_em: string | null;
  validada_em: string | null;
  reaberta_em: string | null;
  justificativa_reabertura: string | null;
  created_at: string;
  updated_at: string;
  posto: NamedReference | null;
  prioridade: (NamedReference & { cor?: string | null }) | null;
  cargo_funcao: NamedReference | null;
  responsaveis: TaskResponsible[];
}

export interface Routine {
  id: string;
  nome: string;
  descricao: string | null;
  posto_id: string | null;
  cargo_funcao_id: string | null;
  prioridade_id: string | null;
  recorrencia: Recurrence;
  dias_semana: number[] | null;
  dia_mes: number | null;
  horario_limite: string | null;
  exige_validacao: boolean;
  status: RoutineStatus;
  data_inicio: string;
  data_fim: string | null;
  criada_por: string;
  created_at: string;
  updated_at: string;
  posto: NamedReference | null;
  prioridade: (NamedReference & { cor?: string | null }) | null;
  cargo_funcao: NamedReference | null;
  responsaveis: TaskResponsible[];
}

export interface TaskFilters {
  slice: TaskSlice;
  termo?: string;
  status?: TaskStatus | "";
  postoId?: string;
  responsavelId?: string;
}

export interface TaskInput {
  titulo: string;
  descricao?: string;
  tipo: Exclude<TaskType, "rotina">;
  postoId?: string;
  cargoFuncaoId?: string;
  prioridadeId?: string;
  prazoData?: string;
  horarioLimite?: string;
  exigeValidacao: boolean;
  observacoes?: string;
  responsaveis: string[];
}

export interface RoutineInput {
  nome: string;
  descricao?: string;
  postoId?: string;
  cargoFuncaoId?: string;
  prioridadeId?: string;
  recorrencia: Recurrence;
  diasSemana?: number[];
  diaMes?: number;
  horarioLimite?: string;
  exigeValidacao: boolean;
  status?: RoutineStatus;
  dataInicio: string;
  dataFim?: string;
  responsaveis: string[];
}

export interface TaskViewer {
  usuarioId: string;
  perfil: PerfilUsuario;
  postoIds: string[];
}

export type TaskAction = "iniciar" | "concluir" | "validar" | "reabrir";

export interface TaskError extends Error {
  code:
    | "acesso_negado"
    | "justificativa_obrigatoria"
    | "operador_somente_para_si"
    | "responsavel_fora_do_escopo"
    | "transicao_invalida"
    | "validacao"
    | "falha_temporaria";
  retryable: boolean;
}
