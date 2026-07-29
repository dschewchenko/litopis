import { createApp, h, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import type { DateRange } from "@litopis/dom";
import type { LitopisDatePickerModelValue, LitopisDatePickerRangeEndpoint } from "./index";
import { LitopisDatePicker } from "./index";

describe("LitopisDatePicker for Vue", () => {
  it("mounts the shared interactive picker contract", async () => {
    const host = document.createElement("div");
    const range = ref<DateRange>({
      end: { day: 18, month: 6, year: 2026 },
      start: { day: 12, month: 6, year: 2026 },
    });

    function updateModelValue(nextValue: LitopisDatePickerModelValue): void {
      if (isDateRange(nextValue)) {
        range.value = nextValue;
      }
    }

    const app = createApp({
      render: () =>
        h(LitopisDatePicker, {
          clearButton: true,
          clearLabel: "Clear selection",
          closeOnSelect: false,
          layout: "split",
          mode: "popover",
          modelValue: range.value,
          "onUpdate:modelValue": updateModelValue,
          selection: "range",
          today: { day: 25, month: 6, year: 2026 },
        }),
    });

    app.mount(host);
    await nextTick();

    const clearButton = host.querySelector<HTMLButtonElement>(".litopis-clear-button")!;
    expect(host.querySelectorAll("[role='combobox']")).toHaveLength(2);
    expect(clearButton.textContent).toBe("Clear selection");
    host.querySelector<HTMLInputElement>(".litopis-input")?.click();
    expect(host.querySelector<HTMLElement>(".litopis")?.dataset.calendarOpen).toBe("true");
    clearButton.click();
    await nextTick();
    expect(host.querySelector<HTMLInputElement>(".litopis-input")?.value).toBe("");
    expect(clearButton.disabled).toBe(true);
    expect(range.value).toEqual({ end: null, start: null });
    app.unmount();
  });

  it("syncs range endpoints through named v-model bindings", async () => {
    const host = document.createElement("div");
    const from = ref<LitopisDatePickerRangeEndpoint>({ day: 12, month: 6, year: 2026 });
    const to = ref<LitopisDatePickerRangeEndpoint>({ day: 18, month: 6, year: 2026 });

    function updateFrom(nextValue: LitopisDatePickerRangeEndpoint): void {
      from.value = nextValue;
    }

    function updateTo(nextValue: LitopisDatePickerRangeEndpoint): void {
      to.value = nextValue;
    }

    const app = createApp({
      render: () =>
        h(LitopisDatePicker, {
          clearButton: true,
          from: from.value,
          "onUpdate:from": updateFrom,
          "onUpdate:to": updateTo,
          selection: "range",
          to: to.value,
        }),
    });

    app.mount(host);
    await nextTick();

    host.querySelector<HTMLButtonElement>(".litopis-clear-button")?.click();
    await nextTick();

    expect(from.value).toBeNull();
    expect(to.value).toBeNull();
    app.unmount();
  });
});

function isDateRange(value: LitopisDatePickerModelValue): value is DateRange {
  return typeof value === "object" && value !== null && "start" in value && "end" in value;
}
