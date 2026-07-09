/**
 * Shared authenticated App Shell: composes `Sidebar` + `UserContextPanel`
 * around a route `Outlet`, with desktop responsive constraints
 * (`route-navigation-contract.md` "Desktop Validation").
 *
 * Reads identity/profile/postos only from the `autorizado` state. The Outlet
 * remains mounted while a route revalidation temporarily clears that state,
 * allowing ProtectedRoute to finish the check without a remount loop.
 */
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UserContextPanel } from "./UserContextPanel";
import { useAuth } from "../../modules/auth/AuthProvider";
import { Toaster } from "../shadcn/ui/sonner";
import "./AppShell.css";

export function AppShell() {
  const { state, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("doka.sidebar.collapsed") === "true",
  );

  const context = state.name === "autorizado" ? state.context : null;

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  function toggleSidebar() {
    setCollapsed((current) => {
      localStorage.setItem("doka.sidebar.collapsed", String(!current));
      return !current;
    });
  }

  const segments = location.pathname
    .replace(/^\/app\/?/, "")
    .split("/")
    .filter(Boolean);
  const moduleLabel: Record<string, string> = {
    dashboard: "Dashboard",
    ocorrencias: "Ocorrências",
    "tarefas-rotinas": "Tarefas e Rotinas",
    "assistencias-mms": "Assistências MMS",
    "importacoes-mms": "Importações MMS",
    "custos-extras": "Deslocamentos e Custos",
    cadastros: "Administração",
    "historico-auditoria": "Histórico e Auditoria",
  };
  const title = moduleLabel[segments[0]] ?? "Doka";
  const detail =
    segments.includes("nova") || segments.includes("novo")
      ? "Novo registro"
      : segments.includes("editar")
        ? "Editar"
        : segments.length > 1
          ? "Detalhe"
          : null;

  return (
    <>
      <Toaster position="bottom-right" richColors />
      <div className={`doka-app-shell${collapsed ? " doka-app-shell--collapsed" : ""}`}>
        {context ? (
          <Sidebar
            key="sidebar"
            perfil={context.perfil}
            collapsed={collapsed}
            onToggle={toggleSidebar}
          />
        ) : null}
        <div key="content" className="doka-app-shell__content">
          {context ? (
            <header className="doka-app-shell__header">
              <div className="doka-app-shell__context">
                <strong>{title}</strong>
                {detail ? (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{detail}</span>
                  </>
                ) : null}
              </div>
              <UserContextPanel context={context} onLogout={handleLogout} />
            </header>
          ) : null}
          <main className="doka-app-shell__main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
