import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/shadcn/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex h-8 w-full items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(buttonVariants({ variant: "outline" }), "absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
        button_next: cn(buttonVariants({ variant: "outline" }), "absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(buttonVariants({ variant: "ghost" }), "size-8 p-0 font-normal aria-selected:opacity-100"),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className="size-4" />;
          }
          if (orientation === "right") {
            return <ChevronRightIcon className="size-4" />;
          }
          return <ChevronDownIcon className="size-4" />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
