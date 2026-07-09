/**
 * Data Router tree.
 *
 * Establishes public/protected branches with pending/error boundaries.
 * Protected content (`ProtectedRoute`) only renders after the route guard
 * outcome is exactly `autorizado`.
 */
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, Outlet, useParams } from "react-router-dom";
import { FeedbackState } from "../components/feedback/FeedbackState";
import { AppShell } from "../components/layout/AppShell";
import { Skeleton } from "../components/ui/Skeleton";
import { AccessDeniedPage } from "../modules/access/AccessDeniedPage";
import { OperationalConfigurationPage } from "../modules/access/OperationalConfigurationPage";
import { AuthProvider } from "../modules/auth/AuthProvider";
import { ProtectedRoute } from "../modules/auth/ProtectedRoute";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { RecoverPasswordPage } from "../modules/auth/pages/RecoverPasswordPage";
import { ResetPasswordPage } from "../modules/auth/pages/ResetPasswordPage";
import { SessionExpiredPage } from "../modules/auth/pages/SessionExpiredPage";
import { TemporaryFailurePage } from "../modules/auth/pages/TemporaryFailurePage";
import { DashboardPage } from "../modules/navigation/pages/DashboardPage";
import { ModuleUnavailablePage } from "../modules/navigation/pages/ModuleUnavailablePage";
import { NotFoundPage } from "../modules/navigation/pages/NotFoundPage";
import { lazyLoaders } from "./route-prefetch";
import { ROUTE_DEFINITIONS, type RouteId } from "./routes";

const NewImportPage = lazy(lazyLoaders.newImport);
const ImportListPage = lazy(lazyLoaders.importList);
const ImportDetailPage = lazy(lazyLoaders.importDetail);
const ImportTreatmentPage = lazy(lazyLoaders.importTreatment);
const AssistanceListPage = lazy(lazyLoaders.assistanceList);
const AssistanceDetailPage = lazy(lazyLoaders.assistanceDetail);
const TaskCenterPage = lazy(lazyLoaders.taskCenter);
const TaskFormPage = lazy(lazyLoaders.taskForm);
const TaskDetailPage = lazy(lazyLoaders.taskDetail);
const RoutineListPage = lazy(lazyLoaders.routineList);
const RoutineFormPage = lazy(lazyLoaders.routineForm);
const OccurrenceListPage = lazy(lazyLoaders.occurrenceList);
const OccurrenceDetailPage = lazy(lazyLoaders.occurrenceDetail);

/** Deep-links antigos de formulário viram lista com o modal aberto (plano 4.1). */
function RedirectOccurrenceEdit() {
  const { ocorrenciaId } = useParams();
  return <Navigate to={`/app/ocorrencias?editar=${ocorrenciaId}`} replace />;
}
const LancamentoListPage = lazy(lazyLoaders.lancamentoList);
const LancamentoFormPage = lazy(lazyLoaders.lancamentoForm);
const LancamentoDetailPage = lazy(lazyLoaders.lancamentoDetail);
const AdministrationPage = lazy(lazyLoaders.administration);
const AuditHistoryPage = lazy(lazyLoaders.auditHistory);
const ShadcnDesignSystemPage = lazy(lazyLoaders.designSystem);

function RouteFallback({ message }: { message: string }) {
  return <Skeleton message={message} />;
}

function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function RootErrorBoundary() {
  return (
    <FeedbackState
      tone="error"
      title="Algo deu errado"
      description="Nao foi possivel carregar esta pagina. Tente novamente em alguns instantes."
    />
  );
}

function moduleElement(routeId: RouteId, label: string) {
  if (routeId === "dashboard") return <DashboardPage />;
  if (routeId === "ocorrencias") {
    return (
      <Suspense fallback={<RouteFallback message="Carregando ocorrencias..." />}>
        <OccurrenceListPage />
      </Suspense>
    );
  }
  if (routeId === "tarefas-rotinas") {
    return (
      <Suspense fallback={<RouteFallback message="Carregando tarefas..." />}>
        <TaskCenterPage />
      </Suspense>
    );
  }
  if (routeId === "assistencias-mms") {
    return (
      <Suspense fallback={<RouteFallback message="Carregando assistencias..." />}>
        <AssistanceListPage />
      </Suspense>
    );
  }
  if (routeId === "importacoes-mms") {
    return (
      <Suspense fallback={<RouteFallback message="Carregando importacao..." />}>
        <ImportListPage />
      </Suspense>
    );
  }
  if (routeId === "custos-extras") {
    return (
      <Suspense fallback={<RouteFallback message="Carregando lancamentos..." />}>
        <LancamentoListPage />
      </Suspense>
    );
  }
  if (routeId === "cadastros") {
    return (
      <Suspense fallback={<RouteFallback message="Carregando cadastros..." />}>
        <AdministrationPage />
      </Suspense>
    );
  }
  if (routeId === "historico-auditoria") {
    return (
      <Suspense fallback={<RouteFallback message="Carregando historico..." />}>
        <AuditHistoryPage />
      </Suspense>
    );
  }
  return <ModuleUnavailablePage moduleLabel={label} />;
}

function protectedLazy(routeId: RouteId, message: string, element: ReactNode) {
  return (
    <ProtectedRoute routeId={routeId}>
      <Suspense fallback={<RouteFallback message={message} />}>{element}</Suspense>
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "recuperar-senha", element: <RecoverPasswordPage /> },
      { path: "redefinir-senha", element: <ResetPasswordPage /> },
      { path: "sessao-expirada", element: <SessionExpiredPage /> },
      { path: "falha-temporaria", element: <TemporaryFailurePage /> },
      { path: "acesso-negado", element: <AccessDeniedPage /> },
      { path: "configuracao-operacional", element: <OperationalConfigurationPage /> },
      {
        path: "app",
        element: <AppShell />,
        children: [
          ...ROUTE_DEFINITIONS.map((route) => ({
            path: route.path.replace(/^\/app\//, ""),
            element: (
              <ProtectedRoute routeId={route.id}>
                {moduleElement(route.id, route.label)}
              </ProtectedRoute>
            ),
          })),
          {
            path: "ocorrencias/nova",
            element: <Navigate to="/app/ocorrencias?novo=1" replace />,
          },
          {
            path: "ocorrencias/:ocorrenciaId/editar",
            element: <RedirectOccurrenceEdit />,
          },
          {
            path: "ocorrencias/:ocorrenciaId",
            element: protectedLazy("ocorrencias", "Carregando ocorrencia...", <OccurrenceDetailPage />),
          },
          {
            path: "tarefas-rotinas/rotinas",
            element: protectedLazy("tarefas-rotinas", "Carregando rotinas...", <RoutineListPage />),
          },
          {
            path: "tarefas-rotinas/rotinas/nova",
            element: protectedLazy("tarefas-rotinas", "Carregando formulario...", <RoutineFormPage />),
          },
          {
            path: "tarefas-rotinas/rotinas/:rotinaId/editar",
            element: protectedLazy("tarefas-rotinas", "Carregando formulario...", <RoutineFormPage />),
          },
          {
            path: "tarefas-rotinas/nova",
            element: protectedLazy("tarefas-rotinas", "Carregando formulario...", <TaskFormPage />),
          },
          {
            path: "tarefas-rotinas/:tarefaId/editar",
            element: protectedLazy("tarefas-rotinas", "Carregando formulario...", <TaskFormPage />),
          },
          {
            path: "tarefas-rotinas/:tarefaId",
            element: protectedLazy("tarefas-rotinas", "Carregando tarefa...", <TaskDetailPage />),
          },
          {
            path: "custos-extras/novo",
            element: protectedLazy("custos-extras", "Carregando formulario...", <LancamentoFormPage />),
          },
          {
            path: "custos-extras/:lancamentoId/editar",
            element: protectedLazy("custos-extras", "Carregando formulario...", <LancamentoFormPage />),
          },
          {
            path: "custos-extras/:lancamentoId",
            element: protectedLazy("custos-extras", "Carregando lancamento...", <LancamentoDetailPage />),
          },
          {
            path: "assistencias-mms/:assistenciaId",
            element: protectedLazy("assistencias-mms", "Carregando assistencia...", <AssistanceDetailPage />),
          },
          {
            path: "importacoes-mms/nova",
            element: protectedLazy("importacoes-mms", "Carregando importacao...", <NewImportPage />),
          },
          {
            path: "importacoes-mms/:loteId",
            element: protectedLazy("importacoes-mms", "Carregando lote...", <ImportDetailPage />),
          },
          {
            path: "importacoes-mms/:loteId/tratamento",
            element: protectedLazy("importacoes-mms", "Carregando tratamento...", <ImportTreatmentPage />),
          },
          {
            path: "design-system",
            element: protectedLazy("dashboard", "Carregando design system...", <ShadcnDesignSystemPage />),
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
