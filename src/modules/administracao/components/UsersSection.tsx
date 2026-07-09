import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { Drawer } from "../../../components/ui/Drawer";
import { TableFrame } from "../../../components/ui/Patterns";
import type { AdministrationService } from "../administration-service";
import type {
  AdministrationSnapshot,
  PerfilUsuario,
  UsuarioOperacional,
} from "../types";
import { SelectField, StatusBadge } from "./AdminFields";

interface UsersSectionProps {
  data: AdministrationSnapshot;
  service: AdministrationService;
  actorId: string;
  canEdit: boolean;
  onChanged: (message: string) => Promise<void>;
  onError: (error: unknown) => void;
}

const emptyForm = {
  id: null as string | null,
  auth_user_id: "",
  nome: "",
  email: "",
  perfil: "operador" as PerfilUsuario,
  cargo_funcao_id: "",
  ativo: true,
};

export function UsersSection({
  data,
  service,
  actorId,
  canEdit,
  onChanged,
  onError,
}: UsersSectionProps) {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const identitiesQuery = useQuery({
    queryKey: queryKeys.administration.identities(),
    queryFn: () => service.listAvailableIdentities(),
    enabled: canEdit,
  });
  const identities = identitiesQuery.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return data.usuarios;
    return data.usuarios.filter(
      (user) =>
        user.nome.toLocaleLowerCase("pt-BR").includes(term) ||
        user.email.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [data.usuarios, search]);

  function edit(user: UsuarioOperacional) {
    setForm({
      id: user.id,
      auth_user_id: user.auth_user_id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      cargo_funcao_id: user.cargo_funcao_id ?? "",
      ativo: user.ativo,
    });
    setFormOpen(true);
  }

  function pickIdentity(id: string) {
    const identity = identities.find((item) => item.auth_user_id === id);
    setForm((current) => ({
      ...current,
      auth_user_id: id,
      email: identity?.email ?? "",
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.auth_user_id) return;
    setSaving(true);
    try {
      await service.saveUser(
        form.id,
        {
          auth_user_id: form.auth_user_id,
          nome: form.nome,
          email: form.email,
          perfil: form.perfil,
          cargo_funcao_id: form.cargo_funcao_id || null,
          ativo: form.ativo,
        },
        actorId,
      );
      setForm(emptyForm);
      setFormOpen(false);
      await onChanged("Usuário salvo.");
    } catch (error) {
      onError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-users-title">
      <div className="admin-section__header">
        <div>
          <h2 id="admin-users-title">Usuários operacionais</h2>
          <p>Associação de identidades existentes, perfil, cargo e estado operacional.</p>
        </div>
        <Input
          label="Pesquisar usuário"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome ou e-mail"
        />
        {canEdit ? (
          <Button
            onClick={() => {
              setForm(emptyForm);
              setFormOpen(true);
            }}
          >
            Novo usuário
          </Button>
        ) : null}
      </div>

      {canEdit && (
        <Drawer
          open={formOpen}
          title={form.id ? "Editar usuário" : "Novo usuário"}
          description="Associe uma identidade existente e defina perfil, cargo e estado."
          onClose={() => {
            setFormOpen(false);
            setForm(emptyForm);
          }}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setForm(emptyForm);
                  setFormOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" form="admin-user-form" loading={saving}>
                {form.id ? "Atualizar" : "Associar usuário"}
              </Button>
            </>
          }
        >
          <form id="admin-user-form" className="admin-form" onSubmit={submit}>
            {!form.id && (
              <SelectField
                label="Identidade Auth"
                value={form.auth_user_id}
                onChange={(event) => pickIdentity(event.target.value)}
                required
              >
                <option value="">Selecione</option>
                {identities.map((identity) => (
                  <option key={identity.auth_user_id} value={identity.auth_user_id}>
                    {identity.email}
                  </option>
                ))}
              </SelectField>
            )}
            <Input
              label="Nome"
              value={form.nome}
              onChange={(event) => setForm({ ...form, nome: event.target.value })}
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              disabled={Boolean(form.auth_user_id)}
              required
            />
            <SelectField
              label="Perfil"
              value={form.perfil}
              onChange={(event) =>
                setForm({ ...form, perfil: event.target.value as PerfilUsuario })
              }
            >
              <option value="operador">Operador</option>
              <option value="supervisao">Supervisão</option>
              <option value="direcao_admin">Direção/Administração</option>
            </SelectField>
            <SelectField
              label="Cargo/função"
              value={form.cargo_funcao_id}
              onChange={(event) => setForm({ ...form, cargo_funcao_id: event.target.value })}
            >
              <option value="">Sem cargo</option>
              {data.cargos
                .filter((cargo) => cargo.ativo)
                .map((cargo) => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nome}
                  </option>
                ))}
            </SelectField>
            <Checkbox
              label="Usuário ativo"
              checked={form.ativo}
              onChange={(event) => setForm({ ...form, ativo: event.target.checked })}
            />
          </form>
        </Drawer>
      )}

      {filtered.length === 0 ? (
        <p className="admin-empty">Nenhum usuário encontrado.</p>
      ) : (
        <TableFrame>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Cargo</th>
                <th>Estado</th>
                {canEdit && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>{user.perfil.replace("_", " / ")}</td>
                  <td>
                    {data.cargos.find((cargo) => cargo.id === user.cargo_funcao_id)?.nome ?? "—"}
                  </td>
                  <td>
                    <StatusBadge active={user.ativo} />
                  </td>
                  {canEdit && (
                    <td>
                      <Button size="sm" variant="outline" onClick={() => edit(user)}>
                        Editar
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      )}
    </section>
  );
}
