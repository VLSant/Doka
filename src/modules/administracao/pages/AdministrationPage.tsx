import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { FeedbackState } from "../../../components/feedback/FeedbackState";
import { LoadingState } from "../../../components/feedback/LoadingState";
import { Page, PageHeader } from "../../../components/layout/Page";
import { Tabs } from "../../../components/ui/Tabs";
import { useToast } from "../../../components/ui/Toast";
import { useAuth } from "../../auth/AuthProvider";
import {
  AdministrationError,
  createAdministrationService,
  type AdministrationService,
} from "../administration-service";
import { PostsSection } from "../components/PostsSection";
import { RegistriesSection } from "../components/RegistriesSection";
import { UsersSection } from "../components/UsersSection";
import { EfficiencyTargetsSection } from "../components/EfficiencyTargetsSection";
import type { AdministrationSnapshot } from "../types";
import "./AdministrationPage.css";

type Section = "usuarios" | "postos" | "cadastros" | "metas";

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
  const toast = useToast();

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

  const onError = useCallback(
    (cause: unknown) => {
      const message =
        cause instanceof AdministrationError
          ? cause.message
          : "Não foi possível concluir a operação.";
      setError(message);
      toast(message, "error");
    },
    [toast],
  );

  const onChanged = useCallback(
    async (message: string) => {
      setError("");
      toast(message, "success");
      await load();
    },
    [load, toast],
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
    <Page className="administration-page" width="wide">
      <PageHeader
        eyebrow="Configuração operacional"
        title="Administração"
        description={
          canEdit
            ? "Mantenha usuários, postos e cadastros essenciais."
            : "Consulta dos cadastros autorizados para o seu escopo."
        }
        actions={
          <Button variant="outline" loading={loading} onClick={() => void load()}>
            Atualizar
          </Button>
        }
      />

      <Tabs
        label="Seções administrativas"
        value={section}
        items={[
          { id: "usuarios", label: "Usuários" },
          { id: "postos", label: "Postos e vínculos" },
          { id: "cadastros", label: "Cadastros auxiliares" },
          { id: "metas", label: "Metas de eficiência" },
        ]}
        onChange={setSection}
      />

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
      {section === "metas" && (
        <EfficiencyTargetsSection
          data={data}
          service={service}
          actorId={actorId}
          canEdit={canEdit}
          onChanged={onChanged}
          onError={onError}
        />
      )}
    </Page>
  );
}
