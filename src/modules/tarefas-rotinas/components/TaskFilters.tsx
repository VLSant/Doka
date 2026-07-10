import type { CatalogItem, UsuarioItem } from "../../../services/catalog-service";
import { DatePickerField } from "../../../components/shadcn/DatePickerField";
import { FormSelect } from "../../../components/shadcn/FormSelect";
import type { TaskFilters } from "../types";

export function TaskFiltersForm({
  value,
  postos,
  usuarios,
  prioridades,
  disabled,
  onChange,
}: {
  value: TaskFilters;
  postos: CatalogItem[];
  usuarios: UsuarioItem[];
  prioridades: CatalogItem[];
  disabled?: boolean;
  onChange: (filters: TaskFilters) => void;
}) {
  return (
    <div className="tasks-filters" aria-label="Filtros de tarefas">
      <FormSelect
        label="Posto"
        value={value.postoId ?? ""}
        disabled={disabled}
        onChange={(next) => onChange({ ...value, postoId: next })}
        options={[
          { value: "", label: "Todos" },
          ...postos.map((posto) => ({ value: posto.id, label: posto.nome })),
        ]}
      />
      <FormSelect
        label="Responsável"
        value={value.responsavelId ?? ""}
        disabled={disabled}
        onChange={(next) => onChange({ ...value, responsavelId: next })}
        options={[
          { value: "", label: "Todos" },
          ...usuarios.map((usuario) => ({ value: usuario.id, label: usuario.nome })),
        ]}
      />
      <FormSelect
        label="Prioridade"
        value={value.prioridadeId ?? ""}
        disabled={disabled}
        onChange={(next) => onChange({ ...value, prioridadeId: next })}
        options={[
          { value: "", label: "Todas" },
          ...prioridades.map((item) => ({ value: item.id, label: item.nome })),
        ]}
      />
      <FormSelect
        label="Tipo"
        value={value.tipo ?? ""}
        disabled={disabled}
        onChange={(next) =>
          onChange({ ...value, tipo: next as TaskFilters["tipo"] })
        }
        options={[
          { value: "", label: "Todos" },
          { value: "avulsa", label: "Avulsa" },
          { value: "estrategia", label: "Estratégia" },
          { value: "rotina", label: "Rotina" },
        ]}
      />
      <DatePickerField
        label="Prazo de"
        value={value.prazoDe ?? ""}
        disabled={disabled}
        onChange={(next) => onChange({ ...value, prazoDe: next })}
      />
      <DatePickerField
        label="Prazo até"
        value={value.prazoAte ?? ""}
        disabled={disabled}
        onChange={(next) => onChange({ ...value, prazoAte: next })}
      />
    </div>
  );
}
