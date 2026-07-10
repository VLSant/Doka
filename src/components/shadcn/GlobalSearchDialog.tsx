/**
 * Busca global (Ctrl+K / Cmd+K), plano
 * `docs/11-plano-migracao-estilo-dracma.md` secao 4.5 ("Busca global Ctrl+K
 * (painel escuro, pills de escopo, hints (up/down)/esc) - portar
 * GlobalSearchDialog (cmdk)"), inspirado em
 * `dracma-cash-flow/src/components/shared/GlobalSearch/GlobalSearchDialog.tsx`.
 *
 * Busca client-side sobre o cache do TanStack Query dos 5 modulos alvo
 * (ocorrencias, tarefas, rotinas, lancamentos, assistencias) via
 * `queryClient.ensureQueryData`. Nota: a busca usa keys SEM filtros
 * (`list({})`), enquanto as paginas de lista podem usar keys filtradas por
 * posto — nesses casos a busca dispara sua propria requisicao (escopo e
 * permissao continuam garantidos server-side pelo RLS do Supabase).
 */
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LifeBuoy, ListChecks, Repeat, Wallet } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { cn } from "../../lib/utils";
import { queryKeys } from "../../app/query-keys";
import { createOccurrenceService } from "../../modules/ocorrencias/occurrence-service";
import { createTaskService } from "../../modules/tarefas-rotinas/task-service";
import { createLancamentoService } from "../../modules/lancamentos-operacionais/lancamento-service";
import { createAssistanceService } from "../../modules/assistencias-mms/assistance-service";

const DEBOUNCE_MS = 200;
const MAX_PER_GROUP = 8;

export type SearchScope = "ocorrencias" | "tarefas" | "rotinas" | "lancamentos" | "assistencias";

export interface SearchResult {
  scope: SearchScope;
  id: string;
  title: string;
  subtitle?: string;
  path: string;
}

const SCOPE_LABELS: Record<SearchScope, string> = {
  ocorrencias: "Ocorrências",
  tarefas: "Tarefas",
  rotinas: "Rotinas",
  lancamentos: "Lançamentos",
  assistencias: "Assistências",
};

const SCOPE_ICONS: Record<SearchScope, ComponentType<{ className?: string }>> = {
  ocorrencias: AlertTriangle,
  tarefas: ListChecks,
  rotinas: Repeat,
  lancamentos: Wallet,
  assistencias: LifeBuoy,
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

async function searchOccurrences(queryClient: ReturnType<typeof useQueryClient>) {
  const service = createOccurrenceService();
  const items = await queryClient.ensureQueryData({
    queryKey: queryKeys.occurrences.list(),
    queryFn: () => service.list(),
  });
  return items.map((item) => ({
    scope: "ocorrencias" as const,
    id: item.id,
    title: item.titulo,
    subtitle: item.assistencia?.numero_assistencia
      ? `Assistência ${item.assistencia.numero_assistencia}`
      : undefined,
    path: `/app/ocorrencias/${item.id}`,
  }));
}

async function searchTasks(queryClient: ReturnType<typeof useQueryClient>) {
  const service = createTaskService();
  const items = await queryClient.ensureQueryData({
    queryKey: queryKeys.tasks.list(),
    queryFn: () => service.listTasks(),
  });
  return items.map((item) => ({
    scope: "tarefas" as const,
    id: item.id,
    title: item.titulo,
    subtitle: item.posto?.nome ?? undefined,
    path: `/app/tarefas-rotinas/${item.id}`,
  }));
}

async function searchRoutines(queryClient: ReturnType<typeof useQueryClient>) {
  const service = createTaskService();
  const items = await queryClient.ensureQueryData({
    queryKey: queryKeys.routines.list(),
    queryFn: () => service.listRoutines(),
  });
  return items.map((item) => ({
    scope: "rotinas" as const,
    id: item.id,
    title: item.nome,
    subtitle: item.posto?.nome ?? undefined,
    path: `/app/tarefas-rotinas/rotinas/${item.id}/editar`,
  }));
}

async function searchLancamentos(queryClient: ReturnType<typeof useQueryClient>) {
  const service = createLancamentoService();
  const items = await queryClient.ensureQueryData({
    queryKey: queryKeys.lancamentos.list({}),
    queryFn: () => service.list({}),
  });
  return items.map((item) => ({
    scope: "lancamentos" as const,
    id: item.id,
    title: item.descricao,
    subtitle: item.recurso ?? item.posto?.nome ?? undefined,
    path: `/app/custos-extras/${item.id}`,
  }));
}

async function searchAssistencias(queryClient: ReturnType<typeof useQueryClient>) {
  const service = createAssistanceService();
  const result = await queryClient.ensureQueryData({
    queryKey: queryKeys.assistencias.list(),
    queryFn: () => service.list(),
  });
  return result.itens.map((item) => ({
    scope: "assistencias" as const,
    id: item.assistencia_id,
    title: item.numero_assistencia,
    subtitle: item.cliente ?? item.posto?.nome ?? undefined,
    path: `/app/assistencias-mms/${item.assistencia_id}`,
  }));
}

/** Debounces `value`; returns the previous value until `delay` has elapsed without changes. */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

export interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<SearchScope | "todos">("todos");
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const hasQuery = debouncedQuery.trim().length > 0;

  // Fecha o dialog e limpa o estado local num unico ponto (sem efeito
  // reagindo a `open`), evitando setState em cascata dentro de um effect.
  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setScopeFilter("todos");
      setResults([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !hasQuery) return;
    const term = normalize(debouncedQuery.trim());
    let cancelled = false;
    // A busca é um fetch assíncrono externo (cache do TanStack Query); marcar
    // o início do carregamento é a sincronização feita por este effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      searchOccurrences(queryClient),
      searchTasks(queryClient),
      searchRoutines(queryClient),
      searchLancamentos(queryClient),
      searchAssistencias(queryClient),
    ])
      .then(([occurrences, tasks, routines, lancamentos, assistencias]) => {
        if (cancelled) return;
        const all = [...occurrences, ...tasks, ...routines, ...lancamentos, ...assistencias];
        const matched = all.filter(
          (item) =>
            normalize(item.title).includes(term) ||
            (item.subtitle && normalize(item.subtitle).includes(term)),
        );
        setResults(matched);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, hasQuery, debouncedQuery, queryClient]);

  const groups = useMemo(() => {
    if (!hasQuery) return new Map<SearchScope, SearchResult[]>();
    const filtered =
      scopeFilter === "todos" ? results : results.filter((item) => item.scope === scopeFilter);
    const byScope = new Map<SearchScope, SearchResult[]>();
    for (const item of filtered) {
      const bucket = byScope.get(item.scope) ?? [];
      if (bucket.length < MAX_PER_GROUP) bucket.push(item);
      byScope.set(item.scope, bucket);
    }
    return byScope;
  }, [results, scopeFilter, hasQuery]);

  const totalVisible = [...groups.values()].reduce((sum, items) => sum + items.length, 0);

  function handleSelect(result: SearchResult) {
    handleOpenChange(false);
    navigate(result.path);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-zinc-800 bg-zinc-900 p-0 text-zinc-100 sm:max-w-[580px]"
      >
        <DialogTitle className="sr-only">Busca global</DialogTitle>
        <Command shouldFilter={false} className="bg-zinc-900 text-zinc-100">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar ocorrências, tarefas, rotinas, lançamentos, assistências…"
          className="text-zinc-100 placeholder:text-zinc-500"
        />

        <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800 px-3 py-2">
          <button
            type="button"
            onClick={() => setScopeFilter("todos")}
            className={cn(
              "rounded-lg px-3 py-1 text-[12px] font-medium transition-colors",
              scopeFilter === "todos"
                ? "border border-zinc-500 bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
            )}
          >
            Todos
          </button>
          {(Object.keys(SCOPE_LABELS) as SearchScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setScopeFilter(scope)}
              className={cn(
                "rounded-lg px-3 py-1 text-[12px] font-medium transition-colors",
                scopeFilter === scope
                  ? "border border-zinc-500 bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}
            >
              {SCOPE_LABELS[scope]}
            </button>
          ))}
        </div>

        <CommandList className="bg-zinc-950 text-zinc-100">
          {!hasQuery ? (
            <CommandEmpty className="text-zinc-500">Digite para buscar.</CommandEmpty>
          ) : loading ? (
            <CommandEmpty className="text-zinc-500">Buscando…</CommandEmpty>
          ) : totalVisible === 0 ? (
            <CommandEmpty className="text-zinc-500">Nenhum resultado encontrado.</CommandEmpty>
          ) : (
            [...groups.entries()].map(([scope, items]) => {
              const Icon = SCOPE_ICONS[scope];
              return (
                <CommandGroup key={scope} heading={SCOPE_LABELS[scope]}>
                  {items.map((item) => (
                    <CommandItem
                      key={`${item.scope}-${item.id}`}
                      value={`${item.scope}-${item.id}-${item.title}`}
                      onSelect={() => handleSelect(item)}
                      className="gap-2 text-zinc-100 data-[selected=true]:bg-zinc-800"
                    >
                      <Icon className="size-4 shrink-0 text-zinc-400" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] font-medium">{item.title}</span>
                        {item.subtitle ? (
                          <span className="truncate text-[11px] text-zinc-500">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          )}
        </CommandList>

        <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>Navegar</span>
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
              ↑
            </kbd>
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
              ↓
            </kbd>
            <span>Selecionar</span>
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
              Enter
            </kbd>
          </div>
          <div className="flex items-center gap-2">
            <span>Fechar</span>
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300">
              esc
            </kbd>
          </div>
        </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
