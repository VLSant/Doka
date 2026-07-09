import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../app/query-keys";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { RowActionsMenu } from "../../../components/ui/RowActionsMenu";
import { TableCardHeader, TableCardList, TableCardRow } from "../../../components/ui/TableCardRow";
import type { AdministrationService } from "../administration-service";
import type { AdministrationSnapshot, PerfilUsuario, UsuarioOperacional } from "../types";
import { AdminAppModal } from "./AdminAppModal";
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
      await onChanged("Usuario salvo.");
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
          <h2 id="admin-users-title">Usuarios operacionais</h2>
          <p>Associacao de identidades existentes, perfil, cargo e estado operacional.</p>
        </div>
        <Input
          label="Pesquisar usuario"
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
            Novo usuario
          </Button>
        ) : null}
      </div>

      {canEdit && (
        <AdminAppModal
          open={formOpen}
          title={form.id ? "Editar usuario" : "Novo usuario"}
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
                {form.id ? "Atualizar" : "Associar usuario"}
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
              <option value="supervisao">Supervisao</option>
              <option value="direcao_admin">Direcao/Administracao</option>
            </SelectField>
            <SelectField
              label="Cargo/funcao"
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
              label="Usuario ativo"
              checked={form.ativo}
              onChange={(event) => setForm({ ...form, ativo: event.target.checked })}
            />
          </form>
        </AdminAppModal>
      )}

      {filtered.length === 0 ? (
        <p className="admin-empty">Nenhum usuario encontrado.</p>
      ) : (
        <TableCardList>
          <TableCardHeader
            selectable={false}
            actions={canEdit}
            columns={[
              { key: "nome", label: "Nome", width: "minmax(170px, 1.2fr)" },
              { key: "email", label: "E-mail", width: "minmax(190px, 1.3fr)" },
              { key: "perfil", label: "Perfil", width: "140px" },
              { key: "cargo", label: "Cargo", width: "150px" },
              { key: "estado", label: "Estado", width: "95px" },
            ]}
          />
          {filtered.map((user) => (
            <TableCardRow
              key={user.id}
              id={user.id}
              selectable={false}
              columns={[
                {
                  key: "nome",
                  label: "Nome",
                  width: "minmax(170px, 1.2fr)",
                  value: <strong>{user.nome}</strong>,
                },
                { key: "email", label: "E-mail", width: "minmax(190px, 1.3fr)", value: user.email },
                {
                  key: "perfil",
                  label: "Perfil",
                  width: "140px",
                  value: user.perfil.replace("_", " / "),
                },
                {
                  key: "cargo",
                  label: "Cargo",
                  width: "150px",
                  value: data.cargos.find((cargo) => cargo.id === user.cargo_funcao_id)?.nome ?? "-",
                },
                {
                  key: "estado",
                  label: "Estado",
                  width: "95px",
                  value: <StatusBadge active={user.ativo} />,
                },
              ]}
              actions={canEdit ? <RowActionsMenu onEdit={() => edit(user)} /> : undefined}
            />
          ))}
        </TableCardList>
      )}
    </section>
  );
}
