import { Button } from "../../../components/ui/Button";
import type { DashboardFilters, DashboardPosto } from "../types";

interface DashboardFiltersFormProps {
  value: DashboardFilters;
  postos: DashboardPosto[];
  disabled?: boolean;
  onChange: (filters: DashboardFilters) => void;
}

export function DashboardFiltersForm({
  value,
  postos,
  disabled = false,
  onChange,
}: DashboardFiltersFormProps) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange({
      inicio: String(data.get("inicio")),
      fim: String(data.get("fim")),
      postoId: String(data.get("postoId") || "") || null,
    });
  }

  return (
    <form className="dashboard-filters" onSubmit={submit}>
      <label>
        Data inicial
        <input name="inicio" type="date" defaultValue={value.inicio} disabled={disabled} required />
      </label>
      <label>
        Data final
        <input name="fim" type="date" defaultValue={value.fim} disabled={disabled} required />
      </label>
      <label>
        Posto
        <select name="postoId" defaultValue={value.postoId ?? ""} disabled={disabled}>
          <option value="">Todos os postos permitidos</option>
          {postos.map((posto) => (
            <option key={posto.id} value={posto.id}>
              {posto.codigo ? `${posto.codigo} — ` : ""}
              {posto.nome}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={disabled}>
        Aplicar filtros
      </Button>
    </form>
  );
}
