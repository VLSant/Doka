import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

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
    <Field label={label}>
      <select {...props}>{children}</select>
    </Field>
  );
}

export function TextareaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <Field label={label}>
      <textarea rows={3} {...props} />
    </Field>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`admin-status admin-status--${active ? "active" : "inactive"}`}>
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
