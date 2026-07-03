import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import type { AuditCatalogs, AuditEvent, AuditFilters } from "./types";

const EVENT_SELECT =
  "id,entidade_tipo,entidade_id,acao,valor_anterior,valor_novo,metadata,usuario_id,lote_importacao_id,created_at,usuario:usuarios!historico_auditoria_usuario_id_fkey(id,nome,email)";

export interface AuditService {
  list(filters?: AuditFilters): Promise<AuditEvent[]>;
  entity(entidadeTipo: string, entidadeId: string): Promise<AuditEvent[]>;
  catalogs(): Promise<AuditCatalogs>;
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function createAuditHistoryService(
  client: SupabaseClient = getSupabaseClient(),
): AuditService {
  async function list(filters: AuditFilters = {}) {
    let query = client
      .from("historico_auditoria")
      .select(EVENT_SELECT)
      .order("created_at", { ascending: false })
      .limit(200);
    if (filters.usuarioId) query = query.eq("usuario_id", filters.usuarioId);
    if (filters.entidadeTipo) query = query.eq("entidade_tipo", filters.entidadeTipo);
    if (filters.acao) query = query.ilike("acao", `%${filters.acao.trim()}%`);
    if (filters.postoId) query = query.eq("metadata->>posto_id", filters.postoId);
    if (filters.dataDe) query = query.gte("created_at", `${filters.dataDe}T00:00:00-03:00`);
    if (filters.dataAte) query = query.lt("created_at", `${nextDate(filters.dataAte)}T00:00:00-03:00`);
    const { data, error } = await query;
    if (error) throw new Error("Não foi possível consultar o histórico.");
    return (data ?? []) as unknown as AuditEvent[];
  }

  return {
    list,
    async entity(entidadeTipo, entidadeId) {
      const { data, error } = await client
        .from("historico_auditoria")
        .select(EVENT_SELECT)
        .eq("entidade_tipo", entidadeTipo)
        .eq("entidade_id", entidadeId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error("Não foi possível consultar o histórico deste registro.");
      return (data ?? []) as unknown as AuditEvent[];
    },
    async catalogs() {
      const [usuarios, postos] = await Promise.all([
        client.from("usuarios").select("id,nome,email").is("deleted_at", null).order("nome"),
        client.from("postos").select("id,nome").is("deleted_at", null).order("nome"),
      ]);
      if (usuarios.error || postos.error) throw new Error("Não foi possível carregar os filtros.");
      return {
        usuarios: (usuarios.data ?? []) as AuditCatalogs["usuarios"],
        postos: (postos.data ?? []) as AuditCatalogs["postos"],
      };
    },
  };
}
