import type { NivelAcessoPosto, PerfilUsuario } from "../access/types";

export type { NivelAcessoPosto, PerfilUsuario };

export interface IdentidadeAuth {
  auth_user_id: string;
  email: string;
  criado_em: string;
}

export interface CargoFuncao {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface Posto {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  ativo: boolean;
}

export interface UsuarioOperacional {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  cargo_funcao_id: string | null;
  ativo: boolean;
}

export interface VinculoUsuarioPosto {
  id: string;
  usuario_id: string;
  posto_id: string;
  nivel_acesso: NivelAcessoPosto;
}

export interface Prioridade {
  id: string;
  nome: string;
  nivel: number;
  cor: string;
  ativo: boolean;
}

export interface TipoOcorrencia {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface AdministrationSnapshot {
  usuarios: UsuarioOperacional[];
  postos: Posto[];
  vinculos: VinculoUsuarioPosto[];
  cargos: CargoFuncao[];
  prioridades: Prioridade[];
  tiposOcorrencia: TipoOcorrencia[];
}

export interface UsuarioInput {
  auth_user_id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  cargo_funcao_id: string | null;
  ativo: boolean;
}

export interface PostoInput {
  nome: string;
  codigo: string | null;
  descricao: string | null;
  ativo: boolean;
}

export interface CargoInput {
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface PrioridadeInput {
  nome: string;
  nivel: number;
  cor: string;
  ativo: boolean;
}

export interface TipoOcorrenciaInput {
  nome: string;
  descricao: string | null;
  ativo: boolean;
}
