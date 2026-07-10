import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { RowActionsMenu } from "../../../components/ui/RowActionsMenu";
import { TableCardHeader, TableCardList, TableCardRow } from "../../../components/ui/TableCardRow";
import type { AdministrationService } from "../administration-service";
import type {
  AdministrationSnapshot,
  NivelAcessoPosto,
  Posto,
  VinculoUsuarioPosto,
} from "../types";
import { AdminAppModal } from "./AdminAppModal";
import { SelectField, StatusBadge, TextareaField } from "./AdminFields";

interface PostsSectionProps {
  data: AdministrationSnapshot;
  service: AdministrationService;
  actorId: string;
  canEdit: boolean;
  onChanged: (message: string) => Promise<void>;
  onError: (error: unknown) => void;
}

const emptyPost = {
  id: null as string | null,
  nome: "",
  codigo: "",
  descricao: "",
  ativo: true,
};

const emptyLink = {
  id: null as string | null,
  usuario_id: "",
  posto_id: "",
  nivel_acesso: "operacional" as NivelAcessoPosto,
};

export function PostsSection({
  data,
  service,
  actorId,
  canEdit,
  onChanged,
  onError,
}: PostsSectionProps) {
  const [post, setPost] = useState(emptyPost);
  const [link, setLink] = useState(emptyLink);
  const [saving, setSaving] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ kind: "post" | "link"; id: string } | null>(
    null,
  );

  async function submitPost(event: FormEvent) {
    event.preventDefault();
    if (!post.nome.trim()) return;
    setSaving(true);
    try {
      await service.savePost(
        post.id,
        {
          nome: post.nome,
          codigo: post.codigo || null,
          descricao: post.descricao || null,
          ativo: post.ativo,
        },
        actorId,
      );
      setPost(emptyPost);
      setPostOpen(false);
      await onChanged("Posto salvo.");
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  }

  async function submitLink(event: FormEvent) {
    event.preventDefault();
    if (!link.usuario_id || !link.posto_id) return;
    setSaving(true);
    try {
      await service.saveLink(link.id, link.usuario_id, link.posto_id, link.nivel_acesso, actorId);
      setLink(emptyLink);
      setLinkOpen(false);
      await onChanged("Vinculo salvo.");
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  }

  function editPost(item: Posto) {
    setPost({
      id: item.id,
      nome: item.nome,
      codigo: item.codigo ?? "",
      descricao: item.descricao ?? "",
      ativo: item.ativo,
    });
    setPostOpen(true);
  }

  function editLink(item: VinculoUsuarioPosto) {
    setLink({
      id: item.id,
      usuario_id: item.usuario_id,
      posto_id: item.posto_id,
      nivel_acesso: item.nivel_acesso,
    });
    setLinkOpen(true);
  }

  async function remove(kind: "post" | "link", id: string) {
    try {
      if (kind === "post") await service.removePost(id, actorId);
      else await service.removeLink(id, actorId);
      setRemoveTarget(null);
      await onChanged(kind === "post" ? "Posto removido." : "Vinculo removido.");
    } catch (error) {
      onError(error);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-posts-title">
      <div className="admin-section__header">
        <div>
          <h2 id="admin-posts-title">Postos e vínculos</h2>
          <p>Postos operacionais e escopo de acesso de cada usuário.</p>
        </div>
        {canEdit ? (
          <div className="admin-actions">
            <Button
              variant="outline"
              onClick={() => {
                setLink(emptyLink);
                setLinkOpen(true);
              }}
            >
              Novo vinculo
            </Button>
            <Button
              onClick={() => {
                setPost(emptyPost);
                setPostOpen(true);
              }}
            >
              Novo posto
            </Button>
          </div>
        ) : null}
      </div>

      {canEdit && (
        <>
          <AdminAppModal
            open={postOpen}
            title={post.id ? "Editar posto" : "Novo posto"}
            description="Identifique o posto operacional e o seu estado."
            onClose={() => {
              setPostOpen(false);
              setPost(emptyPost);
            }}
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPost(emptyPost);
                    setPostOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" form="admin-post-form" loading={saving}>
                  Salvar posto
                </Button>
              </>
            }
          >
            <form id="admin-post-form" className="admin-form" onSubmit={submitPost}>
              <Input
                label="Nome"
                value={post.nome}
                onChange={(event) => setPost({ ...post, nome: event.target.value })}
                required
              />
              <Input
                label="Codigo"
                value={post.codigo}
                onChange={(event) => setPost({ ...post, codigo: event.target.value })}
              />
              <TextareaField
                label="Descricao"
                value={post.descricao}
                onChange={(event) => setPost({ ...post, descricao: event.target.value })}
              />
              <Checkbox
                label="Posto ativo"
                checked={post.ativo}
                onChange={(event) => setPost({ ...post, ativo: event.target.checked })}
              />
            </form>
          </AdminAppModal>

          <AdminAppModal
            open={linkOpen}
            title={link.id ? "Editar vinculo" : "Novo vinculo"}
            description="Defina o escopo de acesso do usuario ao posto."
            onClose={() => {
              setLinkOpen(false);
              setLink(emptyLink);
            }}
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setLink(emptyLink);
                    setLinkOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" form="admin-link-form" loading={saving}>
                  Salvar vinculo
                </Button>
              </>
            }
          >
            <form id="admin-link-form" className="admin-form" onSubmit={submitLink}>
              <SelectField
                label="Usuario"
                value={link.usuario_id}
                onChange={(next) => setLink({ ...link, usuario_id: next })}
                disabled={Boolean(link.id)}
                required
              >
                <option value="">Selecione</option>
                {data.usuarios
                  .filter((user) => user.ativo)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome}
                    </option>
                  ))}
              </SelectField>
              <SelectField
                label="Posto"
                value={link.posto_id}
                onChange={(next) => setLink({ ...link, posto_id: next })}
                disabled={Boolean(link.id)}
                required
              >
                <option value="">Selecione</option>
                {data.postos
                  .filter((item) => item.ativo)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
              </SelectField>
              <SelectField
                label="Nivel"
                value={link.nivel_acesso}
                onChange={(next) =>
                  setLink({ ...link, nivel_acesso: next as NivelAcessoPosto })
                }
              >
                <option value="operacional">Operacional</option>
                <option value="supervisao">Supervisao</option>
                <option value="consulta">Consulta</option>
              </SelectField>
            </form>
          </AdminAppModal>
        </>
      )}

      <h3>Postos cadastrados</h3>
      {data.postos.length === 0 ? (
        <p className="admin-empty">Nenhum posto cadastrado.</p>
      ) : (
        <TableCardList>
          <TableCardHeader
            selectable={false}
            actions={canEdit}
            columns={[
              { key: "nome", label: "Nome", width: "minmax(180px, 1fr)" },
              { key: "codigo", label: "Codigo", width: "120px" },
              { key: "estado", label: "Estado", width: "90px" },
            ]}
          />
          {data.postos.map((item) => (
            <TableCardRow
              key={item.id}
              id={item.id}
              selectable={false}
              columns={[
                { key: "nome", label: "Nome", width: "minmax(180px, 1fr)", value: <strong>{item.nome}</strong> },
                { key: "codigo", label: "Codigo", width: "120px", value: item.codigo ?? "-" },
                { key: "estado", label: "Estado", width: "90px", value: <StatusBadge active={item.ativo} /> },
              ]}
              actions={
                canEdit ? (
                  <RowActionsMenu
                    onEdit={() => editPost(item)}
                    onRemove={() => setRemoveTarget({ kind: "post", id: item.id })}
                  />
                ) : undefined
              }
            />
          ))}
        </TableCardList>
      )}

      <h3>Vinculos ativos</h3>
      {data.vinculos.length === 0 ? (
        <p className="admin-empty">Nenhum vinculo cadastrado.</p>
      ) : (
        <TableCardList>
          <TableCardHeader
            selectable={false}
            actions={canEdit}
            columns={[
              { key: "usuario", label: "Usuario", width: "minmax(180px, 1fr)" },
              { key: "posto", label: "Posto", width: "minmax(160px, 1fr)" },
              { key: "nivel", label: "Nivel", width: "130px" },
            ]}
          />
          {data.vinculos.map((item) => (
            <TableCardRow
              key={item.id}
              id={item.id}
              selectable={false}
              columns={[
                {
                  key: "usuario",
                  label: "Usuario",
                  width: "minmax(180px, 1fr)",
                  value: <strong>{data.usuarios.find((user) => user.id === item.usuario_id)?.nome ?? "-"}</strong>,
                },
                {
                  key: "posto",
                  label: "Posto",
                  width: "minmax(160px, 1fr)",
                  value: data.postos.find((postoItem) => postoItem.id === item.posto_id)?.nome ?? "-",
                },
                { key: "nivel", label: "Nivel", width: "130px", value: item.nivel_acesso },
              ]}
              actions={
                canEdit ? (
                  <RowActionsMenu
                    onEdit={() => editLink(item)}
                    onRemove={() => setRemoveTarget({ kind: "link", id: item.id })}
                  />
                ) : undefined
              }
            />
          ))}
        </TableCardList>
      )}
      <RemovalAlertDialog
        open={Boolean(removeTarget)}
        title="Remover registro"
        description="Esta acao remove logicamente o registro administrativo selecionado."
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={() => {
          if (removeTarget) void remove(removeTarget.kind, removeTarget.id);
        }}
      />
    </section>
  );
}
