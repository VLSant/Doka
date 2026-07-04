/**
 * Operational-configuration-unavailable destination shown when the Auth
 * identity is confirmed but the operational context could not be resolved
 * (`route-navigation-contract.md` "Operational configuration unavailable").
 * Per `operational-access-contract.md`, every blocked reason is grouped into
 * a single neutral PT-BR message that never discloses the sensitive
 * internal reason to the end user.
 */
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { FeedbackState } from "../../components/feedback/FeedbackState";
import { useAuth } from "../auth/AuthProvider";

export function OperationalConfigurationPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="doka-public-state">
      <FeedbackState
        tone="neutral"
        title="Configuração operacional indisponível"
        description="Seu acesso precisa de regularização administrativa. Procure a administração."
        actions={
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        }
      />
    </div>
  );
}
