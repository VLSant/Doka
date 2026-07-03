import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { AdministrationService } from "../administration-service";
import type { AdministrationSnapshot, MetaEficiencia } from "../types";
import { Field, SelectField, StatusBadge } from "./AdminFields";

const empty = {
  id: "",
  posto_id: "",
  tipo_atividade_normalizado: "montagem",
  meta_percentual: 90,
  vigencia_inicio: new Date().toISOString().slice(0, 10),
  vigencia_fim: "",
  ativo: true,
};

export function EfficiencyTargetsSection({
  data, service, actorId, canEdit, onChanged, onError,
}: {
  data: AdministrationSnapshot;
  service: AdministrationService;
  actorId: string;
  canEdit: boolean;
  onChanged: (message: string) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const [form, setForm] = useState(empty);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.posto_id || !form.tipo_atividade_normalizado.trim() || !form.vigencia_inicio) return;
    try {
      await service.saveEfficiencyTarget(form.id || null, {
        posto_id: form.posto_id,
        tipo_atividade_normalizado: form.tipo_atividade_normalizado.trim().toLocaleLowerCase("pt-BR"),
        meta_percentual: form.meta_percentual,
        vigencia_inicio: form.vigencia_inicio,
        vigencia_fim: form.vigencia_fim || null,
        ativo: form.ativo,
      }, actorId);
      setForm(empty);
      await onChanged("Meta de eficiência salva.");
    } catch (error) { onError(error); }
  }

  function edit(item: MetaEficiencia) {
    setForm({
      id: item.id, posto_id: item.posto_id,
      tipo_atividade_normalizado: item.tipo_atividade_normalizado,
      meta_percentual: item.meta_percentual, vigencia_inicio: item.vigencia_inicio,
      vigencia_fim: item.vigencia_fim ?? "", ativo: item.ativo,
    });
  }

  async function remove(id: string) {
    if (!window.confirm("Confirma a remoção lógica desta meta?")) return;
    try {
      await service.removeEfficiencyTarget(id, actorId);
      await onChanged("Meta removida.");
    } catch (error) { onError(error); }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-targets-title">
      <div className="admin-section__header"><div>
        <h2 id="admin-targets-title">Metas e parâmetros de eficiência</h2>
        <p>Meta por posto e tipo de atividade usada no Dashboard e na margem de frustração.</p>
      </div></div>
      {canEdit && (
        <form className="admin-form" onSubmit={submit}>
          <SelectField label="Posto" value={form.posto_id} onChange={(event) => setForm({ ...form, posto_id: event.target.value })} required>
            <option value="">Selecione</option>
            {data.postos.filter((item) => item.ativo).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </SelectField>
          <Input label="Tipo de atividade" value={form.tipo_atividade_normalizado} onChange={(event) => setForm({ ...form, tipo_atividade_normalizado: event.target.value })} required />
          <Input label="Meta (%)" type="number" min={0} max={100} step={0.1} value={form.meta_percentual} onChange={(event) => setForm({ ...form, meta_percentual: Number(event.target.value) })} required />
          <Input label="Vigência inicial" type="date" value={form.vigencia_inicio} onChange={(event) => setForm({ ...form, vigencia_inicio: event.target.value })} required />
          <Input label="Vigência final" type="date" min={form.vigencia_inicio} value={form.vigencia_fim} onChange={(event) => setForm({ ...form, vigencia_fim: event.target.value })} />
          <Field label="Estado"><label className="admin-check"><input type="checkbox" checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} />Meta ativa</label></Field>
          <div className="admin-form__actions"><Button type="submit">{form.id ? "Atualizar" : "Adicionar"}</Button>
            {form.id ? <Button variant="ghost" onClick={() => setForm(empty)}>Cancelar</Button> : null}
          </div>
        </form>
      )}
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr>
        <th>Posto</th><th>Tipo</th><th>Meta</th><th>Vigência</th><th>Estado</th>{canEdit && <th>Ações</th>}
      </tr></thead><tbody>
        {data.metasEficiencia.map((item) => <tr key={item.id}>
          <td>{data.postos.find((posto) => posto.id === item.posto_id)?.nome ?? "—"}</td>
          <td>{item.tipo_atividade_normalizado}</td><td>{item.meta_percentual}%</td>
          <td>{item.vigencia_inicio} a {item.vigencia_fim ?? "sem término"}</td>
          <td><StatusBadge active={item.ativo} /></td>
          {canEdit && <td className="admin-actions"><Button size="sm" variant="outline" onClick={() => edit(item)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => void remove(item.id)}>Remover</Button></td>}
        </tr>)}
      </tbody></table></div>
    </section>
  );
}
