export interface AuditUser {
  id: string;
  nome: string;
  email: string;
}

export interface AuditPost {
  id: string;
  nome: string;
}

export interface AuditEvent {
  id: string;
  entidade_tipo: string;
  entidade_id: string | null;
  acao: string;
  valor_anterior: Record<string, unknown> | null;
  valor_novo: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  usuario_id: string | null;
  lote_importacao_id: string | null;
  created_at: string;
  usuario: AuditUser | null;
}

export interface AuditFilters {
  usuarioId?: string;
  entidadeTipo?: string;
  acao?: string;
  postoId?: string;
  dataDe?: string;
  dataAte?: string;
}

export interface AuditCatalogs {
  usuarios: AuditUser[];
  postos: AuditPost[];
}
