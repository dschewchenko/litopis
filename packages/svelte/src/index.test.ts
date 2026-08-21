import { describe, expect, it } from "vitest";
import { litopisDatePicker } from "./index";

describe("litopisDatePicker for Svelte", () => {
  it("uses a custom input child", () => {
    const host = document.createElement("div");
    const input = document.createElement("input");
    input.className = "custom-input";
    input.placeholder = "Choose a date";
    input.setAttribute("slot", "input");
    host.append(input);

    const action = litopisDatePicker(host, {
      selected: { day: 25, month: 6, year: 2026 },
    });

    expect(host.querySelector<HTMLInputElement>(".custom-input")).toBe(input);
    expect(input.classList.contains("litopis-input")).toBe(true);
    expect(input.placeholder).toBe("Choose a date");
    expect(input.value).toBe("2026-06-25");
    action.destroy();
    expect(host.querySelector("[slot='input']")).toBe(input);
  });

  it("mounts and updates the shared interactive picker contract", () => {
    const host = document.createElement("div");
    const action = litopisDatePicker(host, {
      today: { day: 25, month: 6, year: 2026 },
    });

    action.update({
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
    });

    const clearButton = host.querySelector<HTMLButtonElement>(".litopis-clear-button")!;
    expect(host.querySelectorAll("[role='combobox']")).toHaveLength(2);
    expect(clearButton.textContent).toBe("Clear selection");
    host.querySelector<HTMLInputElement>(".litopis-input")?.click();
    expect(host.dataset.calendarOpen).toBe("true");
    clearButton.click();
    expect(host.querySelector<HTMLInputElement>(".litopis-input")?.value).toBe("");
    expect(clearButton.disabled).toBe(true);
    action.destroy();
    expect(host.childElementCount).toBe(0);
  });
});
