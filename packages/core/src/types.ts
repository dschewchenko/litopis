export interface DateValue {
  readonly day: number;
  readonly month: number;
  readonly year: number;
}

/** Returns whether a calendar day is unavailable for selection. */
export type DateDisabledPredicate = (value: DateValue) => boolean;

export interface DateRange {
  readonly end: DateValue | null;
  readonly start: DateValue | null;
}

export type CalendarGranularity = "day" | "month" | "year";

export type CalendarSelectionMode = "single" | "range";

export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CalendarGridCell {
  readonly date: DateValue | null;
  readonly disabled: boolean;
  readonly outsideMonth: boolean;
  readonly rangeEnd: boolean;
  readonly rangeStart: boolean;
  readonly inRange: boolean;
  readonly selected: boolean;
  readonly today: boolean;
}

export interface CalendarGrid {
  readonly label: string;
  readonly weeks: readonly (readonly CalendarGridCell[])[];
}

export interface CalendarStateOptions {
  readonly disabledDates?: readonly DateValue[];
  readonly firstDayOfWeek?: FirstDayOfWeek;
  readonly isDateDisabled?: DateDisabledPredicate;
  readonly locale?: string;
  readonly max?: DateValue;
  readonly min?: DateValue;
  readonly selected?: DateValue | null;
  readonly range?: DateRange;
  readonly selectionMode?: CalendarSelectionMode;
  readonly today?: DateValue;
}

export interface CalendarState {
  readonly disabledDates: readonly DateValue[];
  readonly firstDayOfWeek: FirstDayOfWeek;
  readonly focusedDate: DateValue;
  readonly grid: CalendarGrid;
  readonly locale: string;
  readonly max: DateValue | null;
  readonly min: DateValue | null;
  readonly isDateDisabled: DateDisabledPredicate | null;
  readonly selected: DateValue | null;
  readonly range: DateRange;
  readonly selectionMode: CalendarSelectionMode;
  readonly today: DateValue;
  readonly visibleMonth: DateValue;
}

export type CalendarMove =
  | "next-day"
  | "previous-day"
  | "next-week"
  | "previous-week"
  | "week-start"
  | "week-end"
  | "next-month"
  | "previous-month"
  | "next-year"
  | "previous-year";
