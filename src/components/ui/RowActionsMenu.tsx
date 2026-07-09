import { Copy, Edit3, MoreVertical, Trash2 } from "lucide-react";
import { IconButton } from "./IconButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../shadcn/ui/dropdown-menu";

export function RowActionsMenu({
  onEdit,
  onDuplicate,
  onRemove,
  removeLabel = "Excluir",
}: {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton aria-label="Acoes da linha" size="sm" variant="ghost">
          <MoreVertical size={16} aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit ? (
          <DropdownMenuItem onSelect={onEdit}>
            <Edit3 size={14} aria-hidden="true" />
            Editar
          </DropdownMenuItem>
        ) : null}
        {onDuplicate ? (
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy size={14} aria-hidden="true" />
            Duplicar
          </DropdownMenuItem>
        ) : null}
        {onRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2 size={14} aria-hidden="true" />
              {removeLabel}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
