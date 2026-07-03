import type { CatalogItem, UsuarioItem } from "../../../services/catalog-service";
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
      <label>
        Buscar
        <input
          type="search"
          value={value.termo ?? ""}
          disabled={disabled}
          placeholder="Título ou descrição"
          onChange={(event) => onChange({ ...value, termo: event.target.value })}
        />
      </label>
      <label>
        Status
        <select
          value={value.status ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, status: event.target.value as TaskFilters["status"] })
          }
        >
          <option value="">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="validada">Validada</option>
          <option value="reaberta">Reaberta</option>
        </select>
      </label>
      <label>
        Posto
        <select
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
        </select>
      </label>
      <label>
        Responsável
        <select
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
        </select>
      </label>
      <label>
        Prioridade
        <select value={value.prioridadeId ?? ""} disabled={disabled} onChange={(event) => onChange({ ...value, prioridadeId: event.target.value })}>
          <option value="">Todas</option>
          {prioridades.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>
      <label>
        Tipo
        <select value={value.tipo ?? ""} disabled={disabled} onChange={(event) => onChange({ ...value, tipo: event.target.value as TaskFilters["tipo"] })}>
          <option value="">Todos</option><option value="avulsa">Avulsa</option>
          <option value="estrategia">Estratégia</option><option value="rotina">Rotina</option>
        </select>
      </label>
      <label>Prazo de<input type="date" value={value.prazoDe ?? ""} disabled={disabled} onChange={(event) => onChange({ ...value, prazoDe: event.target.value })} /></label>
      <label>Prazo até<input type="date" value={value.prazoAte ?? ""} disabled={disabled} onChange={(event) => onChange({ ...value, prazoAte: event.target.value })} /></label>
    </div>
  );
}
