import type { CatalogItem, UsuarioItem } from "../../../services/catalog-service";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/FormControls";
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
      <Select
        label="Posto"
        value={value.postoId ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, postoId: event.target.value })}
      >
        <option value="">Todos</option>
        {postos.map((posto) => (
          <option key={posto.id} value={posto.id}>
            {posto.nome}
          </option>
        ))}
      </Select>
      <Select
        label="Responsável"
        value={value.responsavelId ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, responsavelId: event.target.value })}
      >
        <option value="">Todos</option>
        {usuarios.map((usuario) => (
          <option key={usuario.id} value={usuario.id}>
            {usuario.nome}
          </option>
        ))}
      </Select>
      <Select
        label="Prioridade"
        value={value.prioridadeId ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, prioridadeId: event.target.value })}
      >
        <option value="">Todas</option>
        {prioridades.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nome}
          </option>
        ))}
      </Select>
      <Select
        label="Tipo"
        value={value.tipo ?? ""}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...value, tipo: event.target.value as TaskFilters["tipo"] })
        }
      >
        <option value="">Todos</option>
        <option value="avulsa">Avulsa</option>
        <option value="estrategia">Estratégia</option>
        <option value="rotina">Rotina</option>
      </Select>
      <Input
        label="Prazo de"
        type="date"
        value={value.prazoDe ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, prazoDe: event.target.value })}
      />
      <Input
        label="Prazo até"
        type="date"
        value={value.prazoAte ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, prazoAte: event.target.value })}
      />
    </div>
  );
}
