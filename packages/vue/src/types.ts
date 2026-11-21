import type {
  DatePickerController,
  DatePickerOptions,
  DatePickerSelection,
  DatePickerSelectionValue,
  DatePickerValue,
  DatePickerValueAs,
} from "@litopis/dom";

export type LitopisDatePickerModelValue = DatePickerSelectionValue<
  DatePickerValueAs,
  DatePickerSelection
>;

/** One endpoint of a range bound with `v-model:from` or `v-model:to`. */
export type LitopisDatePickerRangeEndpoint = DatePickerValue<DatePickerValueAs> | null;

export type LitopisDatePickerOptions = Omit<
  DatePickerOptions<DatePickerValueAs, DatePickerSelection>,
  "onRangeChange" | "onValueChange" | "onVisibleMonthChange" | "range" | "selected"
>;

/** Vue can supply explicit `undefined` values for unset option props. */
export type LitopisDatePickerRawOptions = {
  readonly [Key in keyof LitopisDatePickerOptions]?: LitopisDatePickerOptions[Key] | undefined;
};

export type LitopisDatePickerControllerOptions = DatePickerOptions<
  DatePickerValueAs,
  DatePickerSelection
>;

export interface LitopisDatePickerProps extends LitopisDatePickerOptions {
  readonly from?: LitopisDatePickerRangeEndpoint;
  readonly modelValue?: LitopisDatePickerModelValue;
  readonly to?: LitopisDatePickerRangeEndpoint;
}

export type LitopisDatePickerController = DatePickerController<
  DatePickerValueAs,
  DatePickerSelection
>;
