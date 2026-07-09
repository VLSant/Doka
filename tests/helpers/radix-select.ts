import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Selects an option in a shadcn/Radix `FormSelect` combobox during tests.
 *
 * Unlike a native `<select>`, Radix Select renders a button trigger plus a
 * portalled listbox, so `userEvent.selectOptions` does not apply. This opens
 * the trigger (matched by its accessible label) and clicks the option whose
 * visible text matches `optionText`.
 */
export async function selectRadixOption(
  user: UserEvent,
  label: string,
  optionText: string,
): Promise<void> {
  const trigger = screen.getByLabelText(label);
  await user.click(trigger);
  const listbox = await screen.findByRole("listbox");
  const option = within(listbox).getByText(optionText);
  await user.click(option);
}

/**
 * Picks a date in a shadcn `DatePickerField` (Popover + react-day-picker
 * Calendar) during tests, given an ISO date string (yyyy-MM-dd) — the same
 * value shape the field emits via `onChange`.
 *
 * Opens the trigger (matched by its accessible label), navigates months
 * with the calendar's "next month" button until the target month/year is
 * showing, then clicks the day button (matched by its localized full-date
 * accessible name, e.g. "sábado, 4 de julho de 2026").
 */
export async function pickCalendarDate(
  user: UserEvent,
  label: string,
  isoDate: string,
): Promise<void> {
  const target = parse(isoDate, "yyyy-MM-dd", new Date());
  const trigger = screen.getByLabelText(label);
  await user.click(trigger);

  const dayName = format(target, "PPPP", { locale: ptBR });
  const targetMonthLabel = format(target, "LLLL yyyy", { locale: ptBR });

  for (let attempts = 0; attempts < 24; attempts += 1) {
    const captionCandidates = within(document.body).queryAllByText(
      new RegExp(targetMonthLabel, "i"),
    );
    if (captionCandidates.length > 0) break;
    const nextButton = within(document.body).getByRole("button", { name: /próximo mês|next month/i });
    await user.click(nextButton);
  }

  const dayButton = screen.getByRole("button", { name: new RegExp(dayName, "i") });
  await user.click(dayButton);
}
