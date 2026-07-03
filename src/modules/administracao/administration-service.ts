import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import type {
  AdministrationSnapshot,
  CargoInput,
  IdentidadeAuth,
  MetaEficienciaInput,
  NivelAcessoPosto,
  PostoInput,
  PrioridadeInput,
  TipoOcorrenciaInput,
  UsuarioInput,
} from "./types";

type DataResult<T> = { data: T | null; error: { message: string } | null };

export class AdministrationError extends Error {
  readonly code: "falha_temporaria" | "ultimo_admin_protegido" | "duplicado";

  constructor(code: "falha_temporaria" | "ultimo_admin_protegido" | "duplicado", message: string) {
    super(message);
    this.code = code;
  }
}

function errorFor(message?: string): AdministrationError {
  if (message?.includes("ultimo_admin_protegido")) {
    return new AdministrationError(
      "ultimo_admin_protegido",
      "O último usuário de Direção/Administração ativo não pode ser inativado.",
    );
  }
  if (message?.includes("duplicate") || message?.includes("unique")) {
    return new AdministrationError("duplicado", "Já existe um cadastro ativo com esses dados.");
  }
  return new AdministrationError(
    "falha_temporaria",
    "Não foi possível concluir a operação. Tente novamente.",
  );
}

function ensure<T>(result: DataResult<T>): T {
  if (result.error) throw errorFor(result.error.message);
  return result.data as T;
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface AdministrationService {
  load(): Promise<AdministrationSnapshot>;
  listAvailableIdentities(): Promise<IdentidadeAuth[]>;
  saveUser(id: string | null, input: UsuarioInput, actorId: string): Promise<void>;
  savePost(id: string | null, input: PostoInput, actorId: string): Promise<void>;
  removePost(id: string, actorId: string): Promise<void>;
  saveLink(
    id: string | null,
    usuarioId: string,
    postoId: string,
    nivelAcesso: NivelAcessoPosto,
    actorId: string,
  ): Promise<void>;
  removeLink(id: string, actorId: string): Promise<void>;
  saveCargo(id: string | null, input: CargoInput, actorId: string): Promise<void>;
  removeCargo(id: string, actorId: string): Promise<void>;
  savePriority(id: string | null, input: PrioridadeInput, actorId: string): Promise<void>;
  removePriority(id: string, actorId: string): Promise<void>;
  saveOccurrenceType(id: string | null, input: TipoOcorrenciaInput, actorId: string): Promise<void>;
  removeOccurrenceType(id: string, actorId: string): Promise<void>;
  saveEfficiencyTarget(id: string | null, input: MetaEficienciaInput, actorId: string): Promise<void>;
  removeEfficiencyTarget(id: string, actorId: string): Promise<void>;
}

export function createAdministrationService(
  client: SupabaseClient = getSupabaseClient(),
): AdministrationService {
  async function insertOrUpdate(
    table: string,
    id: string | null,
    values: Record<string, unknown>,
    actorId: string,
  ) {
    const result = id
      ? await client
          .from(table)
          .update({ ...values, updated_by: actorId })
          .eq("id", id)
          .is("deleted_at", null)
      : await client.from(table).insert({ ...values, created_by: actorId });
    if (result.error) throw errorFor(result.error.message);
  }

  async function softDelete(table: string, id: string, actorId: string) {
    const { error } = await client
      .from(table)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: actorId,
        delete_reason: "Removido pela administração",
      })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) throw errorFor(error.message);
  }

  return {
    async load() {
      const [usuarios, postos, vinculos, cargos, prioridades, tipos, metas] = await Promise.all([
        client
          .from("usuarios")
          .select("id, auth_user_id, nome, email, perfil, cargo_funcao_id, ativo")
          .is("deleted_at", null)
          .order("nome"),
        client
          .from("postos")
          .select("id, nome, codigo, descricao, ativo")
          .is("deleted_at", null)
          .order("nome"),
        client
          .from("usuarios_postos")
          .select("id, usuario_id, posto_id, nivel_acesso")
          .is("deleted_at", null),
        client
          .from("cargos_funcoes")
          .select("id, nome, descricao, ativo")
          .is("deleted_at", null)
          .order("nome"),
        client
          .from("prioridades")
          .select("id, nome, nivel, cor, ativo")
          .is("deleted_at", null)
          .order("nivel"),
        client
          .from("tipos_ocorrencia")
          .select("id, nome, descricao, ativo")
          .is("deleted_at", null)
          .order("nome"),
        client
          .from("metas_eficiencia")
          .select("id, posto_id, tipo_atividade_normalizado, meta_percentual, vigencia_inicio, vigencia_fim, ativo")
          .is("deleted_at", null)
          .order("vigencia_inicio", { ascending: false }),
      ]);

      return {
        usuarios: ensure(usuarios),
        postos: ensure(postos),
        vinculos: ensure(vinculos),
        cargos: ensure(cargos),
        prioridades: ensure(prioridades),
        tiposOcorrencia: ensure(tipos),
        metasEficiencia: ensure(metas),
      } as AdministrationSnapshot;
    },

    async listAvailableIdentities() {
      const result = await client.rpc("listar_identidades_auth_disponiveis");
      return ensure(result as DataResult<IdentidadeAuth[]>) ?? [];
    },

    async saveUser(id, input, actorId) {
      await insertOrUpdate(
        "usuarios",
        id,
        {
          ...input,
          nome: input.nome.trim(),
          email: input.email.trim().toLowerCase(),
          cargo_funcao_id: input.cargo_funcao_id || null,
        },
        actorId,
      );
    },

    async savePost(id, input, actorId) {
      await insertOrUpdate(
        "postos",
        id,
        {
          nome: input.nome.trim(),
          codigo: input.codigo ? input.codigo.trim() : null,
          descricao: input.descricao ? input.descricao.trim() : null,
          ativo: input.ativo,
        },
        actorId,
      );
    },

    removePost(id, actorId) {
      return softDelete("postos", id, actorId);
    },

    async saveLink(id, usuarioId, postoId, nivelAcesso, actorId) {
      if (id) {
        const { error } = await client
          .from("usuarios_postos")
          .update({ nivel_acesso: nivelAcesso })
          .eq("id", id)
          .is("deleted_at", null);
        if (error) throw errorFor(error.message);
        return;
      }
      const { error } = await client.from("usuarios_postos").insert({
        usuario_id: usuarioId,
        posto_id: postoId,
        nivel_acesso: nivelAcesso,
        created_by: actorId,
      });
      if (error) throw errorFor(error.message);
    },

    removeLink(id, actorId) {
      return softDelete("usuarios_postos", id, actorId);
    },

    async saveCargo(id, input, actorId) {
      await insertOrUpdate(
        "cargos_funcoes",
        id,
        {
          nome: input.nome.trim(),
          descricao: nullable(input.descricao ?? ""),
          ativo: input.ativo,
        },
        actorId,
      );
    },

    removeCargo(id, actorId) {
      return softDelete("cargos_funcoes", id, actorId);
    },

    async savePriority(id, input, actorId) {
      await insertOrUpdate(
        "prioridades",
        id,
        { nome: input.nome.trim(), nivel: input.nivel, cor: input.cor.trim(), ativo: input.ativo },
        actorId,
      );
    },

    removePriority(id, actorId) {
      return softDelete("prioridades", id, actorId);
    },

    async saveOccurrenceType(id, input, actorId) {
      await insertOrUpdate(
        "tipos_ocorrencia",
        id,
        {
          nome: input.nome.trim(),
          descricao: nullable(input.descricao ?? ""),
          ativo: input.ativo,
        },
        actorId,
      );
    },

    removeOccurrenceType(id, actorId) {
      return softDelete("tipos_ocorrencia", id, actorId);
    },

    async saveEfficiencyTarget(id, input, actorId) {
      await insertOrUpdate("metas_eficiencia", id, { ...input }, actorId);
    },

    removeEfficiencyTarget(id, actorId) {
      return softDelete("metas_eficiencia", id, actorId);
    },
  };
}
