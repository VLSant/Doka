import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import type {
  AssistenciaCatalogoItem,
  Lancamento,
  LancamentoError,
  LancamentoErrorCode,
  LancamentoFilters,
  LancamentoFormOptions,
  LancamentoInput,
} from "./types";

const KNOWN_CODES = new Set<LancamentoErrorCode>([
  "acesso_negado",
  "assistencia_invalida",
  "falha_temporaria",
  "justificativa_obrigatoria",
  "lancamento_validado_imutavel",
  "transicao_invalida",
  "valor_invalido",
]);

const MESSAGES: Record<LancamentoErrorCode, string> = {
  acesso_negado: "Você não possui permissão para realizar esta ação.",
  assistencia_invalida: "A assistência selecionada não está disponível.",
  falha_temporaria: "Não foi possível concluir a operação. Tente novamente.",
  justificativa_obrigatoria: "Informe a justificativa da remoção.",
  lancamento_validado_imutavel: "Lançamentos validados não podem ser editados.",
  transicao_invalida: "Este lançamento já foi validado ou não está mais disponível.",
  valor_invalido: "Informe um valor válido.",
};

const LANCAMENTO_SELECT = `
  id, tipo, assistencia_id, posto_id, recurso, data_lancamento, descricao, valor,
  observacoes, status, validado_em, created_at, updated_at,
  posto:postos!lancamentos_operacionais_posto_id_fkey(id,nome),
  assistencia:mms_assistencias!lancamentos_operacionais_assistencia_id_fkey(id,numero_assistencia),
  lancador:usuarios!lancamentos_operacionais_lancado_por_fkey(id,nome),
  validador:usuarios!lancamentos_operacionais_validado_por_fkey(id,nome)
`;

export function mapLancamentoError(error: PostgrestError | Error): LancamentoError {
  const code =
    [...KNOWN_CODES].find((candidate) => error.message.includes(candidate)) ??
    (error.message.includes("JWT") || error.message.includes("permission denied")
      ? "acesso_negado"
      : "falha_temporaria");
  const mapped = new Error(MESSAGES[code]) as LancamentoError;
  mapped.code = code;
  mapped.retryable = code === "falha_temporaria";
  return mapped;
}

function normalizeLancamento(row: unknown): Lancamento {
  const source = row as Lancamento & { valor: number | string };
  return { ...source, valor: Number(source.valor) };
}

async function resolveActorId(client: SupabaseClient): Promise<string> {
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity.user) throw mapLancamentoError(new Error("acesso_negado"));

  const { data, error } = await client
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", identity.user.id)
    .eq("ativo", true)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw mapLancamentoError(error ?? new Error("acesso_negado"));
  return String(data.id);
}

export interface LancamentoService {
  list(filters?: LancamentoFilters): Promise<Lancamento[]>;
  detail(id: string): Promise<Lancamento>;
  formOptions(): Promise<LancamentoFormOptions>;
  create(input: LancamentoInput): Promise<Lancamento>;
  update(id: string, input: LancamentoInput): Promise<Lancamento>;
  validate(id: string): Promise<Lancamento>;
  remove(id: string, justificativa: string): Promise<void>;
}

export function createLancamentoService(
  client: SupabaseClient = getSupabaseClient(),
): LancamentoService {
  return {
    async list(filters = {}) {
      let query = client
        .from("lancamentos_operacionais")
        .select(LANCAMENTO_SELECT)
        .is("deleted_at", null)
        .order("data_lancamento", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.data_de) query = query.gte("data_lancamento", filters.data_de);
      if (filters.data_ate) query = query.lte("data_lancamento", filters.data_ate);
      if (filters.posto_id) query = query.eq("posto_id", filters.posto_id);
      if (filters.assistencia_id) query = query.eq("assistencia_id", filters.assistencia_id);
      if (filters.tipo) query = query.eq("tipo", filters.tipo);
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.recurso?.trim()) query = query.ilike("recurso", `%${filters.recurso.trim()}%`);

      const { data, error } = await query;
      if (error) throw mapLancamentoError(error);
      return (data ?? []).map(normalizeLancamento);
    },

    async detail(id) {
      const { data, error } = await client
        .from("lancamentos_operacionais")
        .select(LANCAMENTO_SELECT)
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (error || !data) throw mapLancamentoError(error ?? new Error("acesso_negado"));
      return normalizeLancamento(data);
    },

    async formOptions() {
      const [postosResult, assistenciasResult] = await Promise.all([
        client
          .from("postos")
          .select("id,nome")
          .eq("ativo", true)
          .is("deleted_at", null)
          .order("nome"),
        client
          .from("mms_assistencias")
          .select("id,numero_assistencia,posto_id,cliente_nome_importado,cliente_nome_corrigido")
          .is("deleted_at", null)
          .order("data_atividade", { ascending: false })
          .limit(500),
      ]);
      if (postosResult.error) throw mapLancamentoError(postosResult.error);
      if (assistenciasResult.error) throw mapLancamentoError(assistenciasResult.error);

      const assistencias: AssistenciaCatalogoItem[] = (assistenciasResult.data ?? []).map(
        (row) => ({
          id: String(row.id),
          numero: String(row.numero_assistencia),
          cliente:
            row.cliente_nome_corrigido == null
              ? row.cliente_nome_importado == null
                ? null
                : String(row.cliente_nome_importado)
              : String(row.cliente_nome_corrigido),
          posto_id: String(row.posto_id),
        }),
      );
      return {
        postos: (postosResult.data ?? []).map((row) => ({
          id: String(row.id),
          nome: String(row.nome),
        })),
        assistencias,
      };
    },

    async create(input) {
      const actorId = await resolveActorId(client);
      const { data, error } = await client
        .from("lancamentos_operacionais")
        .insert({
          ...input,
          recurso: input.recurso?.trim() || null,
          descricao: input.descricao.trim(),
          observacoes: input.observacoes?.trim() || null,
          lancado_por: actorId,
          updated_by: actorId,
        })
        .select(LANCAMENTO_SELECT)
        .single();
      if (error || !data) throw mapLancamentoError(error ?? new Error("falha_temporaria"));
      return normalizeLancamento(data);
    },

    async update(id, input) {
      const actorId = await resolveActorId(client);
      const { data, error } = await client
        .from("lancamentos_operacionais")
        .update({
          ...input,
          recurso: input.recurso?.trim() || null,
          descricao: input.descricao.trim(),
          observacoes: input.observacoes?.trim() || null,
          updated_by: actorId,
        })
        .eq("id", id)
        .is("deleted_at", null)
        .select(LANCAMENTO_SELECT)
        .single();
      if (error || !data) throw mapLancamentoError(error ?? new Error("falha_temporaria"));
      return normalizeLancamento(data);
    },

    async validate(id) {
      const { data, error } = await client.rpc("validar_lancamento", {
        p_lancamento_id: id,
      });
      if (error || !data) throw mapLancamentoError(error ?? new Error("falha_temporaria"));
      return normalizeLancamento(data);
    },

    async remove(id, justificativa) {
      if (!justificativa.trim()) {
        throw mapLancamentoError(new Error("justificativa_obrigatoria"));
      }
      const { error } = await client.rpc("remover_lancamento", {
        p_lancamento_id: id,
        p_justificativa: justificativa.trim(),
      });
      if (error) throw mapLancamentoError(error);
    },
  };
}
