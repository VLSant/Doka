import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { AdministrationService } from "../administration-service";
import type {
  AdministrationSnapshot,
  NivelAcessoPosto,
  Posto,
  VinculoUsuarioPosto,
} from "../types";
import { Field, SelectField, StatusBadge, TextareaField } from "./AdminFields";

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
  }

  function editLink(item: VinculoUsuarioPosto) {
    setLink({
      id: item.id,
      usuario_id: item.usuario_id,
      posto_id: item.posto_id,
      nivel_acesso: item.nivel_acesso,
    });
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
      </div>

      {canEdit && (
        <div className="admin-split">
          <form className="admin-form admin-form--card" onSubmit={submitPost}>
            <h3>{post.id ? "Editar posto" : "Novo posto"}</h3>
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
            <Field label="Estado">
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={post.ativo}
                  onChange={(event) => setPost({ ...post, ativo: event.target.checked })}
                />
                Posto ativo
              </label>
            </Field>
            <div className="admin-form__actions">
              <Button type="submit" loading={saving}>
                Salvar posto
              </Button>
              {post.id && (
                <Button variant="ghost" onClick={() => setPost(emptyPost)}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          <form className="admin-form admin-form--card" onSubmit={submitLink}>
            <h3>{link.id ? "Editar vínculo" : "Novo vínculo"}</h3>
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
            <div className="admin-form__actions">
              <Button type="submit" loading={saving}>
                Salvar vínculo
              </Button>
              {link.id && (
                <Button variant="ghost" onClick={() => setLink(emptyLink)}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </div>
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
                      <Button size="sm" variant="outline" onClick={() => editPost(item)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void remove("post", item.id)}
                      >
                        Remover
                      </Button>
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
                      <Button size="sm" variant="outline" onClick={() => editLink(item)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void remove("link", item.id)}
                      >
                        Remover
                      </Button>
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
