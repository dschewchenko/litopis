import type {
  CalendarGranularity,
  CalendarStateOptions,
  DateDisabledPredicate,
  DateValue,
} from "@litopis/core";

export type { DateValue } from "@litopis/core";
export type { CalendarGranularity, DateRange } from "@litopis/core";
export type { DateDisabledPredicate } from "@litopis/core";

/** Selects the JavaScript representation used by picker selection APIs. */
export type DatePickerValueAs = "date-value" | "date";

export type DatePickerValue<ValueAs extends DatePickerValueAs> = ValueAs extends "date"
  ? Date
  : DateValue;

export interface DatePickerRange<ValueAs extends DatePickerValueAs> {
  readonly end: DatePickerValue<ValueAs> | null;
  readonly start: DatePickerValue<ValueAs> | null;
}

/** Native form names for a split range field. */
export interface DatePickerRangeNames {
  readonly end: string;
  readonly start: string;
}

/** Visible labels for the two fields of a split range. */
export interface DatePickerRangeLabels {
  readonly end: string;
  readonly start: string;
}

/** Labels used by the date picker controls and its accessible status messages. */
export interface DatePickerMessages {
  readonly clear: string;
  readonly chooseMonth: string;
  readonly chooseMonthAndYear: string;
  readonly chooseYear: string;
  readonly currentYearPage: string;
  readonly date: string;
  readonly dateOnOrAfter: (date: string) => string;
  readonly dateOnOrBefore: (date: string) => string;
  readonly end: string;
  readonly enterValidDate: string;
  readonly nextMonth: string;
  readonly nextYear: string;
  readonly nextYears: string;
  readonly previousMonth: string;
  readonly previousYear: string;
  readonly previousYears: string;
  readonly seasons: DatePickerSeasonMessages;
  readonly start: string;
  readonly today: string;
}

/** Seasonal labels displayed when the optional season text is enabled. */
export interface DatePickerSeasonMessages {
  readonly autumn: string;
  readonly spring: string;
  readonly summer: string;
  readonly winter: string;
}

type OptionalMessageOverrides<T> = {
  readonly [Key in keyof T]?: T[Key] | undefined;
};

/** Optional message overrides merged with the built-in English defaults. */
export type DatePickerMessageOverrides = OptionalMessageOverrides<
  Omit<DatePickerMessages, "seasons">
> & {
  readonly seasons?: OptionalMessageOverrides<DatePickerSeasonMessages> | undefined;
};

export type DatePickerSelectionValue<
  ValueAs extends DatePickerValueAs,
  Selection extends DatePickerSelection,
> = Selection extends "range" ? DatePickerRange<ValueAs> : DatePickerValue<ValueAs> | null;

export interface DatePickerOptions<
  ValueAs extends DatePickerValueAs = "date-value",
  Selection extends DatePickerSelection = DatePickerSelection,
> extends Omit<CalendarStateOptions, "range" | "selected" | "selectionMode"> {
  readonly clearButton?: boolean;
  readonly clearLabel?: string;
  readonly closeOnSelect?: boolean;
  readonly messages?: DatePickerMessageOverrides;
  readonly mode?: DatePickerMode;
  readonly format?: DateFieldFormat;
  readonly label?: string | DatePickerRangeLabels;
  readonly onValueChange?: (value: DatePickerValue<ValueAs> | null) => void;
  readonly onRangeChange?: (value: DatePickerRange<ValueAs>) => void;
  readonly range?: DatePickerRange<ValueAs>;
  readonly selected?: DatePickerValue<ValueAs> | null;
  readonly selection?: Selection;
  readonly layout?: DatePickerLayout;
  readonly name?: string | DatePickerRangeNames;
  /** Notifies when navigation changes the first day of the visible month. */
  readonly onVisibleMonthChange?: (value: DateValue) => void;
  readonly granularity?: CalendarGranularity;
  readonly panels?: DatePickerPanels;
  readonly outsideDays?: boolean;
  readonly season?: boolean;
  readonly todayButton?: boolean;
  readonly size?: DatePickerSize;
  readonly todayLabel?: string;
  readonly disabledDates?: readonly DateValue[];
  readonly isDateDisabled?: DateDisabledPredicate;
  /** Chooses DateValue objects or native local Date instances for selection APIs. */
  readonly valueAs?: ValueAs;
}

export interface DatePickerRangeOptions<
  ValueAs extends DatePickerValueAs = "date-value",
> extends DatePickerOptions<ValueAs, "range"> {
  readonly selection: "range";
}

export interface DatePickerController<
  ValueAs extends DatePickerValueAs = "date-value",
  Selection extends DatePickerSelection = DatePickerSelection,
> {
  close(): void;
  destroy(): void;
  getInputValue(): string;
  getISOValue(): string;
  getValue(): DatePickerSelectionValue<ValueAs, Selection>;
  goToToday(): void;
  open(): void;
  setDate(value: DatePickerValue<ValueAs> | null): void;
  setRange(value: DatePickerRange<ValueAs>): void;
  setOptions(options: DatePickerOptions<ValueAs>): void;
  setVisibleMonth(value: DateValue): void;
  toggle(): void;
}

export type DateFieldFormat = "yyyy-mm-dd" | "dd.mm.yyyy" | "dd/mm/yyyy" | "mm/dd/yyyy";

export type DatePickerLayout = "single" | "split";

export type DatePickerSelection = "single" | "range";

export type DatePickerPanels = 1 | 2 | "auto";

export type DatePickerMode = "inline" | "popover";

export type DatePickerSize = "comfortable" | "compact";

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
  getISOValue(): string;
  isValid(): boolean;
  setDate(value: DateValue | null): void;
}
