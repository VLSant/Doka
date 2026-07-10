import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import { RowActionsMenu } from "../../../components/ui/RowActionsMenu";
import { TableCardHeader, TableCardList, TableCardRow } from "../../../components/ui/TableCardRow";
import { RemovalAlertDialog } from "../../../components/shadcn/RemovalAlertDialog";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import type { AdministrationService } from "../administration-service";
import type { AdministrationSnapshot, MetaEficiencia } from "../types";
import { SelectField, StatusBadge } from "./AdminFields";

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
  data,
  service,
  actorId,
  canEdit,
  onChanged,
  onError,
}: {
  data: AdministrationSnapshot;
  service: AdministrationService;
  actorId: string;
  canEdit: boolean;
  onChanged: (message: string) => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const [form, setForm] = useState(empty);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.posto_id || !form.tipo_atividade_normalizado.trim() || !form.vigencia_inicio) return;
    try {
      await service.saveEfficiencyTarget(
        form.id || null,
        {
          posto_id: form.posto_id,
          tipo_atividade_normalizado: form.tipo_atividade_normalizado
            .trim()
            .toLocaleLowerCase("pt-BR"),
          meta_percentual: form.meta_percentual,
          vigencia_inicio: form.vigencia_inicio,
          vigencia_fim: form.vigencia_fim || null,
          ativo: form.ativo,
        },
        actorId,
      );
      setForm(empty);
      await onChanged("Meta de eficiencia salva.");
    } catch (error) {
      onError(error);
    }
  }

  function edit(item: MetaEficiencia) {
    setForm({
      id: item.id,
      posto_id: item.posto_id,
      tipo_atividade_normalizado: item.tipo_atividade_normalizado,
      meta_percentual: item.meta_percentual,
      vigencia_inicio: item.vigencia_inicio,
      vigencia_fim: item.vigencia_fim ?? "",
      ativo: item.ativo,
    });
  }

  async function remove(id: string) {
    try {
      await service.removeEfficiencyTarget(id, actorId);
      setRemoveTarget(null);
      await onChanged("Meta removida.");
    } catch (error) {
      onError(error);
    }
  }

  return (
    <section className="admin-section" aria-labelledby="admin-targets-title">
      <div className="admin-section__header">
        <div>
          <h2 id="admin-targets-title">Metas e parametros de eficiencia</h2>
          <p>Meta por posto e tipo de atividade usada no Dashboard e na margem de frustracao.</p>
        </div>
      </div>
      {canEdit && (
        <form className="admin-form" onSubmit={submit}>
          <SelectField
            label="Posto"
            value={form.posto_id}
            onChange={(next) => setForm({ ...form, posto_id: next })}
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
          <Input
            label="Tipo de atividade"
            value={form.tipo_atividade_normalizado}
            onChange={(event) =>
              setForm({ ...form, tipo_atividade_normalizado: event.target.value })
            }
            required
          />
          <Input
            label="Meta (%)"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={form.meta_percentual}
            onChange={(event) => setForm({ ...form, meta_percentual: Number(event.target.value) })}
            required
          />
          <DatePickerField
            label="Vigencia inicial"
            value={form.vigencia_inicio}
            onChange={(next) => setForm({ ...form, vigencia_inicio: next })}
            required
          />
          <DatePickerField
            label="Vigencia final"
            min={form.vigencia_inicio}
            value={form.vigencia_fim}
            onChange={(next) => setForm({ ...form, vigencia_fim: next })}
          />
          <Checkbox
            label="Meta ativa"
            checked={form.ativo}
            onChange={(event) => setForm({ ...form, ativo: event.target.checked })}
          />
          <div className="admin-form__actions">
            <Button type="submit">{form.id ? "Atualizar" : "Adicionar"}</Button>
            {form.id ? (
              <Button variant="ghost" onClick={() => setForm(empty)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      )}
      <TableCardList>
        <TableCardHeader
          selectable={false}
          actions={canEdit}
          columns={[
            { key: "posto", label: "Posto", width: "minmax(160px, 1fr)" },
            { key: "tipo", label: "Tipo", width: "150px" },
            { key: "meta", label: "Meta", width: "90px", align: "right" },
            { key: "vigencia", label: "Vigencia", width: "190px" },
            { key: "estado", label: "Estado", width: "90px" },
          ]}
        />
        {data.metasEficiencia.map((item) => (
          <TableCardRow
            key={item.id}
            id={item.id}
            selectable={false}
            columns={[
              {
                key: "posto",
                label: "Posto",
                width: "minmax(160px, 1fr)",
                value: <strong>{data.postos.find((posto) => posto.id === item.posto_id)?.nome ?? "-"}</strong>,
              },
              { key: "tipo", label: "Tipo", width: "150px", value: item.tipo_atividade_normalizado },
              {
                key: "meta",
                label: "Meta",
                width: "90px",
                align: "right",
                value: <span className="doka-card-row__value">{item.meta_percentual}%</span>,
              },
              {
                key: "vigencia",
                label: "Vigencia",
                width: "190px",
                value: `${item.vigencia_inicio} a ${item.vigencia_fim ?? "sem termino"}`,
              },
              { key: "estado", label: "Estado", width: "90px", value: <StatusBadge active={item.ativo} /> },
            ]}
            actions={
              canEdit ? (
                <RowActionsMenu onEdit={() => edit(item)} onRemove={() => setRemoveTarget(item.id)} />
              ) : undefined
            }
          />
        ))}
      </TableCardList>
      <RemovalAlertDialog
        open={Boolean(removeTarget)}
        title="Remover meta"
        description="Esta acao remove logicamente a meta de eficiencia selecionada."
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={() => {
          if (removeTarget) void remove(removeTarget);
        }}
      />
    </section>
  );
}
