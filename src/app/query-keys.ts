import type { DashboardFilters } from "../modules/dashboard/types";
import type { AssistanceFilters } from "../modules/assistencias-mms/types";
import type { LancamentoFilters } from "../modules/lancamentos-operacionais/types";
import type { TaskFilters } from "../modules/tarefas-rotinas/types";
import type { AuditFilters } from "../modules/auditoria/types";
import type { LotFilters } from "../modules/importacoes-mms/types";

export const queryKeys = {
  administration: {
    all: ["administration"] as const,
    snapshot: () => ["administration", "snapshot"] as const,
    identities: () => ["administration", "identities"] as const,
  },
  audit: {
    entity: (entityType: string, entityId: string) =>
      ["audit", "entity", entityType, entityId] as const,
    history: (filters?: AuditFilters) => ["audit", "history", filters ?? {}] as const,
    catalogs: () => ["audit", "catalogs"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    data: (filters: DashboardFilters) => ["dashboard", "data", filters] as const,
    postos: () => ["dashboard", "postos"] as const,
  },
  importacoes: {
    all: ["importacoes-mms"] as const,
    lots: (filters?: LotFilters) => ["importacoes-mms", "lots", filters ?? {}] as const,
    lot: (id: string) => ["importacoes-mms", "lot", id] as const,
    treatment: (id: string) => ["importacoes-mms", "treatment", id] as const,
    lotItems: (id: string, kind: string) => ["importacoes-mms", "lot", id, "items", kind] as const,
  },
  assistencias: {
    all: ["assistencias-mms"] as const,
    list: (filters?: AssistanceFilters) => ["assistencias-mms", "list", filters ?? {}] as const,
    detail: (id: string, includeRemoved = false) =>
      ["assistencias-mms", "detail", id, includeRemoved] as const,
  },
  lancamentos: {
    all: ["lancamentos"] as const,
    list: (filters: LancamentoFilters) => ["lancamentos", "list", filters] as const,
    detail: (id: string) => ["lancamentos", "detail", id] as const,
    options: () => ["lancamentos", "options"] as const,
  },
  occurrences: {
    all: ["occurrences"] as const,
    list: () => ["occurrences", "list"] as const,
    detail: (id: string) => ["occurrences", "detail", id] as const,
    catalogs: () => ["occurrences", "catalogs"] as const,
  },
  taskCatalogs: () => ["tasks", "catalogs"] as const,
  tasks: {
    all: ["tasks"] as const,
    list: (filters?: Partial<TaskFilters>) => ["tasks", "list", filters ?? {}] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  routines: {
    all: ["routines"] as const,
    list: () => ["routines", "list"] as const,
    detail: (id: string) => ["routines", "detail", id] as const,
  },
};
