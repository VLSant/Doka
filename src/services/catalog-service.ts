/**
 * Catálogos compartilhados pelos módulos operacionais (postos, prioridades,
 * cargos/funções, tipos de ocorrência e usuários ativos). Consultas diretas
 * sob RLS: cada perfil enxerga apenas o que as policies permitem.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";

export interface CatalogItem {
  id: string;
  nome: string;
}

export interface PrioridadeItem extends CatalogItem {
  nivel: number;
  cor: string;
}

export interface UsuarioItem extends CatalogItem {
  perfil: string;
}

export interface CatalogService {
  postos(): Promise<CatalogItem[]>;
  prioridades(): Promise<PrioridadeItem[]>;
  cargosFuncoes(): Promise<CatalogItem[]>;
  tiposOcorrencia(): Promise<CatalogItem[]>;
  usuariosAtivos(): Promise<UsuarioItem[]>;
}

function fail(context: string, message?: string): never {
  throw new Error(`Não foi possível carregar ${context}.${message ? ` (${message})` : ""}`);
}

export function createCatalogService(
  client: SupabaseClient = getSupabaseClient(),
): CatalogService {
  return {
    async postos() {
      const { data, error } = await client
        .from("postos")
        .select("id, nome")
        .is("deleted_at", null)
        .eq("ativo", true)
        .order("nome");
      if (error) fail("os postos", error.message);
      return (data ?? []) as CatalogItem[];
    },
    async prioridades() {
      const { data, error } = await client
        .from("prioridades")
        .select("id, nome, nivel, cor")
        .is("deleted_at", null)
        .eq("ativo", true)
        .order("nivel");
      if (error) fail("as prioridades", error.message);
      return (data ?? []) as PrioridadeItem[];
    },
    async cargosFuncoes() {
      const { data, error } = await client
        .from("cargos_funcoes")
        .select("id, nome")
        .is("deleted_at", null)
        .eq("ativo", true)
        .order("nome");
      if (error) fail("os cargos/funções", error.message);
      return (data ?? []) as CatalogItem[];
    },
    async tiposOcorrencia() {
      const { data, error } = await client
        .from("tipos_ocorrencia")
        .select("id, nome")
        .is("deleted_at", null)
        .eq("ativo", true)
        .order("nome");
      if (error) fail("os tipos de ocorrência", error.message);
      return (data ?? []) as CatalogItem[];
    },
    async usuariosAtivos() {
      const { data, error } = await client
        .from("usuarios")
        .select("id, nome, perfil")
        .is("deleted_at", null)
        .eq("ativo", true)
        .order("nome");
      if (error) fail("os usuários", error.message);
      return (data ?? []) as UsuarioItem[];
    },
  };
}
