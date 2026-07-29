import { render } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { LitopisDatePicker } from "./index";

describe("LitopisDatePicker for Solid", () => {
  it("mounts the shared interactive picker contract", () => {
    const host = document.createElement("div");
    const dispose = render(
      () =>
        LitopisDatePicker({
          class: "custom-picker",
          clearButton: true,
          clearLabel: "Clear selection",
          closeOnSelect: false,
          layout: "split",
          mode: "popover",
          range: {
            end: { day: 18, month: 6, year: 2026 },
            start: { day: 12, month: 6, year: 2026 },
          },
          selection: "range",
          today: { day: 25, month: 6, year: 2026 },
        }),
      host,
    );

    const clearButton = host.querySelector<HTMLButtonElement>(".litopis-clear-button")!;
    expect(host.querySelectorAll("[role='combobox']")).toHaveLength(2);
    expect(clearButton.textContent).toBe("Clear selection");
    expect(host.querySelector(".litopis.custom-picker")).not.toBeNull();
    host.querySelector<HTMLInputElement>(".litopis-input")?.click();
    expect(host.querySelector<HTMLElement>(".litopis")?.dataset.calendarOpen).toBe("true");
    clearButton.click();
    expect(host.querySelector<HTMLInputElement>(".litopis-input")?.value).toBe("");
    expect(clearButton.disabled).toBe(true);
    dispose();
  });
});
