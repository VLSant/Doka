import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Select, Textarea } from "../../../components/ui/FormControls";
import { StatusBadge as SharedStatusBadge } from "../../../components/ui/StatusBadge";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <Select label={label} {...props}>
      {children}
    </Select>
  );
}

export function TextareaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <Textarea label={label} rows={3} {...props} />;
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <SharedStatusBadge tone={active ? "success" : "neutral"}>
      {active ? "Ativo" : "Inativo"}
    </SharedStatusBadge>
  );
}
