import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { describe, expect, it } from "vitest";
import { LitopisDatePicker } from "./index";

describe("LitopisDatePicker for React", () => {
  it("uses a custom input child", () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    flushSync(() => {
      root.render(
        createElement(
          LitopisDatePicker,
          { value: { day: 25, month: 6, year: 2026 } },
          createElement("input", {
            className: "custom-input",
            placeholder: "Choose a date",
            slot: "input",
          }),
        ),
      );
    });

    const input = host.querySelector<HTMLInputElement>(".custom-input");
    expect(input?.classList.contains("litopis-input")).toBe(true);
    expect(input?.placeholder).toBe("Choose a date");
    expect(input?.value).toBe("2026-06-25");
    flushSync(() => root.unmount());
  });

  it("forwards the shared interactive picker contract", () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    flushSync(() => {
      root.render(
        createElement(LitopisDatePicker, {
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
      );
    });

    const clearButton = host.querySelector<HTMLButtonElement>(".litopis-clear-button")!;
    expect(host.querySelectorAll("[role='combobox']")).toHaveLength(2);
    expect(clearButton.textContent).toBe("Clear selection");
    expect(host.querySelector<HTMLElement>(".litopis-calendar-footer")?.hidden).toBe(false);
    host.querySelector<HTMLInputElement>(".litopis-input")?.click();
    expect(host.querySelector<HTMLElement>(".litopis")?.dataset.calendarOpen).toBe("true");
    clearButton.click();
    expect(host.querySelector<HTMLInputElement>(".litopis-input")?.value).toBe("");
    expect(clearButton.disabled).toBe(true);

    flushSync(() => {
      root.render(
        createElement(LitopisDatePicker, {
          today: { day: 25, month: 6, year: 2026 },
        }),
      );
    });
    expect(host.querySelector<HTMLElement>(".litopis-calendar-footer")?.hidden).toBe(true);
    flushSync(() => root.unmount());
  });
});
