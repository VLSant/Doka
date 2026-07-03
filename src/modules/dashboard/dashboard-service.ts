import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import type {
  DashboardData,
  DashboardError,
  DashboardFilters,
  DashboardPosto,
} from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function dashboardError(
  code: DashboardError["code"],
  message: string,
  retryable = false,
): DashboardError {
  return Object.assign(new Error(message), { code, retryable });
}

export function validateDashboardFilters(filters: DashboardFilters): DashboardFilters {
  if (
    !ISO_DATE.test(filters.inicio) ||
    !ISO_DATE.test(filters.fim) ||
    filters.inicio > filters.fim
  ) {
    throw dashboardError(
      "filtros_invalidos",
      "Informe um período válido para consultar o Dashboard.",
    );
  }
  return filters;
}

export function mapDashboardError(error: PostgrestError | Error): DashboardError {
  if ("code" in error && (error.code === "42501" || error.code === "PGRST301")) {
    return dashboardError(
      "acesso_negado",
      "Você não possui acesso aos dados solicitados.",
    );
  }
  return dashboardError(
    "falha_temporaria",
    "Não foi possível carregar o Dashboard. Tente novamente.",
    true,
  );
}

function countOrThrow(
  result: { count: number | null; error: PostgrestError | null },
): number {
  if (result.error) throw mapDashboardError(result.error);
  return result.count ?? 0;
}

export interface DashboardService {
  load(filters: DashboardFilters): Promise<DashboardData>;
  listPostos(): Promise<DashboardPosto[]>;
}

export function createDashboardService(
  client: SupabaseClient = getSupabaseClient(),
): DashboardService {
  return {
    async load(rawFilters) {
      const filters = validateDashboardFilters(rawFilters);
      const fimExclusivo = nextIsoDate(filters.fim);
      const hoje = todayInBahia();

      let assistenciasTotal = client
        .from("mms_assistencias")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("data_atividade", filters.inicio)
        .lte("data_atividade", filters.fim);
      let assistenciasExecutadas = client
        .from("mms_assistencias")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status_interno", "ativo")
        .in("status_atividade", ["concluido", "concluído"])
        .gte("data_atividade", filters.inicio)
        .lte("data_atividade", filters.fim);
      let assistenciasPendentes = client
        .from("mms_assistencias")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status_interno", "ativo")
        .in("status_atividade", ["pendente", "iniciado"])
        .gte("data_atividade", filters.inicio)
        .lte("data_atividade", filters.fim);
      let assistenciasRemovidas = client
        .from("mms_assistencias")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status_interno", "removido")
        .gte("data_atividade", filters.inicio)
        .lte("data_atividade", filters.fim);
      let ocorrenciasAbertas = client
        .from("ocorrencias")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("status", ["aberta", "em_acompanhamento", "aguardando_retorno", "reaberta"])
        .gte("created_at", `${filters.inicio}T00:00:00-03:00`)
        .lt("created_at", `${fimExclusivo}T00:00:00-03:00`);
      let ocorrenciasAtrasadas = client
        .from("ocorrencias")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("status", ["aberta", "em_acompanhamento", "aguardando_retorno", "reaberta"])
        .gte("created_at", `${filters.inicio}T00:00:00-03:00`)
        .lt("created_at", `${fimExclusivo}T00:00:00-03:00`)
        .lt("data_retorno", hoje);
      let tarefasPendentes = client
        .from("tarefas")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("status", ["pendente", "em_andamento", "reaberta"])
        .gte("created_at", `${filters.inicio}T00:00:00-03:00`)
        .lt("created_at", `${fimExclusivo}T00:00:00-03:00`);
      let tarefasAtrasadas = client
        .from("tarefas")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("status", ["pendente", "em_andamento", "reaberta"])
        .gte("created_at", `${filters.inicio}T00:00:00-03:00`)
        .lt("created_at", `${fimExclusivo}T00:00:00-03:00`)
        .lt("prazo_data", hoje);
      let tarefasAguardandoValidacao = client
        .from("tarefas")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", "concluida")
        .eq("exige_validacao", true)
        .gte("created_at", `${filters.inicio}T00:00:00-03:00`)
        .lt("created_at", `${fimExclusivo}T00:00:00-03:00`);
      let lancamentosPendentes = client
        .from("lancamentos_operacionais")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", "pendente")
        .gte("data_lancamento", filters.inicio)
        .lte("data_lancamento", filters.fim);

      if (filters.postoId) {
        assistenciasTotal = assistenciasTotal.eq("posto_id", filters.postoId);
        assistenciasExecutadas = assistenciasExecutadas.eq("posto_id", filters.postoId);
        assistenciasPendentes = assistenciasPendentes.eq("posto_id", filters.postoId);
        assistenciasRemovidas = assistenciasRemovidas.eq("posto_id", filters.postoId);
        ocorrenciasAbertas = ocorrenciasAbertas.eq("posto_id", filters.postoId);
        ocorrenciasAtrasadas = ocorrenciasAtrasadas.eq("posto_id", filters.postoId);
        tarefasPendentes = tarefasPendentes.eq("posto_id", filters.postoId);
        tarefasAtrasadas = tarefasAtrasadas.eq("posto_id", filters.postoId);
        tarefasAguardandoValidacao = tarefasAguardandoValidacao.eq(
          "posto_id",
          filters.postoId,
        );
        lancamentosPendentes = lancamentosPendentes.eq("posto_id", filters.postoId);
      }

      const results = await Promise.all([
        assistenciasTotal,
        assistenciasExecutadas,
        assistenciasPendentes,
        assistenciasRemovidas,
        ocorrenciasAbertas,
        ocorrenciasAtrasadas,
        tarefasPendentes,
        tarefasAtrasadas,
        tarefasAguardandoValidacao,
        lancamentosPendentes,
      ]);

      return {
        counters: {
          assistenciasTotal: countOrThrow(results[0]),
          assistenciasExecutadas: countOrThrow(results[1]),
          assistenciasPendentes: countOrThrow(results[2]),
          assistenciasRemovidas: countOrThrow(results[3]),
          ocorrenciasAbertas: countOrThrow(results[4]),
          ocorrenciasAtrasadas: countOrThrow(results[5]),
          tarefasPendentes: countOrThrow(results[6]),
          tarefasAtrasadas: countOrThrow(results[7]),
          tarefasAguardandoValidacao: countOrThrow(results[8]),
          lancamentosPendentes: countOrThrow(results[9]),
        },
      };
    },

    async listPostos() {
      const { data, error } = await client
        .from("postos")
        .select("id,nome,codigo")
        .eq("ativo", true)
        .is("deleted_at", null)
        .order("nome");
      if (error) throw mapDashboardError(error);
      return (data ?? []) as DashboardPosto[];
    },
  };
}

export function todayInBahia(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function nextIsoDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
