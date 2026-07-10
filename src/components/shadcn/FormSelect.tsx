import * as React from "react";
import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { cn } from "../../lib/utils";

/**
 * Sentinel used internally to represent the "empty value" option, since Radix
 * Select does not allow items with an empty string value. Converted back to
 * "" (and vice-versa) at the edges so external call sites keep working with
 * the same "" semantics as the native `<select>`/`FormControls.Select`.
 */
const EMPTY_VALUE_SENTINEL = "__all__";

export interface FormSelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface FormSelectProps {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Options list. To represent the "no filter"/"empty" option, use value: "". */
  options: FormSelectOption[];
  /** Current value. Use "" for the empty/placeholder option. */
  value: string;
  /** Mimics a native `<select>` onChange: receives the new string value ("" for empty). */
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
}

function toSentinel(value: string) {
  return value === "" ? EMPTY_VALUE_SENTINEL : value;
}

function fromSentinel(value: string) {
  return value === EMPTY_VALUE_SENTINEL ? "" : value;
}

/**
 * Lower-friction wrapper over the shadcn/Radix Select, matching the API shape
 * used by the legacy `FormControls.Select` (`label` + `value` + string-based
 * `onChange`) so existing call sites can migrate with minimal churn.
 */
export function FormSelect({
  label,
  hint,
  error,
  fullWidth = true,
  id,
  name,
  required,
  disabled,
  placeholder,
  options,
  value,
  onChange,
  className,
  triggerClassName,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FormSelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy =
    [error ? errorId : hint ? hintId : undefined, ariaDescribedBy].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", className)}>
      {label ? (
        <Label htmlFor={controlId}>
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5 text-destructive">
              {" "}
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      <Select
        value={toSentinel(value)}
        onValueChange={(next) => onChange(fromSentinel(next))}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectTrigger
          id={controlId}
          className={cn(fullWidth && "w-full", triggerClassName)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={toSentinel(option.value)}
              value={toSentinel(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
