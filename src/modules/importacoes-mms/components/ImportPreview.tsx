import { TableFrame } from "../../../components/ui/Patterns";
import type { ImportIssue, ImportPreview as ImportPreviewModel } from "../types";
import { ValidationSummary } from "./ValidationSummary";
import "./ImportPreview.css";

function IssueList({ title, items }: { title: string; items: ImportIssue[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3>{title}</h3>
      <TableFrame>
        <table className="mms-issue-table">
          <thead>
            <tr>
              <th data-numeric>Linha</th>
              <th>Posto</th>
              <th>Campo</th>
              <th>Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id ?? `${item.codigo}-${index}`}>
                <td data-numeric>{item.linha ?? "Arquivo"}</td>
                <td>{item.areaTrabalho ?? "-"}</td>
                <td>{item.campo ?? "-"}</td>
                <td>{item.mensagem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableFrame>
    </section>
  );
}

export function ImportPreview({ preview }: { preview: ImportPreviewModel }) {
  return (
    <div className="mms-preview">
      <header className="mms-preview__header">
        <div>
          <span>Arquivo</span>
          <strong>{preview.arquivo}</strong>
        </div>
        <div>
          <span>Postos</span>
          <strong>{preview.postos.map((posto) => posto.nome).join(", ")}</strong>
        </div>
        <div>
          <span>Data</span>
          <strong>{preview.dataAtividade}</strong>
        </div>
      </header>
      <ValidationSummary preview={preview} />
      <IssueList title="Erros bloqueantes" items={preview.erros} />
      <IssueList title="Alertas" items={preview.alertas} />
    </div>
  );
}
