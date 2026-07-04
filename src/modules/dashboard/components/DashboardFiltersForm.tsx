import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/FormControls";
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
      <Input label="Data inicial" name="inicio" type="date" defaultValue={value.inicio} disabled={disabled} required />
      <Input label="Data final" name="fim" type="date" defaultValue={value.fim} disabled={disabled} required />
      <Select label="Posto" name="postoId" defaultValue={value.postoId ?? ""} disabled={disabled}>
          <option value="">Todos os postos permitidos</option>
          {postos.map((posto) => (
            <option key={posto.id} value={posto.id}>
              {posto.codigo ? `${posto.codigo} — ` : ""}
              {posto.nome}
            </option>
          ))}
      </Select>
      <Button type="submit" disabled={disabled}>
        Aplicar filtros
      </Button>
    </form>
  );
}
