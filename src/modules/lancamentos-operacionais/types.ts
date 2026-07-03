import type { PerfilUsuario } from "../access/types";

export type TipoLancamento = "deslocamento" | "custo_extra";
export type StatusLancamento = "pendente" | "validado";

export interface LancamentoFilters {
  data_de?: string;
  data_ate?: string;
  posto_id?: string;
  assistencia_id?: string;
  tipo?: TipoLancamento | "";
  status?: StatusLancamento | "";
  recurso?: string;
}

export interface LancamentoCatalogoItem {
  id: string;
  nome: string;
}

export interface AssistenciaCatalogoItem {
  id: string;
  numero: string;
  cliente: string | null;
  posto_id: string;
}

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  assistencia_id: string | null;
  posto_id: string;
  recurso: string | null;
  data_lancamento: string;
  descricao: string;
  valor: number;
  observacoes: string | null;
  status: StatusLancamento;
  validado_em: string | null;
  created_at: string;
  updated_at: string;
  posto: LancamentoCatalogoItem | null;
  assistencia: { id: string; numero_assistencia: string } | null;
  lancador: LancamentoCatalogoItem | null;
  validador: LancamentoCatalogoItem | null;
}

export interface LancamentoInput {
  tipo: TipoLancamento;
  assistencia_id: string | null;
  posto_id: string;
  recurso: string | null;
  data_lancamento: string;
  descricao: string;
  valor: number;
  observacoes: string | null;
}

export interface LancamentoFormOptions {
  postos: LancamentoCatalogoItem[];
  assistencias: AssistenciaCatalogoItem[];
}

export type LancamentoErrorCode =
  | "acesso_negado"
  | "assistencia_invalida"
  | "falha_temporaria"
  | "justificativa_obrigatoria"
  | "lancamento_validado_imutavel"
  | "transicao_invalida"
  | "valor_invalido";

export interface LancamentoError extends Error {
  code: LancamentoErrorCode;
  retryable: boolean;
}

export function podeGerenciarLancamento(perfil: PerfilUsuario): boolean {
  return perfil === "supervisao" || perfil === "direcao_admin";
}

export function validateLancamentoInput(input: LancamentoInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.posto_id) errors.posto_id = "Selecione o posto.";
  if (!input.data_lancamento) errors.data_lancamento = "Informe a data.";
  if (!input.descricao.trim()) errors.descricao = "Informe a descrição ou o motivo.";
  if (!Number.isFinite(input.valor) || input.valor <= 0) {
    errors.valor = "Informe um valor maior que zero.";
  }
  if (input.tipo === "custo_extra" && !input.assistencia_id) {
    errors.assistencia_id = "Custos extras devem estar vinculados a uma assistência.";
  }
  return errors;
}
