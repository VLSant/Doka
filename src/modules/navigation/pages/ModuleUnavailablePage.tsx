/**
 * Neutral "Modulo ainda nao disponivel" destination
 * (`route-navigation-contract.md` "Module unavailable": "Module name and
 * neutral availability message only. Safe return to Dashboard."). Never
 * fetches module data or renders module-looking actions/forms
 * (`data-model.md` RouteDefinition Rules: "`placeholder` nao pode buscar
 * dados do modulo ou renderizar acoes falsas.").
 */
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { FeedbackState } from "../../../components/feedback/FeedbackState";

export interface ModuleUnavailablePageProps {
  moduleLabel: string;
}

export function ModuleUnavailablePage({ moduleLabel }: ModuleUnavailablePageProps) {
  const navigate = useNavigate();

  return (
    <div className="doka-public-state">
      <FeedbackState
        tone="empty"
        title={`${moduleLabel} ainda não disponível`}
        description="Este módulo ainda não foi implementado nesta etapa."
        actions={
          <Button onClick={() => navigate("/app/dashboard", { replace: true })}>Voltar ao Dashboard</Button>
        }
      />
    </div>
  );
}
