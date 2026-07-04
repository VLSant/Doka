/**
 * Branded new-password page, guarded by a valid `PASSWORD_RECOVERY`
 * authorization (`auth-session-contract.md` Public Routes: "/redefinir-senha
 * ... Evento/sessao de recovery valida"; Completion: "Expired, malformed or
 * reused recovery authorizations must show a safe failure with an option to
 * request a new link.").
 */
import { useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { useAuth } from "../AuthProvider";
import { ResetPasswordForm } from "../components/ResetPasswordForm";

export function ResetPasswordPage() {
  const { recoveryState, confirmNewPassword } = useAuth();
  const navigate = useNavigate();

  if (recoveryState !== "valido") {
    return (
      <div className="doka-public-state">
        <FeedbackState
          tone="error"
          title="Link de recuperação inválido"
          description="Não foi possível confirmar sua autorização de recuperação de senha. O link pode ter expirado ou já ter sido utilizado."
          actions={
            <Button onClick={() => navigate("/recuperar-senha", { replace: true })}>
              Solicitar novo link
            </Button>
          }
        />
      </div>
    );
  }

  async function handleSubmit(newPassword: string) {
    const result = await confirmNewPassword(newPassword);
    if (result.ok) {
      navigate("/login", { replace: true });
    }
    return result;
  }

  return (
    <div className="doka-login-page">
      <Card className="doka-login-page__card" padding="lg">
        <img
          className="doka-login-page__logo"
          src="/design-system/logos/doka-logo-full.png"
          alt="Doka"
        />
        <h1 className="doka-login-page__title">Definir nova senha</h1>
        <p className="doka-login-page__subtitle">Escolha uma nova senha para continuar.</p>
        <ResetPasswordForm onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
