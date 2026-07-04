import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import "./FormControls.css";

interface FieldFrameProps {
  id: string;
  label?: ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

function FieldFrame({ id, label, required, hint, error, children, className }: FieldFrameProps) {
  return (
    <div className={["doka-field", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="doka-field__label" htmlFor={id}>
          {label}
          {required ? <span className="doka-field__required" aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p id={`${id}-error`} className="doka-field__message doka-field__message--error">{error}</p> : null}
      {!error && hint ? <p id={`${id}-hint`} className="doka-field__message">{hint}</p> : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string, current?: string) {
  return [error ? `${id}-error` : hint ? `${id}-hint` : undefined, current]
    .filter(Boolean)
    .join(" ") || undefined;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: string;
  error?: string;
}

export function Select({ label, hint, error, id, className, required, children, ...props }: SelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <FieldFrame id={controlId} label={label} hint={hint} error={error} required={required} className={className}>
      <select
        id={controlId}
        className="doka-field__control"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(controlId, error, hint, props["aria-describedby"])}
        {...props}
      >
        {children}
      </select>
    </FieldFrame>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, id, className, required, ...props }: TextareaProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <FieldFrame id={controlId} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={controlId}
        className="doka-field__control doka-field__control--textarea"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(controlId, error, hint, props["aria-describedby"])}
        {...props}
      />
    </FieldFrame>
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  hint?: string;
}

export function Checkbox({ label, hint, id, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  return (
    <div className={["doka-checkbox", className].filter(Boolean).join(" ")}>
      <input id={controlId} type="checkbox" className="doka-checkbox__control" {...props} />
      <label htmlFor={controlId} className="doka-checkbox__label">{label}</label>
      {hint ? <p id={`${controlId}-hint`} className="doka-field__message">{hint}</p> : null}
    </div>
  );
}
