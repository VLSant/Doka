import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Checkbox, Select } from "../../../components/ui/FormControls";
import { Input } from "../../../components/ui/Input";
import type { LotFilters as Filters } from "../types";

export function LotFilters({
  value,
  disabled,
  onChange,
}: {
  value: Filters;
  disabled?: boolean;
  onChange: (filters: Filters) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim() || undefined;
    onChange({
      posto_id: text("posto_id"),
      data_atividade: text("data_atividade"),
      importado_de: text("importado_de"),
      importado_ate: text("importado_ate"),
      status: text("status"),
      com_erro: data.get("com_erro") === "on" || undefined,
      com_alerta: data.get("com_alerta") === "on" || undefined,
    });
  }

  return (
    <form className="mms-lot-filters" onSubmit={submit} aria-label="Filtros de importações">
      <Input label="Posto" name="posto_id" defaultValue={value.posto_id} />
      <Input
        label="Data operacional"
        name="data_atividade"
        type="date"
        defaultValue={value.data_atividade}
      />
      <Input
        label="Importado de"
        name="importado_de"
        type="date"
        defaultValue={value.importado_de?.slice(0, 10)}
      />
      <Input
        label="Até"
        name="importado_ate"
        type="date"
        defaultValue={value.importado_ate?.slice(0, 10)}
      />
      <Select label="Status" name="status" defaultValue={value.status ?? ""}>
        <option value="">Todos</option>
        <option value="importado">Importado</option>
        <option value="importado_com_alertas">Com alertas</option>
        <option value="erro">Com erros</option>
        <option value="cancelado">Cancelado</option>
      </Select>
      <Checkbox name="com_erro" label="Com erro" defaultChecked={value.com_erro} />
      <Checkbox name="com_alerta" label="Com alerta" defaultChecked={value.com_alerta} />
      <div className="mms-lot-filters__actions">
        <Button type="submit" disabled={disabled}>
          Aplicar filtros
        </Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => onChange({})}>
          Limpar
        </Button>
      </div>
    </form>
  );
}
