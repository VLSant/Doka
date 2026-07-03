import type { Task, TaskAction, TaskFilters, TaskViewer } from "./types";

const CLOSED = new Set(["concluida", "validada"]);

export function isTaskLate(task: Pick<Task, "prazo_data" | "status">, today = new Date()): boolean {
  if (!task.prazo_data || CLOSED.has(task.status)) return false;
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return task.prazo_data < localToday;
}

export function taskMatchesSlice(task: Task, filters: TaskFilters, today = new Date()): boolean {
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const sliceMatches =
    filters.slice === "todas" ||
    (filters.slice === "hoje" && task.prazo_data === localToday) ||
    (filters.slice === "pendentes" && ["pendente", "em_andamento", "reaberta"].includes(task.status)) ||
    (filters.slice === "atrasadas" && isTaskLate(task, today)) ||
    (filters.slice === "validacao" && task.status === "concluida" && task.exige_validacao) ||
    (filters.slice === "concluidas" && CLOSED.has(task.status));
  const term = filters.termo?.trim().toLocaleLowerCase("pt-BR");
  return (
    sliceMatches &&
    (!filters.status || task.status === filters.status) &&
    (!filters.postoId || task.posto_id === filters.postoId) &&
    (!filters.responsavelId ||
      task.responsaveis.some((responsavel) => responsavel.id === filters.responsavelId)) &&
    (!filters.prioridadeId || task.prioridade_id === filters.prioridadeId) &&
    (!filters.tipo || task.tipo === filters.tipo) &&
    (!filters.prazoDe || Boolean(task.prazo_data && task.prazo_data >= filters.prazoDe)) &&
    (!filters.prazoAte || Boolean(task.prazo_data && task.prazo_data <= filters.prazoAte)) &&
    (!term ||
      task.titulo.toLocaleLowerCase("pt-BR").includes(term) ||
      Boolean(task.descricao?.toLocaleLowerCase("pt-BR").includes(term)))
  );
}

export function availableTaskActions(task: Task, viewer: TaskViewer): TaskAction[] {
  const responsible = task.responsaveis.some(({ id }) => id === viewer.usuarioId);
  const manages =
    viewer.perfil === "direcao_admin" ||
    task.criada_por === viewer.usuarioId ||
    (viewer.perfil === "supervisao" &&
      task.posto_id !== null &&
      viewer.postoIds.includes(task.posto_id));
  const validates =
    viewer.perfil === "direcao_admin" ||
    (viewer.perfil === "supervisao" &&
      (task.criada_por === viewer.usuarioId ||
        (task.posto_id !== null && viewer.postoIds.includes(task.posto_id))));
  const actions: TaskAction[] = [];
  if ((responsible || manages) && ["pendente", "reaberta"].includes(task.status)) actions.push("iniciar");
  if ((responsible || manages) && ["pendente", "em_andamento", "reaberta"].includes(task.status)) {
    actions.push("concluir");
  }
  if (validates && task.status === "concluida" && task.exige_validacao) actions.push("validar");
  if (validates && ["concluida", "validada"].includes(task.status)) actions.push("reabrir");
  return actions;
}

export function canEditTask(task: Task, viewer: TaskViewer): boolean {
  if (task.status === "validada") return false;
  return (
    viewer.perfil === "direcao_admin" ||
    task.criada_por === viewer.usuarioId ||
    (viewer.perfil === "supervisao" &&
      task.posto_id !== null &&
      viewer.postoIds.includes(task.posto_id))
  );
}

export function taskViewerFromContext(context: {
  usuarioId: string;
  perfil: TaskViewer["perfil"];
  postos: { postoId: string }[];
}): TaskViewer {
  return {
    usuarioId: context.usuarioId,
    perfil: context.perfil,
    postoIds: context.postos.map(({ postoId }) => postoId),
  };
}
