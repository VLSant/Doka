import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { DropdownMenu, DropdownMenuItem } from "../../../components/ui/DropdownMenu";
import { Drawer } from "../../../components/ui/Drawer";
import type { AdministrationService } from "../administration-service";
import type {
  AdministrationSnapshot,
  NivelAcessoPosto,
  Posto,
  VinculoUsuarioPosto,
} from "../types";
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
      await onChanged("Vínculo salvo.");
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
    if (!window.confirm("Confirma a remoção lógica deste registro?")) return;
    try {
      if (kind === "post") await service.removePost(id, actorId);
      else await service.removeLink(id, actorId);
      await onChanged(kind === "post" ? "Posto removido." : "Vínculo removido.");
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
              Novo vínculo
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
          <Drawer
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
                label="Código"
                value={post.codigo}
                onChange={(event) => setPost({ ...post, codigo: event.target.value })}
              />
              <TextareaField
                label="Descrição"
                value={post.descricao}
                onChange={(event) => setPost({ ...post, descricao: event.target.value })}
              />
              <Checkbox
                label="Posto ativo"
                checked={post.ativo}
                onChange={(event) => setPost({ ...post, ativo: event.target.checked })}
              />
            </form>
          </Drawer>

          <Drawer
            open={linkOpen}
            title={link.id ? "Editar vínculo" : "Novo vínculo"}
            description="Defina o escopo de acesso do usuário ao posto."
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
                  Salvar vínculo
                </Button>
              </>
            }
          >
            <form id="admin-link-form" className="admin-form" onSubmit={submitLink}>
              <SelectField
                label="Usuário"
                value={link.usuario_id}
                onChange={(event) => setLink({ ...link, usuario_id: event.target.value })}
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
                onChange={(event) => setLink({ ...link, posto_id: event.target.value })}
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
                label="Nível"
                value={link.nivel_acesso}
                onChange={(event) =>
                  setLink({ ...link, nivel_acesso: event.target.value as NivelAcessoPosto })
                }
              >
                <option value="operacional">Operacional</option>
                <option value="supervisao">Supervisão</option>
                <option value="consulta">Consulta</option>
              </SelectField>
            </form>
          </Drawer>
        </>
      )}

      <h3>Postos cadastrados</h3>
      {data.postos.length === 0 ? (
        <p className="admin-empty">Nenhum posto cadastrado.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Código</th>
                <th>Estado</th>
                {canEdit && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {data.postos.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{item.codigo ?? "—"}</td>
                  <td>
                    <StatusBadge active={item.ativo} />
                  </td>
                  {canEdit && (
                    <td className="admin-actions">
                      <DropdownMenu>
                        <DropdownMenuItem onClick={() => editPost(item)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem danger onClick={() => void remove("post", item.id)}>
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Vínculos ativos</h3>
      {data.vinculos.length === 0 ? (
        <p className="admin-empty">Nenhum vínculo cadastrado.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Posto</th>
                <th>Nível</th>
                {canEdit && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {data.vinculos.map((item) => (
                <tr key={item.id}>
                  <td>{data.usuarios.find((user) => user.id === item.usuario_id)?.nome ?? "—"}</td>
                  <td>
                    {data.postos.find((postoItem) => postoItem.id === item.posto_id)?.nome ?? "—"}
                  </td>
                  <td>{item.nivel_acesso}</td>
                  {canEdit && (
                    <td className="admin-actions">
                      <DropdownMenu>
                        <DropdownMenuItem onClick={() => editLink(item)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem danger onClick={() => void remove("link", item.id)}>
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
