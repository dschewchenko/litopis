import { createApp, h, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import type { DateRange, DateValue } from "@litopis/dom";
import type { LitopisDatePickerModelValue, LitopisDatePickerRangeEndpoint } from "./index";
import { LitopisDatePicker } from "./index";

describe("LitopisDatePicker for Vue", () => {
  it("renders initially unavailable dates as non-selectable in the mounted grid", async () => {
    const host = document.createElement("div");
    const selected = ref<DateValue | null>(null);
    const app = createApp({
      render: () =>
        h(LitopisDatePicker, {
          disabledDates: [{ day: 27, month: 9, year: 2026 }],
          modelValue: selected.value,
          "onUpdate:modelValue"(value: LitopisDatePickerModelValue) {
            selected.value = value === null || isDateValue(value) ? value : null;
          },
          today: { day: 25, month: 9, year: 2026 },
        }),
    });

    app.mount(host);
    await nextTick();

    const unavailable = host.querySelector<HTMLButtonElement>(
      ".litopis-day[data-iso-date='2026-09-27'] button",
    )!;
    expect(unavailable.disabled).toBe(true);
    expect(unavailable.getAttribute("aria-disabled")).toBe("true");
    unavailable.click();
    expect(selected.value).toBeNull();
    app.unmount();
  });

  it("uses the input slot", async () => {
    const host = document.createElement("div");
    const app = createApp({
      render: () =>
        h(
          LitopisDatePicker,
          { modelValue: { day: 25, month: 6, year: 2026 } },
          {
            input: () => h("input", { class: "custom-input", placeholder: "Choose a date" }),
          },
        ),
    });

    app.mount(host);
    await nextTick();

    const input = host.querySelector<HTMLInputElement>(".custom-input");
    expect(input?.classList.contains("litopis-input")).toBe(true);
    expect(input?.getAttribute("slot")).toBe("input");
    expect(input?.placeholder).toBe("Choose a date");
    expect(input?.value).toBe("2026-06-25");
    app.unmount();
  });

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

  it("reactively applies disabled dates and emits visible-month changes", async () => {
    const host = document.createElement("div");
    const selected = ref<DateValue | null>({ day: 25, month: 6, year: 2026 });
    const disabledDates = ref<DateValue[]>([]);
    const visibleMonths: DateValue[] = [];

    const app = createApp({
      render: () =>
        h(LitopisDatePicker, {
          disabledDates: disabledDates.value,
          modelValue: selected.value,
          "onUpdate:modelValue"(value: LitopisDatePickerModelValue) {
            selected.value = value === null || isDateValue(value) ? value : null;
          },
          onVisibleMonthChange(value: DateValue) {
            visibleMonths.push(value);
          },
          today: { day: 25, month: 6, year: 2026 },
        }),
    });

    app.mount(host);
    await nextTick();
    disabledDates.value = [{ day: 25, month: 6, year: 2026 }];
    await nextTick();

    expect(selected.value).toBeNull();
    expect(host.querySelector<HTMLInputElement>(".litopis-input")?.value).toBe("");
    host.querySelector<HTMLButtonElement>(".litopis-nav-button[data-direction='next']")!.click();
    expect(visibleMonths).toEqual([{ day: 1, month: 7, year: 2026 }]);

    disabledDates.value = [{ day: 2, month: 7, year: 2026 }];
    await nextTick();

    expect(host.querySelector(".litopis-caption-label")?.textContent).toContain("July");
    expect(visibleMonths).toEqual([{ day: 1, month: 7, year: 2026 }]);
    expect(
      host
        .querySelector(".litopis-day[data-iso-date='2026-07-02'] button")
        ?.getAttribute("aria-disabled"),
    ).toBe("true");
    app.unmount();
  });
});

function isDateRange(value: LitopisDatePickerModelValue): value is DateRange {
  return typeof value === "object" && value !== null && "start" in value && "end" in value;
}

function isDateValue(
  value: Exclude<LitopisDatePickerModelValue, DateRange | null>,
): value is DateValue {
  return !(value instanceof Date);
}
