import type { CalendarStateOptions, DateValue } from "@litopis/core";

export type { DateValue } from "@litopis/core";

export interface DatePickerOptions extends CalendarStateOptions {
  readonly calendarMode?: DatePickerCalendarMode;
  readonly inputFormat?: DateFieldFormat;
  readonly label?: string;
  readonly onValueChange?: (value: DateValue | null) => void;
  readonly showOutsideDays?: boolean;
  readonly showSeason?: boolean;
  readonly showTodayButton?: boolean;
  readonly targetSize?: DatePickerTargetSize;
  readonly todayLabel?: string;
}

export interface DatePickerController {
  close(): void;
  destroy(): void;
  getDate(): DateValue | null;
  getValue(): string;
  goToToday(): void;
  open(): void;
  setDate(value: DateValue | null): void;
  setOptions(options: Partial<DatePickerOptions>): void;
  setVisibleMonth(value: DateValue): void;
  toggle(): void;
}

export type DateFieldFormat = "yyyy-mm-dd" | "dd.mm.yyyy" | "mm/dd/yyyy";

export type DatePickerCalendarMode = "inline" | "popover";

export type DatePickerTargetSize = "comfortable" | "compact";

export interface DateFieldOptions {
  readonly format?: DateFieldFormat;
  readonly label?: string;
  readonly max?: DateValue;
  readonly min?: DateValue;
  readonly value?: DateValue | null;
}

export interface DateFieldController {
  destroy(): void;
  getDate(): DateValue | null;
  getValue(): string;
  isValid(): boolean;
  setDate(value: DateValue | null): void;
}
