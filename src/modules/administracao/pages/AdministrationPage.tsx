import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { useAuth } from "../../auth/AuthProvider";
import {
  AdministrationError,
  createAdministrationService,
  type AdministrationService,
} from "../administration-service";
import { PostsSection } from "../components/PostsSection";
import { RegistriesSection } from "../components/RegistriesSection";
import { UsersSection } from "../components/UsersSection";
import type { AdministrationSnapshot } from "../types";
import "./AdministrationPage.css";

type Section = "usuarios" | "postos" | "cadastros";

export interface AdministrationPageProps {
  service?: AdministrationService;
}

export function AdministrationPage({ service: serviceOverride }: AdministrationPageProps) {
  const { state } = useAuth();
  const service = useMemo(
    () => serviceOverride ?? createAdministrationService(),
    [serviceOverride],
  );
  const [section, setSection] = useState<Section>("usuarios");
  const [data, setData] = useState<AdministrationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await service.load());
    } catch {
      setError("Não foi possível carregar os cadastros administrativos.");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    let active = true;
    void service
      .load()
      .then((snapshot) => {
        if (active) setData(snapshot);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os cadastros administrativos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service]);

  const onError = useCallback((cause: unknown) => {
    setNotice("");
    setError(
      cause instanceof AdministrationError
        ? cause.message
        : "Não foi possível concluir a operação.",
    );
  }, []);

  const onChanged = useCallback(
    async (message: string) => {
      setNotice(message);
      setError("");
      await load();
    },
    [load],
  );

  if (state.name !== "autorizado") {
    return <LoadingState message="Validando acesso administrativo..." />;
  }

  const actorId = state.context.usuarioId;
  const canEdit = state.context.perfil === "direcao_admin";

  if (loading && !data) return <LoadingState message="Carregando administração..." />;

  if (!data) {
    return (
      <FeedbackState
        tone="error"
        title="Administração indisponível"
        description={error}
        actions={<Button onClick={() => void load()}>Tentar novamente</Button>}
      />
    );
  }

  return (
    <main className="administration-page">
      <header className="administration-page__header">
        <div>
          <p className="administration-page__eyebrow">Configuração operacional</p>
          <h1>Administração</h1>
          <p>
            {canEdit
              ? "Mantenha usuários, postos e cadastros essenciais."
              : "Consulta dos cadastros autorizados para o seu escopo."}
          </p>
        </div>
        <Button variant="outline" loading={loading} onClick={() => void load()}>
          Atualizar
        </Button>
      </header>

      <nav className="administration-page__tabs" aria-label="Seções administrativas">
        <Tab active={section === "usuarios"} onClick={() => setSection("usuarios")}>
          Usuários
        </Tab>
        <Tab active={section === "postos"} onClick={() => setSection("postos")}>
          Postos e vínculos
        </Tab>
        <Tab active={section === "cadastros"} onClick={() => setSection("cadastros")}>
          Cadastros auxiliares
        </Tab>
      </nav>

      {notice && (
        <p className="administration-page__notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className="administration-page__error" role="alert">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => setError("")}>
            Fechar
          </Button>
        </div>
      )}

      {section === "usuarios" && (
        <UsersSection
          data={data}
          service={service}
          actorId={actorId}
          canEdit={canEdit}
          onChanged={onChanged}
          onError={onError}
        />
      )}
      {section === "postos" && (
        <PostsSection
          data={data}
          service={service}
          actorId={actorId}
          canEdit={canEdit}
          onChanged={onChanged}
          onError={onError}
        />
      )}
      {section === "cadastros" && (
        <RegistriesSection
          data={data}
          service={service}
          actorId={actorId}
          canEdit={canEdit}
          onChanged={onChanged}
          onError={onError}
        />
      )}
    </main>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      className={`administration-page__tab${active ? " administration-page__tab--active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
