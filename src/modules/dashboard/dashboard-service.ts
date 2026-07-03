import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import {
  montarAlertas,
  resumirPorPosto,
  somarProdutividade,
} from "./dashboard-state";
import type {
  DashboardData,
  DashboardError,
  DashboardFilters,
  DashboardPosto,
  MetaEficiencia,
  ProdutividadeLinha,
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
      const inicioSemana = addDays(filters.fim, -6);
      const inicioConsulta = filters.inicio < inicioSemana ? filters.inicio : inicioSemana;

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
        .lt("data_retorno", hoje);
      let ocorrenciasReaparecemHoje = client
        .from("ocorrencias")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .in("status", ["aberta", "em_acompanhamento", "aguardando_retorno", "reaberta"])
        .eq("data_retorno", hoje);
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
      let produtividade = client
        .from("view_produtividade_mms")
        .select("*")
        .gte("data_atividade", inicioConsulta)
        .lte("data_atividade", filters.fim);
      let metas = client
        .from("metas_eficiencia")
        .select("posto_id, tipo_atividade_normalizado, meta_percentual")
        .eq("ativo", true)
        .is("deleted_at", null)
        .lte("vigencia_inicio", filters.fim)
        .or(`vigencia_fim.is.null,vigencia_fim.gte.${filters.inicio}`);

      if (filters.postoId) {
        assistenciasTotal = assistenciasTotal.eq("posto_id", filters.postoId);
        assistenciasExecutadas = assistenciasExecutadas.eq("posto_id", filters.postoId);
        assistenciasPendentes = assistenciasPendentes.eq("posto_id", filters.postoId);
        assistenciasRemovidas = assistenciasRemovidas.eq("posto_id", filters.postoId);
        ocorrenciasAbertas = ocorrenciasAbertas.eq("posto_id", filters.postoId);
        ocorrenciasAtrasadas = ocorrenciasAtrasadas.eq("posto_id", filters.postoId);
        ocorrenciasReaparecemHoje = ocorrenciasReaparecemHoje.eq("posto_id", filters.postoId);
        tarefasPendentes = tarefasPendentes.eq("posto_id", filters.postoId);
        tarefasAtrasadas = tarefasAtrasadas.eq("posto_id", filters.postoId);
        tarefasAguardandoValidacao = tarefasAguardandoValidacao.eq(
          "posto_id",
          filters.postoId,
        );
        lancamentosPendentes = lancamentosPendentes.eq("posto_id", filters.postoId);
        produtividade = produtividade.eq("posto_id", filters.postoId);
        metas = metas.eq("posto_id", filters.postoId);
      }

      const [countResults, produtividadeResult, metasResult] = await Promise.all([
        Promise.all([
          assistenciasTotal,
          assistenciasExecutadas,
          assistenciasPendentes,
          assistenciasRemovidas,
          ocorrenciasAbertas,
          ocorrenciasAtrasadas,
          ocorrenciasReaparecemHoje,
          tarefasPendentes,
          tarefasAtrasadas,
          tarefasAguardandoValidacao,
          lancamentosPendentes,
        ]),
        produtividade,
        metas,
      ]);

      if (produtividadeResult.error) throw mapDashboardError(produtividadeResult.error);
      if (metasResult.error) throw mapDashboardError(metasResult.error);

      const linhas = (produtividadeResult.data ?? []) as ProdutividadeLinha[];
      const linhasPeriodo = linhas.filter(
        (linha) => linha.data_atividade >= filters.inicio && linha.data_atividade <= filters.fim,
      );
      const linhasDia = linhas.filter((linha) => linha.data_atividade === filters.fim);
      const linhasSemana = linhas.filter(
        (linha) => linha.data_atividade >= inicioSemana && linha.data_atividade <= filters.fim,
      );
      const metasVigentes = (metasResult.data ?? []) as MetaEficiencia[];
      const porPosto = resumirPorPosto(linhasPeriodo, metasVigentes);

      const counters = {
        assistenciasTotal: countOrThrow(countResults[0]),
        assistenciasExecutadas: countOrThrow(countResults[1]),
        assistenciasPendentes: countOrThrow(countResults[2]),
        assistenciasRemovidas: countOrThrow(countResults[3]),
        ocorrenciasAbertas: countOrThrow(countResults[4]),
        ocorrenciasAtrasadas: countOrThrow(countResults[5]),
        ocorrenciasReaparecemHoje: countOrThrow(countResults[6]),
        tarefasPendentes: countOrThrow(countResults[7]),
        tarefasAtrasadas: countOrThrow(countResults[8]),
        tarefasAguardandoValidacao: countOrThrow(countResults[9]),
        lancamentosPendentes: countOrThrow(countResults[10]),
      };

      return {
        counters,
        produtividade: {
          periodo: somarProdutividade(linhasPeriodo),
          dia: somarProdutividade(linhasDia),
          semana: somarProdutividade(linhasSemana),
          porPosto,
        },
        alertas: montarAlertas(counters, porPosto),
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
  return addDays(value, 1);
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
