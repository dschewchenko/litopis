export interface DateValue {
  readonly day: number;
  readonly month: number;
  readonly year: number;
}

export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SelectionMode = "single" | "range";

export interface DateRangeValue {
  readonly end: DateValue | null;
  readonly start: DateValue | null;
}

export interface CalendarGridCell {
  readonly date: DateValue;
  readonly disabled: boolean;
  readonly outsideMonth: boolean;
  readonly selected: boolean;
  readonly today: boolean;
}

export interface CalendarGrid {
  readonly label: string;
  readonly weeks: readonly (readonly CalendarGridCell[])[];
}

export interface CalendarStateOptions {
  readonly firstDayOfWeek?: FirstDayOfWeek;
  readonly locale?: string;
  readonly max?: DateValue;
  readonly min?: DateValue;
  readonly mode?: SelectionMode;
  readonly selected?: DateValue | DateRangeValue | null;
  readonly today?: DateValue;
}

export interface CalendarState {
  readonly firstDayOfWeek: FirstDayOfWeek;
  readonly focusedDate: DateValue;
  readonly grid: CalendarGrid;
  readonly locale: string;
  readonly max: DateValue | null;
  readonly min: DateValue | null;
  readonly mode: SelectionMode;
  readonly selected: DateValue | DateRangeValue | null;
  readonly today: DateValue;
  readonly visibleMonth: DateValue;
}

export type CalendarMove =
  | "next-day"
  | "previous-day"
  | "next-week"
  | "previous-week"
  | "month-start"
  | "month-end"
  | "next-month"
  | "previous-month"
  | "next-year"
  | "previous-year";
