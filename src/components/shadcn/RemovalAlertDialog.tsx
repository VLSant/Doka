import { useState } from "react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/FormControls";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface RemovalAlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  justificationLabel?: string;
  loading?: boolean;
  requireJustification?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justification: string) => void;
}

export function RemovalAlertDialog({
  open,
  title,
  description,
  confirmLabel = "Remover",
  cancelLabel = "Cancelar",
  justificationLabel = "Justificativa",
  loading = false,
  requireJustification = false,
  onOpenChange,
  onConfirm,
}: RemovalAlertDialogProps) {
  const [justification, setJustification] = useState("");
  const blocked = requireJustification && !justification.trim();

  function close(nextOpen: boolean) {
    if (!nextOpen) setJustification("");
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={close}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireJustification ? (
          <Textarea
            label={justificationLabel}
            value={justification}
            rows={3}
            disabled={loading}
            onChange={(event) => setJustification(event.target.value)}
          />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <Button
            variant="danger"
            loading={loading}
            disabled={blocked}
            onClick={() => onConfirm(justification.trim())}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
