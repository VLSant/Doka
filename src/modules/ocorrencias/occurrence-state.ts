import type {
  OccurrenceFilters,
  OccurrenceInput,
  OccurrenceListItem,
  OccurrenceStatus,
} from "./types";

export const STATUS_LABELS: Record<OccurrenceStatus, string> = {
  aberta: "Aberta",
  em_acompanhamento: "Em acompanhamento",
  aguardando_retorno: "Aguardando retorno",
  resolvida: "Resolvida",
  encerrada: "Encerrada",
  reaberta: "Reaberta",
};

const TERMINAL = new Set<OccurrenceStatus>(["resolvida", "encerrada"]);

export function localDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function isOccurrenceOverdue(
  occurrence: Pick<OccurrenceListItem, "data_retorno" | "status">,
  today = localDate(),
): boolean {
  return Boolean(
    occurrence.data_retorno &&
      occurrence.data_retorno < today &&
      !TERMINAL.has(occurrence.status),
  );
}

export function occurrenceMatchesFilters(
  occurrence: OccurrenceListItem,
  filters: OccurrenceFilters,
  today = localDate(),
): boolean {
  const overdue = isOccurrenceOverdue(occurrence, today);
  if (filters.tab === "hoje" && occurrence.data_retorno !== today) return false;
  if (
    filters.tab === "abertas" &&
    (TERMINAL.has(occurrence.status) || overdue || occurrence.data_retorno === today)
  ) {
    return false;
  }
  if (filters.tab === "atrasadas" && !overdue) return false;
  if (filters.posto_id && occurrence.posto_id !== filters.posto_id) return false;
  if (filters.responsavel_id && occurrence.responsavel_id !== filters.responsavel_id) return false;
  if (
    filters.tipo_ocorrencia_id &&
    occurrence.tipo_ocorrencia_id !== filters.tipo_ocorrencia_id
  ) {
    return false;
  }
  if (filters.prioridade_id && occurrence.prioridade_id !== filters.prioridade_id) return false;
  if (filters.status && occurrence.status !== filters.status) return false;
  if (filters.assistencia_id && occurrence.assistencia_id !== filters.assistencia_id) return false;
  if (filters.data_de && occurrence.created_at.slice(0, 10) < filters.data_de) return false;
  if (filters.data_ate && occurrence.created_at.slice(0, 10) > filters.data_ate) return false;
  if (filters.montador) {
    const needle = filters.montador.trim().toLocaleLowerCase("pt-BR");
    const resources = occurrence.assistencia?.partes
      ?.flatMap((parte) => [parte.recurso_corrigido, parte.recurso_importado])
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR") ?? "";
    if (!resources.includes(needle)) return false;
  }
  if (filters.busca) {
    const needle = filters.busca.trim().toLocaleLowerCase("pt-BR");
    const content = [
      occurrence.titulo,
      occurrence.descricao,
      occurrence.assistencia?.numero_assistencia,
      occurrence.tipo?.nome,
      occurrence.responsavel?.nome,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    if (!content.includes(needle)) return false;
  }
  return true;
}

export function validateOccurrenceInput(input: OccurrenceInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.assistencia_id) errors.assistencia_id = "Selecione uma assistência.";
  if (!input.posto_id) errors.assistencia_id = "Selecione uma assistência válida.";
  if (!input.tipo_ocorrencia_id) errors.tipo_ocorrencia_id = "Selecione o tipo.";
  if (!input.prioridade_id) errors.prioridade_id = "Selecione a prioridade.";
  if (!input.responsavel_id) errors.responsavel_id = "Selecione o responsável.";
  if (!input.data_retorno) errors.data_retorno = "Informe a data de retorno.";
  if (!input.titulo.trim()) errors.titulo = "Informe o título.";
  if (!input.descricao?.trim()) errors.descricao = "Informe a descrição.";
  return errors;
}

export function nextStatuses(status: OccurrenceStatus): OccurrenceStatus[] {
  switch (status) {
    case "aberta":
      return ["em_acompanhamento", "aguardando_retorno", "resolvida", "encerrada"];
    case "em_acompanhamento":
      return ["aguardando_retorno", "resolvida", "encerrada"];
    case "aguardando_retorno":
      return ["em_acompanhamento", "resolvida", "encerrada"];
    case "reaberta":
      return ["em_acompanhamento", "aguardando_retorno", "resolvida", "encerrada"];
    case "resolvida":
      return ["encerrada", "reaberta"];
    case "encerrada":
      return ["reaberta"];
  }
}

