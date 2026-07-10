import * as React from "react";
import { useId, useState } from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "../../lib/utils";

const ISO_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "dd/MM/yyyy";

function parseIso(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, ISO_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

export interface DatePickerFieldProps {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** ISO date string (yyyy-MM-dd), identical to `<input type="date">` value. */
  value: string;
  /** Mimics a native date input onChange: receives the new ISO string ("" when cleared). */
  onChange: (value: string) => void;
  /** Minimum selectable date, as ISO string (yyyy-MM-dd). */
  min?: string;
  /** Maximum selectable date, as ISO string (yyyy-MM-dd). */
  max?: string;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  "aria-describedby"?: string;
}

/**
 * Lower-friction wrapper over the shadcn Popover + Calendar, matching the
 * value semantics of a native `<input type="date">` (ISO yyyy-MM-dd in/out)
 * while displaying dates in the dd/MM/yyyy format used across the app.
 */
export function DatePickerField({
  label,
  hint,
  error,
  fullWidth = true,
  id,
  name,
  required,
  disabled,
  value,
  onChange,
  min,
  max,
  placeholder = "dd/mm/aaaa",
  className,
  allowClear = true,
  "aria-describedby": ariaDescribedBy,
}: DatePickerFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy =
    [error ? errorId : hint ? hintId : undefined, ariaDescribedBy].filter(Boolean).join(" ") ||
    undefined;

  const [open, setOpen] = useState(false);

  const selectedDate = parseIso(value);
  const minDate = parseIso(min);
  const maxDate = parseIso(max);
  const displayValue = selectedDate ? format(selectedDate, DISPLAY_FORMAT, { locale: ptBR }) : "";

  function handleSelect(date: Date | undefined) {
    if (!date) {
      onChange("");
      setOpen(false);
      return;
    }
    onChange(format(date, ISO_FORMAT));
    setOpen(false);
  }

  function handleClear(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
  }

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={controlId}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "justify-start text-left font-normal",
              fullWidth && "w-full",
              !displayValue && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0 opacity-50" />
            <span className="flex-1 truncate">{displayValue || placeholder}</span>
            {allowClear && displayValue && !disabled ? (
              <XIcon
                className="ml-2 size-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={(date) => (minDate ? date < minDate : false) || (maxDate ? date > maxDate : false)}
            captionLayout="dropdown"
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
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
