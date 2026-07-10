import type { RouteId } from "./routes";

export const lazyLoaders = {
  newImport: () => import("../modules/importacoes-mms/pages/NewImportPage"),
  importList: () => import("../modules/importacoes-mms/pages/ImportListPage"),
  importDetail: () => import("../modules/importacoes-mms/pages/ImportDetailPage"),
  importTreatment: () => import("../modules/importacoes-mms/pages/ImportTreatmentPage"),
  assistanceList: () => import("../modules/assistencias-mms/pages/AssistanceListPage"),
  assistanceDetail: () => import("../modules/assistencias-mms/pages/AssistanceDetailPage"),
  taskCenter: () => import("../modules/tarefas-rotinas/pages/TaskCenterPage"),
  taskDetail: () => import("../modules/tarefas-rotinas/pages/TaskDetailPage"),
  routineList: () => import("../modules/tarefas-rotinas/pages/RoutineListPage"),
  occurrenceList: () => import("../modules/ocorrencias/pages/OccurrenceListPage"),
  occurrenceForm: () => import("../modules/ocorrencias/pages/OccurrenceFormPage"),
  occurrenceDetail: () => import("../modules/ocorrencias/pages/OccurrenceDetailPage"),
  lancamentoList: () => import("../modules/lancamentos-operacionais/pages/LancamentoListPage"),
  lancamentoForm: () => import("../modules/lancamentos-operacionais/pages/LancamentoFormPage"),
  lancamentoDetail: () => import("../modules/lancamentos-operacionais/pages/LancamentoDetailPage"),
  administration: () =>
    import("../modules/administracao/pages/AdministrationPage").then((module) => ({
      default: module.AdministrationPage,
    })),
  auditHistory: () => import("../modules/auditoria/pages/AuditHistoryPage"),
  designSystem: () => import("../modules/design-system/pages/ShadcnDesignSystemPage"),
};

const routePrefetchers: Partial<Record<RouteId, () => Promise<unknown>>> = {
  ocorrencias: lazyLoaders.occurrenceList,
  "tarefas-rotinas": lazyLoaders.taskCenter,
  "assistencias-mms": lazyLoaders.assistanceList,
  "importacoes-mms": lazyLoaders.importList,
  "custos-extras": lazyLoaders.lancamentoList,
  cadastros: lazyLoaders.administration,
  "historico-auditoria": lazyLoaders.auditHistory,
};

export function prefetchRouteChunk(routeId: RouteId) {
  void routePrefetchers[routeId]?.();
}
