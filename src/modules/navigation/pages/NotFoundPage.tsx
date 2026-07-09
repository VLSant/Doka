/**
 * PT-BR page-not-found state with authentication-aware safe return
 * (`route-navigation-contract.md` "Page not found": "PT-BR 404 state. Safe
 * return based on whether the user is authenticated."). Returns to the
 * Dashboard when authorized, otherwise to `/login`.
 */
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { useAuth } from "../../auth/AuthProvider";

export function NotFoundPage() {
  const { state } = useAuth();
  const navigate = useNavigate();

  const isAuthorized = state.name === "autorizado";
  const target = isAuthorized ? "/app/dashboard" : "/login";
  const actionLabel = isAuthorized ? "Voltar ao Dashboard" : "Voltar ao login";

  return (
    <div className="doka-public-state">
      <FeedbackState
        tone="empty"
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi removido."
        actions={<Button onClick={() => navigate(target, { replace: true })}>{actionLabel}</Button>}
      />
    </div>
  );
}
