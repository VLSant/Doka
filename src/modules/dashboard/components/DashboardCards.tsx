import { Card } from "../../../components/ui/Card";
import type { DashboardCounters } from "../types";

const COUNTERS: Array<{
  key: keyof DashboardCounters;
  label: string;
  group: string;
  attention?: boolean;
}> = [
  { key: "assistenciasTotal", label: "Assistências no período", group: "Assistências" },
  { key: "assistenciasExecutadas", label: "Executadas", group: "Assistências" },
  { key: "assistenciasPendentes", label: "Pendentes", group: "Assistências", attention: true },
  { key: "assistenciasRemovidas", label: "Removidas", group: "Assistências" },
  { key: "ocorrenciasAbertas", label: "Abertas", group: "Ocorrências", attention: true },
  { key: "ocorrenciasAtrasadas", label: "Atrasadas", group: "Ocorrências", attention: true },
  { key: "tarefasPendentes", label: "Pendentes", group: "Tarefas", attention: true },
  { key: "tarefasAtrasadas", label: "Atrasadas", group: "Tarefas", attention: true },
  {
    key: "tarefasAguardandoValidacao",
    label: "Aguardando validação",
    group: "Tarefas",
    attention: true,
  },
  {
    key: "lancamentosPendentes",
    label: "Pendentes de validação",
    group: "Deslocamentos e custos",
    attention: true,
  },
];

export function DashboardCards({ counters }: { counters: DashboardCounters }) {
  return (
    <section className="dashboard-cards" aria-label="Resumo operacional">
      {COUNTERS.map((counter) => (
        <Card
          key={counter.key}
          padding="md"
          className={
            counter.attention && counters[counter.key] > 0
              ? "dashboard-counter dashboard-counter--attention"
              : "dashboard-counter"
          }
        >
          <span className="dashboard-counter__group">{counter.group}</span>
          <strong>{counters[counter.key].toLocaleString("pt-BR")}</strong>
          <span>{counter.label}</span>
        </Card>
      ))}
    </section>
  );
}
