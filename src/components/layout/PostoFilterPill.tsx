/**
 * Pill de filtro global de posto na topbar ("Todos os postos"), plano
 * `docs/11-plano-migracao-estilo-dracma.md` secao 4.5/5, inspirado no pill
 * "Todos os centros" do Dracma.
 *
 * Usuarios com escopo global ou mais de um posto acessivel veem um seletor
 * real (`DropdownMenu`); usuarios com um unico posto (ou nenhum) veem uma
 * representacao estatica/desabilitada com o nome do posto.
 */
import { Building2, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../shadcn/ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { usePostoFilter } from "../../app/posto-filter";

export function PostoFilterPill() {
  const { postoId, setPostoId, postos, selectable } = usePostoFilter();

  if (!selectable) {
    const label = postos[0]?.nome ?? "Sem posto";
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
        aria-disabled="true"
        title="Seu acesso está limitado a este posto."
      >
        <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </span>
    );
  }

  const currentLabel = postoId
    ? (postos.find((posto) => posto.postoId === postoId)?.nome ?? "Posto selecionado")
    : "Todos os postos";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent",
          )}
        >
          <Building2 className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          {currentLabel}
          <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onSelect={() => setPostoId(null)} className="justify-between">
          Todos os postos
          {postoId === null ? <Check className="size-4" aria-hidden="true" /> : null}
        </DropdownMenuItem>
        {postos.map((posto) => (
          <DropdownMenuItem
            key={posto.postoId}
            onSelect={() => setPostoId(posto.postoId)}
            className="justify-between"
          >
            {posto.nome}
            {postoId === posto.postoId ? <Check className="size-4" aria-hidden="true" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
