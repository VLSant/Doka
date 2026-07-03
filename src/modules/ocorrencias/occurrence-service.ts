import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import type {
  AssistanceOption,
  NamedOption,
  OccurrenceCatalogs,
  OccurrenceComment,
  OccurrenceDetail,
  OccurrenceError,
  OccurrenceErrorCode,
  OccurrenceInput,
  OccurrenceListItem,
  OccurrenceStatus,
} from "./types";

const SELECT_OCCURRENCE = `
  id, assistencia_id, posto_id, tipo_ocorrencia_id, prioridade_id,
  responsavel_id, criada_por, titulo, descricao, observacoes, status,
  data_retorno, resolvida_em, encerrada_em, reaberta_em,
  justificativa_reabertura, created_at, updated_at,
  assistencia:mms_assistencias!ocorrencias_assistencia_id_fkey(id, numero_assistencia, data_atividade),
  posto:postos!ocorrencias_posto_id_fkey(id, nome),
  tipo:tipos_ocorrencia!ocorrencias_tipo_ocorrencia_id_fkey(id, nome),
  prioridade:prioridades!ocorrencias_prioridade_id_fkey(id, nome),
  responsavel:usuarios!ocorrencias_responsavel_id_fkey(id, nome)
`;

const MESSAGES: Record<OccurrenceErrorCode, string> = {
  acesso_negado: "Você não possui permissão para esta ocorrência.",
  assistencia_invalida: "A assistência selecionada não está disponível.",
  justificativa_obrigatoria: "Informe uma justificativa.",
  transicao_invalida: "Esta mudança de status não é permitida.",
  validacao: "Revise os dados informados.",
  falha_temporaria: "Não foi possível concluir a operação. Tente novamente.",
};

export function mapOccurrenceError(error: PostgrestError | Error): OccurrenceError {
  const code = (
    [
      "acesso_negado",
      "assistencia_invalida",
      "justificativa_obrigatoria",
      "transicao_invalida",
    ] as OccurrenceErrorCode[]
  ).find((candidate) => error.message.includes(candidate));
  const selected = code ?? (error.message.includes("JWT") ? "acesso_negado" : "falha_temporaria");
  const mapped = new Error(MESSAGES[selected]) as OccurrenceError;
  mapped.code = selected;
  mapped.retryable = selected === "falha_temporaria";
  return mapped;
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeOccurrence(row: Record<string, unknown>): OccurrenceListItem {
  return {
    ...(row as unknown as Omit<
      OccurrenceListItem,
      "assistencia" | "posto" | "tipo" | "prioridade" | "responsavel"
    >),
    assistencia: unwrapRelation(row.assistencia as OccurrenceListItem["assistencia"]),
    posto: unwrapRelation(row.posto as NamedOption | NamedOption[] | null),
    tipo: unwrapRelation(row.tipo as NamedOption | NamedOption[] | null),
    prioridade: unwrapRelation(row.prioridade as NamedOption | NamedOption[] | null),
    responsavel: unwrapRelation(row.responsavel as NamedOption | NamedOption[] | null),
  };
}

async function currentOperationalUserId(client: SupabaseClient): Promise<string> {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw mapOccurrenceError(authError ?? new Error("acesso_negado"));
  const { data, error } = await client
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", auth.user.id)
    .eq("ativo", true)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw mapOccurrenceError(error ?? new Error("acesso_negado"));
  return data.id as string;
}

async function activeNamedOptions(
  client: SupabaseClient,
  table: "tipos_ocorrencia" | "prioridades" | "usuarios" | "postos",
): Promise<NamedOption[]> {
  let query = client.from(table).select("id, nome").eq("ativo", true).is("deleted_at", null);
  query = query.order("nome");
  const { data, error } = await query;
  if (error) throw mapOccurrenceError(error);
  return (data ?? []) as NamedOption[];
}

export interface OccurrenceService {
  list(): Promise<OccurrenceListItem[]>;
  detail(id: string): Promise<OccurrenceDetail>;
  catalogs(): Promise<OccurrenceCatalogs>;
  create(input: OccurrenceInput): Promise<OccurrenceListItem>;
  update(id: string, input: Omit<OccurrenceInput, "assistencia_id" | "posto_id">): Promise<void>;
  addComment(id: string, comment: string): Promise<OccurrenceComment>;
  transition(
    id: string,
    status: OccurrenceStatus,
    justification?: string,
    returnDate?: string | null,
  ): Promise<void>;
  remove(id: string, justification: string): Promise<void>;
}

export function createOccurrenceService(
  client: SupabaseClient = getSupabaseClient(),
): OccurrenceService {
  return {
    async list() {
      const { data, error } = await client
        .from("ocorrencias")
        .select(SELECT_OCCURRENCE)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw mapOccurrenceError(error);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeOccurrence);
    },

    async detail(id) {
      const { data, error } = await client
        .from("ocorrencias")
        .select(SELECT_OCCURRENCE)
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (error) throw mapOccurrenceError(error);
      const occurrence = normalizeOccurrence(data as unknown as Record<string, unknown>);
      const { data: comments, error: commentsError } = await client
        .from("ocorrencia_comentarios")
        .select(
          "id, ocorrencia_id, usuario_id, comentario, created_at, usuario:usuarios!ocorrencia_comentarios_usuario_id_fkey(id, nome)",
        )
        .eq("ocorrencia_id", id)
        .order("created_at");
      if (commentsError) throw mapOccurrenceError(commentsError);
      return {
        ...occurrence,
        comentarios: ((comments ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
          ...(row as unknown as Omit<OccurrenceComment, "usuario">),
          usuario: unwrapRelation(row.usuario as NamedOption | NamedOption[] | null),
        })),
      };
    },

    async catalogs() {
      const [assistancesResult, tipos, prioridades, usuarios, postos] = await Promise.all([
        client
          .from("mms_assistencias")
          .select("id, numero_assistencia, data_atividade, posto_id")
          .is("deleted_at", null)
          .order("data_atividade", { ascending: false })
          .limit(500),
        activeNamedOptions(client, "tipos_ocorrencia"),
        activeNamedOptions(client, "prioridades"),
        activeNamedOptions(client, "usuarios"),
        activeNamedOptions(client, "postos"),
      ]);
      if (assistancesResult.error) throw mapOccurrenceError(assistancesResult.error);
      return {
        assistencias: (assistancesResult.data ?? []) as AssistanceOption[],
        tipos,
        prioridades,
        usuarios,
        postos,
      };
    },

    async create(input) {
      const actorId = await currentOperationalUserId(client);
      const { data, error } = await client
        .from("ocorrencias")
        .insert({
          ...input,
          criada_por: actorId,
          updated_by: actorId,
        })
        .select(SELECT_OCCURRENCE)
        .single();
      if (error) throw mapOccurrenceError(error);
      return normalizeOccurrence(data as unknown as Record<string, unknown>);
    },

    async update(id, input) {
      const actorId = await currentOperationalUserId(client);
      const { error } = await client
        .from("ocorrencias")
        .update({ ...input, updated_by: actorId })
        .eq("id", id)
        .is("deleted_at", null);
      if (error) throw mapOccurrenceError(error);
    },

    async addComment(id, comment) {
      const actorId = await currentOperationalUserId(client);
      const { data, error } = await client
        .from("ocorrencia_comentarios")
        .insert({ ocorrencia_id: id, usuario_id: actorId, comentario: comment.trim() })
        .select("id, ocorrencia_id, usuario_id, comentario, created_at")
        .single();
      if (error) throw mapOccurrenceError(error);
      return { ...(data as Omit<OccurrenceComment, "usuario">), usuario: null };
    },

    async transition(id, status, justification, returnDate) {
      const { error } = await client.rpc("transicionar_ocorrencia", {
        p_ocorrencia_id: id,
        p_novo_status: status,
        p_justificativa: justification?.trim() || null,
        p_data_retorno: returnDate || null,
      });
      if (error) throw mapOccurrenceError(error);
    },

    async remove(id, justification) {
      const { error } = await client.rpc("remover_ocorrencia", {
        p_ocorrencia_id: id,
        p_justificativa: justification.trim(),
      });
      if (error) throw mapOccurrenceError(error);
    },
  };
}

