import { describe, expect, it } from "vitest";
import type { DateValue } from "@litopis/core";
import { createDatePicker } from "./create-date-picker";

describe("availability refresh navigation", () => {
  it("keeps the displayed month when an asynchronous availability snapshot arrives", () => {
    const root = document.createElement("div");
    const today: DateValue = { day: 25, month: 6, year: 2026 };
    const visibleMonths: DateValue[] = [];
    const onVisibleMonthChange = (value: DateValue) => visibleMonths.push(value);
    const picker = createDatePicker(root, { today, locale: "en-US", onVisibleMonthChange });
    try {
      picker.setVisibleMonth({ day: 1, month: 7, year: 2026 });
      const julyCaption = root.querySelector(".litopis-caption")?.textContent;
      expect(julyCaption).toContain("July");

      picker.setOptions({
        today,
        locale: "en-US",
        disabledDates: [{ day: 2, month: 7, year: 2026 }],
        onVisibleMonthChange,
      });

      expect(root.querySelector(".litopis-caption")?.textContent).toBe(julyCaption);
      expect(visibleMonths).toEqual([{ day: 1, month: 7, year: 2026 }]);
      expect(
        root.querySelector("[data-iso-date='2026-07-02'] button")?.getAttribute("aria-disabled"),
      ).toBe("true");
    } finally {
      picker.destroy();
    }
  });
});
