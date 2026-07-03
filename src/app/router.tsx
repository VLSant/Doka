/**
 * Data Router tree.
 *
 * Establishes public/protected branches with pending/error boundaries.
 * Protected content (`ProtectedRoute`) only ever renders its children when
 * the route guard's outcome is exactly `autorizado` (`protected-loader.ts`,
 * `route-guard.ts`); every other outcome redirects to a safe public/neutral
 * destination, shows a neutral unavailable state, or shows a loading state,
 * so no protected UI/module data can flash before authorization exists.
 *
 * Every `/app/*` destination from `ROUTE_DEFINITIONS` is registered here and
 * passes through the same `ProtectedRoute` gate, including an optional
 * `posto_id` query parameter validated by the route guard
 * (`route-navigation-contract.md` Evaluation Order).
 */
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useNavigation,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { LoadingState } from "../components/feedback/LoadingState";
import { FeedbackState } from "../components/feedback/FeedbackState";
import { AuthProvider } from "../modules/auth/AuthProvider";
import { ProtectedRoute } from "../modules/auth/ProtectedRoute";
import { LoginPage } from "../modules/auth/pages/LoginPage";
import { RecoverPasswordPage } from "../modules/auth/pages/RecoverPasswordPage";
import { ResetPasswordPage } from "../modules/auth/pages/ResetPasswordPage";
import { SessionExpiredPage } from "../modules/auth/pages/SessionExpiredPage";
import { TemporaryFailurePage } from "../modules/auth/pages/TemporaryFailurePage";
import { AccessDeniedPage } from "../modules/access/AccessDeniedPage";
import { OperationalConfigurationPage } from "../modules/access/OperationalConfigurationPage";
import { DashboardPage } from "../modules/navigation/pages/DashboardPage";
import { ModuleUnavailablePage } from "../modules/navigation/pages/ModuleUnavailablePage";
import { NotFoundPage } from "../modules/navigation/pages/NotFoundPage";
import { AppShell } from "../components/layout/AppShell";
import { ROUTE_DEFINITIONS } from "./routes";

const NewImportPage = lazy(() => import("../modules/importacoes-mms/pages/NewImportPage"));
const ImportListPage = lazy(() => import("../modules/importacoes-mms/pages/ImportListPage"));
const ImportDetailPage = lazy(() => import("../modules/importacoes-mms/pages/ImportDetailPage"));
const ImportTreatmentPage = lazy(() => import("../modules/importacoes-mms/pages/ImportTreatmentPage"));
const AssistanceListPage = lazy(() => import("../modules/assistencias-mms/pages/AssistanceListPage"));
const AssistanceDetailPage = lazy(() => import("../modules/assistencias-mms/pages/AssistanceDetailPage"));
const TaskCenterPage = lazy(() => import("../modules/tarefas-rotinas/pages/TaskCenterPage"));
const TaskFormPage = lazy(() => import("../modules/tarefas-rotinas/pages/TaskFormPage"));
const TaskDetailPage = lazy(() => import("../modules/tarefas-rotinas/pages/TaskDetailPage"));
const RoutineListPage = lazy(() => import("../modules/tarefas-rotinas/pages/RoutineListPage"));
const RoutineFormPage = lazy(() => import("../modules/tarefas-rotinas/pages/RoutineFormPage"));

function RootLayout() {
  const navigation = useNavigation();

  if (navigation.state === "loading") {
    return <LoadingState message="Carregando..." />;
  }

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
      description="Não foi possível carregar esta página. Tente novamente em alguns instantes."
    />
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        // Public: accepts any e-mail and always returns the same neutral
        // confirmation (`auth-session-contract.md` Password Recovery
        // Request), so no Auth/context check gates this route.
        path: "recuperar-senha",
        element: <RecoverPasswordPage />,
      },
      {
        // Guarded by `recoveryState` inside `ResetPasswordPage` itself
        // (read from `AuthProvider`, derived only from a `PASSWORD_RECOVERY`
        // Auth event): an invalid/expired/reused link renders a safe failure
        // with a "Solicitar novo link" exit instead of the form
        // (`auth-session-contract.md` Password Recovery Completion).
        path: "redefinir-senha",
        element: <ResetPasswordPage />,
      },
      {
        path: "sessao-expirada",
        element: <SessionExpiredPage />,
      },
      {
        path: "falha-temporaria",
        element: <TemporaryFailurePage />,
      },
      {
        // Reached only through `ProtectedRoute`'s `acesso_negado` redirect;
        // never exposes resource/permission detail (`AccessDeniedPage.tsx`).
        path: "acesso-negado",
        element: <AccessDeniedPage />,
      },
      {
        // Reached only through `ProtectedRoute`'s `contexto_invalido`
        // redirect; groups every sensitive blocked reason into one neutral
        // message (`OperationalConfigurationPage.tsx`).
        path: "configuracao-operacional",
        element: <OperationalConfigurationPage />,
      },
      {
        path: "app",
        element: <AppShell />,
        children: [
          ...ROUTE_DEFINITIONS.map((route) => ({
          path: route.path.replace(/^\/app\//, ""),
          element: (
            <ProtectedRoute routeId={route.id}>
              {route.id === "dashboard" ? (
                <DashboardPage />
              ) : route.id === "tarefas-rotinas" ? (
                <Suspense fallback={<LoadingState message="Carregando tarefas..." />}>
                  <TaskCenterPage />
                </Suspense>
              ) : route.id === "assistencias-mms" ? (
                <Suspense fallback={<LoadingState message="Carregando assistências..." />}>
                  <AssistanceListPage />
                </Suspense>
              ) : route.id === "importacoes-mms" ? (
                <Suspense fallback={<LoadingState message="Carregando importação..." />}>
                  <ImportListPage />
                </Suspense>
              ) : (
                <ModuleUnavailablePage moduleLabel={route.label} />
              )}
            </ProtectedRoute>
          ),
          })),
          {
            path: "tarefas-rotinas/rotinas",
            element: <ProtectedRoute routeId="tarefas-rotinas"><Suspense fallback={<LoadingState message="Carregando rotinas..." />}><RoutineListPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "tarefas-rotinas/rotinas/nova",
            element: <ProtectedRoute routeId="tarefas-rotinas"><Suspense fallback={<LoadingState message="Carregando formulário..." />}><RoutineFormPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "tarefas-rotinas/rotinas/:rotinaId/editar",
            element: <ProtectedRoute routeId="tarefas-rotinas"><Suspense fallback={<LoadingState message="Carregando formulário..." />}><RoutineFormPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "tarefas-rotinas/nova",
            element: <ProtectedRoute routeId="tarefas-rotinas"><Suspense fallback={<LoadingState message="Carregando formulário..." />}><TaskFormPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "tarefas-rotinas/:tarefaId/editar",
            element: <ProtectedRoute routeId="tarefas-rotinas"><Suspense fallback={<LoadingState message="Carregando formulário..." />}><TaskFormPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "tarefas-rotinas/:tarefaId",
            element: <ProtectedRoute routeId="tarefas-rotinas"><Suspense fallback={<LoadingState message="Carregando tarefa..." />}><TaskDetailPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "assistencias-mms/:assistenciaId",
            element: <ProtectedRoute routeId="assistencias-mms"><Suspense fallback={<LoadingState message="Carregando assistência..." />}><AssistanceDetailPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "importacoes-mms/nova",
            element: <ProtectedRoute routeId="importacoes-mms"><Suspense fallback={<LoadingState message="Carregando importação..." />}><NewImportPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "importacoes-mms/:loteId",
            element: <ProtectedRoute routeId="importacoes-mms"><Suspense fallback={<LoadingState message="Carregando lote..." />}><ImportDetailPage /></Suspense></ProtectedRoute>,
          },
          {
            path: "importacoes-mms/:loteId/tratamento",
            element: <ProtectedRoute routeId="importacoes-mms"><Suspense fallback={<LoadingState message="Carregando tratamento..." />}><ImportTreatmentPage /></Suspense></ProtectedRoute>,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
