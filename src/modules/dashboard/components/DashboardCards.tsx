import { MetricCard } from "../../../components/ui/Patterns";
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
  {
    key: "ocorrenciasReaparecemHoje",
    label: "Retornam hoje",
    group: "Ocorrências",
    attention: true,
  },
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
  const groups = Array.from(new Set(COUNTERS.map(({ group }) => group)));
  return (
    <section className="dashboard-cards" aria-label="Resumo operacional">
      {groups.map((group) => (
        <section className="dashboard-card-group" key={group}>
          <h2>{group}</h2>
          <div className="dashboard-card-group__grid">
            {COUNTERS.filter((counter) => counter.group === group).map((counter) => {
              const route =
                counter.group === "Tarefas"
                  ? "/app/tarefas-rotinas"
                  : counter.group === "Ocorrências"
                    ? "/app/ocorrencias"
                    : counter.group === "Assistências"
                      ? "/app/assistencias-mms"
                      : "/app/custos-extras";
              return (
                <a className="dashboard-metric-link" key={counter.key} href={route}>
                  <MetricCard
                    label={counter.label}
                    value={counters[counter.key].toLocaleString("pt-BR")}
                    tone={counter.attention && counters[counter.key] > 0 ? "attention" : "brand"}
                  />
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
