import { Card } from "../../../components/ui/Card";
import type { DashboardAlerta, ProdutividadeTotais, ResumoPosto } from "../types";

function percent(value: number | null) {
  return value === null ? "Sem baixas" : `${value.toLocaleString("pt-BR")}%`;
}

function ProductivityCard({ title, totals }: { title: string; totals: ProdutividadeTotais }) {
  return (
    <Card padding="md" className="dashboard-productivity-card">
      <span>{title}</span>
      <strong>{percent(totals.eficiencia)}</strong>
      <small>
        {totals.executadas} executada(s) de {totals.executadas + totals.naoExecutadas} baixada(s)
      </small>
    </Card>
  );
}

export function DashboardProductivity({
  dia,
  semana,
  periodo,
  porPosto,
  alertas,
}: {
  dia: ProdutividadeTotais;
  semana: ProdutividadeTotais;
  periodo: ProdutividadeTotais;
  porPosto: ResumoPosto[];
  alertas: DashboardAlerta[];
}) {
  return (
    <>
      <section aria-labelledby="dashboard-productivity-title">
        <h2 id="dashboard-productivity-title">Produtividade e eficiência</h2>
        <div className="dashboard-productivity-cards">
          <ProductivityCard title="Eficiência do dia final" totals={dia} />
          <ProductivityCard title="Eficiência dos últimos 7 dias" totals={semana} />
          <ProductivityCard title="Eficiência do período" totals={periodo} />
        </div>
        <Card padding="lg">
          <h3>Início do dia × fechamento do período</h3>
          <dl className="dashboard-comparison">
            <div><dt>Previstas no início</dt><dd>{periodo.previstas}</dd></div>
            <div><dt>Executadas</dt><dd>{periodo.executadas}</dd></div>
            <div><dt>Não executadas</dt><dd>{periodo.naoExecutadas}</dd></div>
            <div><dt>Pendentes</dt><dd>{periodo.pendentes}</dd></div>
            <div><dt>Canceladas</dt><dd>{periodo.canceladas}</dd></div>
            <div><dt>Removidas por nova importação</dt><dd>{periodo.removidas}</dd></div>
          </dl>
        </Card>
      </section>

      <section aria-labelledby="dashboard-posts-title">
        <h2 id="dashboard-posts-title">Resumo por posto</h2>
        {porPosto.length === 0 ? (
          <p>Nenhum posto com produtividade no período.</p>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Posto</th><th>Previstas</th><th>Executadas</th>
                  <th>Não executadas</th><th>Pendentes</th><th>Eficiência</th>
                  <th>Meta</th><th>Margem</th>
                </tr>
              </thead>
              <tbody>
                {porPosto.map((posto) => (
                  <tr key={posto.postoId}>
                    <td>{posto.postoNome}</td><td>{posto.previstas}</td>
                    <td>{posto.executadas}</td><td>{posto.naoExecutadas}</td>
                    <td>{posto.pendentes}</td><td>{percent(posto.eficiencia)}</td>
                    <td>{percent(posto.meta)}</td>
                    <td>{posto.margemFrustracao ?? "Sem meta"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="dashboard-alerts-title">
        <h2 id="dashboard-alerts-title">Alertas críticos</h2>
        {alertas.length === 0 ? (
          <Card padding="md"><p>Nenhum alerta crítico nos dados consultados.</p></Card>
        ) : (
          <ul className="dashboard-alerts">
            {alertas.map((alerta) => (
              <li key={alerta.id} className={`dashboard-alert dashboard-alert--${alerta.tipo}`}>
                {alerta.mensagem}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
