import { describe, expect, expectTypeOf, it } from "vitest";
import type { DateValue } from "@litopis/core";
import { createDatePicker } from "./create-date-picker";
import type { DatePickerRange } from "./types";

type DateValueSingle = DateValue | null;
type NativeDateSingle = Date | null;
type DateValueRange = DatePickerRange<"date-value">;
type NativeDateRange = DatePickerRange<"date">;

function assertControllerInference(root: HTMLElement): void {
  const dateValueSinglePicker = createDatePicker(root);
  const nativeDateSinglePicker = createDatePicker(root, {
    valueAs: "date",
    onValueChange(value) {
      expectTypeOf(value).toEqualTypeOf<NativeDateSingle>();
    },
  });
  const dateValueRangePicker = createDatePicker(root, {
    selection: "range",
    onRangeChange(value) {
      expectTypeOf(value).toEqualTypeOf<DateValueRange>();
    },
  });
  const nativeDateRangePicker = createDatePicker(root, {
    selection: "range",
    valueAs: "date",
    onRangeChange(value) {
      expectTypeOf(value).toEqualTypeOf<NativeDateRange>();
    },
  });

  expectTypeOf(dateValueSinglePicker.getValue()).toEqualTypeOf<DateValueSingle>();
  expectTypeOf(nativeDateSinglePicker.getValue()).toEqualTypeOf<NativeDateSingle>();
  expectTypeOf(dateValueRangePicker.getValue()).toEqualTypeOf<DateValueRange>();
  expectTypeOf(nativeDateRangePicker.getValue()).toEqualTypeOf<NativeDateRange>();
}

describe("date picker type inference", () => {
  it("checks selection and valueAs literals at compile time", () => {
    expect(assertControllerInference).toBeTypeOf("function");
  });
});
