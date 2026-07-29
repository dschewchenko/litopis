import type { CalendarGranularity, CalendarStateOptions, DateValue } from "@litopis/core";

export type { DateValue } from "@litopis/core";
export type { CalendarGranularity, DateRange } from "@litopis/core";

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
  readonly granularity?: CalendarGranularity;
  readonly panels?: DatePickerPanels;
  readonly outsideDays?: boolean;
  readonly season?: boolean;
  readonly todayButton?: boolean;
  readonly size?: DatePickerSize;
  readonly todayLabel?: string;
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

export type DateFieldFormat = "yyyy-mm-dd" | "dd.mm.yyyy" | "mm/dd/yyyy";

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
