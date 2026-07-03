import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import type {
  Routine,
  RoutineInput,
  Task,
  TaskAction,
  TaskError,
  TaskFilters,
  TaskInput,
} from "./types";

const TASK_SELECT = `
  *,
  posto:postos!tarefas_posto_id_fkey(id,nome),
  prioridade:prioridades!tarefas_prioridade_id_fkey(id,nome,cor),
  cargo_funcao:cargos_funcoes!tarefas_cargo_funcao_id_fkey(id,nome),
  tarefa_responsaveis(usuario_id,usuario:usuarios!tarefa_responsaveis_usuario_id_fkey(id,nome))
`;
const ROUTINE_SELECT = `
  *,
  posto:postos!rotinas_posto_id_fkey(id,nome),
  prioridade:prioridades!rotinas_prioridade_id_fkey(id,nome,cor),
  cargo_funcao:cargos_funcoes!rotinas_cargo_funcao_id_fkey(id,nome),
  rotina_responsaveis(usuario_id,usuario:usuarios!rotina_responsaveis_usuario_id_fkey(id,nome))
`;

const ERROR_MESSAGES: Record<TaskError["code"], string> = {
  acesso_negado: "Você não possui permissão para esta operação.",
  justificativa_obrigatoria: "Informe uma justificativa para reabrir ou remover.",
  operador_somente_para_si: "Operadores podem criar tarefas somente para si.",
  responsavel_fora_do_escopo: "Um dos responsáveis está fora do seu escopo.",
  transicao_invalida: "Esta ação não é permitida no estado atual.",
  validacao: "Revise os campos obrigatórios.",
  falha_temporaria: "Não foi possível concluir a operação. Tente novamente.",
};

export function mapTaskError(error: PostgrestError | Error): TaskError {
  const candidates: TaskError["code"][] = [
    "acesso_negado",
    "justificativa_obrigatoria",
    "operador_somente_para_si",
    "responsavel_fora_do_escopo",
    "transicao_invalida",
    "validacao",
  ];
  const code = candidates.find((candidate) => error.message.includes(candidate)) ?? "falha_temporaria";
  const mapped = new Error(ERROR_MESSAGES[code]) as TaskError;
  mapped.code = code;
  mapped.retryable = code === "falha_temporaria";
  return mapped;
}

function normalizeTask(row: Record<string, unknown>): Task {
  const links = (row.tarefa_responsaveis ?? []) as {
    usuario_id: string;
    usuario: { id: string; nome: string } | null;
  }[];
  return {
    ...row,
    responsaveis: links.map((link) => link.usuario ?? { id: link.usuario_id, nome: "Usuário" }),
  } as unknown as Task;
}

function normalizeRoutine(row: Record<string, unknown>): Routine {
  const links = (row.rotina_responsaveis ?? []) as {
    usuario_id: string;
    usuario: { id: string; nome: string } | null;
  }[];
  return {
    ...row,
    responsaveis: links.map((link) => link.usuario ?? { id: link.usuario_id, nome: "Usuário" }),
  } as unknown as Routine;
}

async function rpc<T>(client: SupabaseClient, name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(name, args);
  if (error) throw mapTaskError(error);
  return data as T;
}

export interface TaskService {
  listTasks(filters?: Partial<TaskFilters>): Promise<Task[]>;
  getTask(id: string): Promise<Task>;
  createTask(input: TaskInput): Promise<Task>;
  updateTask(
    id: string,
    input: TaskInput,
    canChangeResponsible: boolean,
    originalType?: Task["tipo"],
  ): Promise<Task>;
  transitionTask(id: string, action: TaskAction, justification?: string): Promise<Task>;
  removeTask(id: string, justification: string): Promise<void>;
  listRoutines(): Promise<Routine[]>;
  getRoutine(id: string): Promise<Routine>;
  createRoutine(input: RoutineInput): Promise<Routine>;
  updateRoutine(id: string, input: RoutineInput): Promise<Routine>;
  removeRoutine(id: string, justification: string): Promise<void>;
  generateRoutineTasks(): Promise<number>;
}

function taskArgs(input: TaskInput) {
  return {
    p_titulo: input.titulo.trim(),
    p_descricao: input.descricao?.trim() || null,
    p_tipo: input.tipo,
    p_posto_id: input.postoId || null,
    p_cargo_funcao_id: input.cargoFuncaoId || null,
    p_prioridade_id: input.prioridadeId || null,
    p_prazo_data: input.prazoData || null,
    p_horario_limite: input.horarioLimite || null,
    p_exige_validacao: input.exigeValidacao,
    p_observacoes: input.observacoes?.trim() || null,
    p_responsaveis: input.responsaveis,
  };
}

function routineArgs(input: RoutineInput) {
  return {
    p_nome: input.nome.trim(),
    p_descricao: input.descricao?.trim() || null,
    p_posto_id: input.postoId || null,
    p_cargo_funcao_id: input.cargoFuncaoId || null,
    p_prioridade_id: input.prioridadeId || null,
    p_recorrencia: input.recorrencia,
    p_dias_semana: input.recorrencia === "semanal" ? input.diasSemana : null,
    p_dia_mes: input.recorrencia === "mensal" ? input.diaMes : null,
    p_horario_limite: input.horarioLimite || null,
    p_exige_validacao: input.exigeValidacao,
    p_data_inicio: input.dataInicio,
    p_data_fim: input.dataFim || null,
    p_responsaveis: input.responsaveis,
  };
}

export function createTaskService(client: SupabaseClient = getSupabaseClient()): TaskService {
  async function getTask(id: string) {
    const { data, error } = await client
      .from("tarefas")
      .select(TASK_SELECT)
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    if (error) throw mapTaskError(error);
    return normalizeTask(data as Record<string, unknown>);
  }

  async function getRoutine(id: string) {
    const { data, error } = await client
      .from("rotinas")
      .select(ROUTINE_SELECT)
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    if (error) throw mapTaskError(error);
    return normalizeRoutine(data as Record<string, unknown>);
  }

  return {
    async listTasks(filters = {}) {
      let query = client
        .from("tarefas")
        .select(TASK_SELECT)
        .is("deleted_at", null)
        .order("prazo_data", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.postoId) query = query.eq("posto_id", filters.postoId);
      const { data, error } = await query;
      if (error) throw mapTaskError(error);
      return ((data ?? []) as Record<string, unknown>[]).map(normalizeTask);
    },
    getTask,
    async createTask(input) {
      if (!input.titulo.trim() || input.responsaveis.length === 0) {
        throw mapTaskError(new Error("validacao"));
      }
      const created = await rpc<Task>(client, "criar_tarefa", taskArgs(input));
      return getTask(created.id);
    },
    async updateTask(id, input, canChangeResponsible, originalType) {
      if (!input.titulo.trim()) throw mapTaskError(new Error("validacao"));
      const args = taskArgs(input);
      const updated = await rpc<Task>(client, "atualizar_tarefa", {
        p_tarefa_id: id,
        p_titulo: args.p_titulo,
        p_descricao: args.p_descricao,
        p_tipo: originalType === "rotina" ? null : args.p_tipo,
        p_posto_id: args.p_posto_id,
        p_cargo_funcao_id: args.p_cargo_funcao_id,
        p_prioridade_id: args.p_prioridade_id,
        p_prazo_data: args.p_prazo_data,
        p_horario_limite: args.p_horario_limite,
        p_exige_validacao: args.p_exige_validacao,
        p_observacoes: args.p_observacoes,
        p_responsaveis: canChangeResponsible ? input.responsaveis : null,
      });
      return getTask(updated.id);
    },
    async transitionTask(id, action, justification) {
      await rpc<Task>(client, "transicionar_tarefa", {
        p_tarefa_id: id,
        p_acao: action,
        p_justificativa: justification?.trim() || null,
      });
      return getTask(id);
    },
    async removeTask(id, justification) {
      await rpc<void>(client, "remover_tarefa", {
        p_tarefa_id: id,
        p_justificativa: justification.trim(),
      });
    },
    async listRoutines() {
      const { data, error } = await client
        .from("rotinas")
        .select(ROUTINE_SELECT)
        .is("deleted_at", null)
        .order("nome");
      if (error) throw mapTaskError(error);
      return ((data ?? []) as Record<string, unknown>[]).map(normalizeRoutine);
    },
    getRoutine,
    async createRoutine(input) {
      if (!input.nome.trim() || !input.dataInicio || input.responsaveis.length === 0) {
        throw mapTaskError(new Error("validacao"));
      }
      const created = await rpc<Routine>(client, "criar_rotina", routineArgs(input));
      return getRoutine(created.id);
    },
    async updateRoutine(id, input) {
      const updated = await rpc<Routine>(client, "atualizar_rotina", {
        p_rotina_id: id,
        ...routineArgs(input),
        p_status: input.status ?? null,
      });
      return getRoutine(updated.id);
    },
    async removeRoutine(id, justification) {
      await rpc<void>(client, "remover_rotina", {
        p_rotina_id: id,
        p_justificativa: justification.trim(),
      });
    },
    generateRoutineTasks() {
      return rpc<number>(client, "gerar_tarefas_rotinas", {});
    },
  };
}
