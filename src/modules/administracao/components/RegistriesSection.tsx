import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { AdministrationService } from "../administration-service";
import type { AdministrationSnapshot } from "../types";
import { Field, StatusBadge, TextareaField } from "./AdminFields";

interface RegistriesSectionProps {
  data: AdministrationSnapshot;
  service: AdministrationService;
  actorId: string;
  canEdit: boolean;
  onChanged: (message: string) => Promise<void>;
  onError: (error: unknown) => void;
}

export function RegistriesSection(props: RegistriesSectionProps) {
  return (
    <section className="admin-section" aria-labelledby="admin-registries-title">
      <div className="admin-section__header">
        <div>
          <h2 id="admin-registries-title">Cadastros auxiliares</h2>
          <p>Cargos e funções, prioridades e tipos usados nos módulos operacionais.</p>
        </div>
      </div>
      <div className="admin-registry-grid">
        <CargoRegistry {...props} />
        <PriorityRegistry {...props} />
        <OccurrenceTypeRegistry {...props} />
      </div>
    </section>
  );
}

function CargoRegistry({
  data,
  service,
  actorId,
  canEdit,
  onChanged,
  onError,
}: RegistriesSectionProps) {
  const [form, setForm] = useState({ id: "", nome: "", descricao: "", ativo: true });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await service.saveCargo(
        form.id || null,
        { nome: form.nome, descricao: form.descricao || null, ativo: form.ativo },
        actorId,
      );
      setForm({ id: "", nome: "", descricao: "", ativo: true });
      await onChanged("Cargo/função salvo.");
    } catch (error) {
      onError(error);
    }
  }

  return (
    <article className="admin-registry">
      <h3>Cargos e funções</h3>
      {canEdit && (
        <form className="admin-form" onSubmit={submit}>
          <Input
            label="Nome"
            value={form.nome}
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
            required
          />
          <TextareaField
            label="Descrição"
            value={form.descricao}
            onChange={(event) => setForm({ ...form, descricao: event.target.value })}
          />
          <ActiveField value={form.ativo} onChange={(ativo) => setForm({ ...form, ativo })} />
          <RegistryActions
            editing={Boolean(form.id)}
            onCancel={() => setForm({ id: "", nome: "", descricao: "", ativo: true })}
          />
        </form>
      )}
      <ul className="admin-registry__list">
        {data.cargos.map((item) => (
          <li key={item.id}>
            <span>
              {item.nome} <StatusBadge active={item.ativo} />
            </span>
            {canEdit && (
              <span className="admin-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setForm({
                      id: item.id,
                      nome: item.nome,
                      descricao: item.descricao ?? "",
                      ativo: item.ativo,
                    })
                  }
                >
                  Editar
                </Button>
                <RemoveButton
                  onClick={() =>
                    remove(() => service.removeCargo(item.id, actorId), onChanged, onError)
                  }
                />
              </span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

function PriorityRegistry({
  data,
  service,
  actorId,
  canEdit,
  onChanged,
  onError,
}: RegistriesSectionProps) {
  const [form, setForm] = useState({
    id: "",
    nome: "",
    nivel: 1,
    cor: "#2563EB",
    ativo: true,
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await service.savePriority(
        form.id || null,
        { nome: form.nome, nivel: form.nivel, cor: form.cor, ativo: form.ativo },
        actorId,
      );
      setForm({ id: "", nome: "", nivel: 1, cor: "#2563EB", ativo: true });
      await onChanged("Prioridade salva.");
    } catch (error) {
      onError(error);
    }
  }

  return (
    <article className="admin-registry">
      <h3>Prioridades</h3>
      {canEdit && (
        <form className="admin-form" onSubmit={submit}>
          <Input
            label="Nome"
            value={form.nome}
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
            required
          />
          <Input
            label="Nível"
            type="number"
            min={1}
            value={form.nivel}
            onChange={(event) => setForm({ ...form, nivel: Number(event.target.value) })}
            required
          />
          <Input
            label="Cor"
            type="color"
            value={form.cor}
            onChange={(event) => setForm({ ...form, cor: event.target.value.toUpperCase() })}
            required
          />
          <ActiveField value={form.ativo} onChange={(ativo) => setForm({ ...form, ativo })} />
          <RegistryActions
            editing={Boolean(form.id)}
            onCancel={() => setForm({ id: "", nome: "", nivel: 1, cor: "#2563EB", ativo: true })}
          />
        </form>
      )}
      <ul className="admin-registry__list">
        {data.prioridades.map((item) => (
          <li key={item.id}>
            <span>
              {item.nivel}. {item.nome} <StatusBadge active={item.ativo} />
            </span>
            {canEdit && (
              <span className="admin-actions">
                <Button size="sm" variant="ghost" onClick={() => setForm({ ...item })}>
                  Editar
                </Button>
                <RemoveButton
                  onClick={() =>
                    remove(() => service.removePriority(item.id, actorId), onChanged, onError)
                  }
                />
              </span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

function OccurrenceTypeRegistry({
  data,
  service,
  actorId,
  canEdit,
  onChanged,
  onError,
}: RegistriesSectionProps) {
  const [form, setForm] = useState({ id: "", nome: "", descricao: "", ativo: true });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await service.saveOccurrenceType(
        form.id || null,
        { nome: form.nome, descricao: form.descricao || null, ativo: form.ativo },
        actorId,
      );
      setForm({ id: "", nome: "", descricao: "", ativo: true });
      await onChanged("Tipo de ocorrência salvo.");
    } catch (error) {
      onError(error);
    }
  }

  return (
    <article className="admin-registry">
      <h3>Tipos de ocorrência</h3>
      {canEdit && (
        <form className="admin-form" onSubmit={submit}>
          <Input
            label="Nome"
            value={form.nome}
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
            required
          />
          <TextareaField
            label="Descrição"
            value={form.descricao}
            onChange={(event) => setForm({ ...form, descricao: event.target.value })}
          />
          <ActiveField value={form.ativo} onChange={(ativo) => setForm({ ...form, ativo })} />
          <RegistryActions
            editing={Boolean(form.id)}
            onCancel={() => setForm({ id: "", nome: "", descricao: "", ativo: true })}
          />
        </form>
      )}
      <ul className="admin-registry__list">
        {data.tiposOcorrencia.map((item) => (
          <li key={item.id}>
            <span>
              {item.nome} <StatusBadge active={item.ativo} />
            </span>
            {canEdit && (
              <span className="admin-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setForm({
                      id: item.id,
                      nome: item.nome,
                      descricao: item.descricao ?? "",
                      ativo: item.ativo,
                    })
                  }
                >
                  Editar
                </Button>
                <RemoveButton
                  onClick={() =>
                    remove(() => service.removeOccurrenceType(item.id, actorId), onChanged, onError)
                  }
                />
              </span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ActiveField({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Field label="Estado">
      <label className="admin-check">
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
        />
        Cadastro ativo
      </label>
    </Field>
  );
}

function RegistryActions({ editing, onCancel }: { editing: boolean; onCancel: () => void }) {
  return (
    <div className="admin-form__actions">
      <Button type="submit">{editing ? "Atualizar" : "Adicionar"}</Button>
      {editing && (
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick}>
      Remover
    </Button>
  );
}

async function remove(
  operation: () => Promise<void>,
  onChanged: (message: string) => Promise<void>,
  onError: (error: unknown) => void,
) {
  if (!window.confirm("Confirma a remoção lógica deste cadastro?")) return;
  try {
    await operation();
    await onChanged("Cadastro removido.");
  } catch (error) {
    onError(error);
  }
}
