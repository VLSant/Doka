import { Children, isValidElement, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Textarea } from "../../../components/ui/FormControls";
import { StatusBadge as SharedStatusBadge } from "../../../components/ui/StatusBadge";
import { FormSelect, type FormSelectOption } from "../../../components/shadcn/FormSelect";

function optionsFromChildren(children: ReactNode): FormSelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: ReactNode }>(child)) {
      return [];
    }
    return [
      {
        value: String(child.props.value ?? ""),
        label: child.props.children,
        disabled: child.props.disabled,
      },
    ];
  });
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  children: ReactNode;
}

export function SelectField({ label, value, onChange, disabled, required, children }: SelectFieldProps) {
  return (
    <FormSelect
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      options={optionsFromChildren(children)}
    />
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
