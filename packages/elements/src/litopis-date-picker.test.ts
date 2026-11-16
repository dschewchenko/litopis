import { describe, expect, it, vi } from "vitest";
import type { DatePickerMessageOverrides, DatePickerRangeNames } from "@litopis/dom";
import { defineLitopisElements } from "./index";

interface TestLitopisDatePickerElement extends HTMLElement {
  name: string | DatePickerRangeNames | null;
  messages: DatePickerMessageOverrides | null;
  value: string;
}

describe("LitopisDatePickerElement", () => {
  it("defines the custom element", () => {
    defineLitopisElements();

    expect(customElements.get("litopis-date-picker")).toBeTruthy();
  });

  it("keeps an independent controller per element", () => {
    defineLitopisElements();
    const first = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;
    const second = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;

    first.setAttribute("format", "dd.mm.yyyy");
    first.setAttribute("first-day-of-week", "1");
    document.body.append(first, second);
    first.value = "2026-06-25";
    second.value = "2026-07-02";

    expect(first.value).toBe("2026-06-25");
    expect(second.value).toBe("2026-07-02");

    first.remove();
    second.remove();
  });

  it("preserves a value assigned before connection", () => {
    defineLitopisElements();
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;

    element.value = "2026-06-25";
    document.body.append(element);

    expect(element.value).toBe("2026-06-25");
    expect(element.querySelector<HTMLInputElement>(".litopis-input")?.value).toBe("2026-06-25");
    element.remove();
  });

  it("uses a slotted input across reconnects", () => {
    defineLitopisElements();
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;
    const input = document.createElement("input");
    input.className = "custom-input";
    input.setAttribute("slot", "input");
    element.append(input);

    document.body.append(element);

    expect(element.querySelector<HTMLInputElement>("[role='combobox']")).toBe(input);
    expect(input.className).toBe("custom-input");
    expect(input.classList.contains("custom-input")).toBe(true);

    element.remove();
    expect(element.querySelector("[slot='input']")).toBe(input);

    document.body.append(element);
    expect(element.querySelector<HTMLInputElement>("[role='combobox']")).toBe(input);
    expect(input.className).toBe("custom-input");
    element.remove();
  });

  it("waits for parser children before mounting while the document is loading", () => {
    defineLitopisElements();
    const readyState = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;
    const input = document.createElement("input");
    input.setAttribute("slot", "input");
    input.style.fontSize = "24px";

    try {
      document.body.append(element);

      expect(element.querySelector("[role='combobox']")).toBeNull();

      element.append(input);
      document.dispatchEvent(new Event("DOMContentLoaded"));

      expect(element.querySelector("[role='combobox']")).toBe(input);
      expect(input.className).toBe("");
      expect(input.style.fontSize).toBe("24px");
    } finally {
      element.remove();
      readyState.mockRestore();
    }
  });

  it("cancels a pending mount on disconnect and mounts after reconnect", () => {
    defineLitopisElements();
    const readyState = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;
    const input = document.createElement("input");
    input.setAttribute("slot", "input");

    try {
      document.body.append(element);
      element.append(input);
      element.remove();
      document.dispatchEvent(new Event("DOMContentLoaded"));

      expect(element.querySelector("[role='combobox']")).toBeNull();
      expect(element.classList.contains("litopis")).toBe(false);

      document.body.append(element);
      document.dispatchEvent(new Event("DOMContentLoaded"));

      expect(element.querySelector("[role='combobox']")).toBe(input);
      expect(input.className).toBe("");
    } finally {
      element.remove();
      readyState.mockRestore();
    }
  });

  it("accepts the initial value attribute and later attribute updates", () => {
    defineLitopisElements();
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;

    element.setAttribute("value", "2026-06-25");
    document.body.append(element);

    expect(element.value).toBe("2026-06-25");
    element.setAttribute("value", "2026-07-02");
    expect(element.value).toBe("2026-07-02");
    element.remove();
  });

  it("uses the same element for a named native form range", () => {
    defineLitopisElements();
    const form = document.createElement("form");
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;
    element.setAttribute("end", "2026-06-18");
    element.name = { end: "to", start: "from" };
    element.setAttribute("selection", "range");
    element.setAttribute("start", "2026-06-12");
    form.append(element);
    document.body.append(form);

    expect(element.querySelectorAll(".litopis-calendar")).toHaveLength(1);
    expect([...new FormData(form).entries()]).toEqual([
      ["from", "2026-06-12"],
      ["to", "2026-06-18"],
    ]);
    expect(element.value).toBe("2026-06-12/2026-06-18");
    form.remove();
  });

  it("maps popover selection and clear attributes to the controller", () => {
    defineLitopisElements();
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;
    element.setAttribute("clear-button", "");
    element.setAttribute("close-on-select", "false");
    element.setAttribute("mode", "popover");
    document.body.append(element);

    const input = element.querySelector<HTMLInputElement>(".litopis-input")!;
    input.click();
    element
      .querySelector<HTMLButtonElement>(".litopis-day[data-iso-date] .litopis-day-button")
      ?.click();

    expect(element.querySelector<HTMLButtonElement>(".litopis-clear-button")?.hidden).toBe(false);
    expect(element.dataset.calendarOpen).toBe("true");
    element.remove();
  });

  it("passes typed message overrides to the controller", () => {
    defineLitopisElements();
    const element = document.createElement("litopis-date-picker") as TestLitopisDatePickerElement;

    element.messages = { nextMonth: "Advance month" };
    document.body.append(element);

    expect(
      element
        .querySelector<HTMLButtonElement>(".litopis-nav-button[data-direction='next']")
        ?.getAttribute("aria-label"),
    ).toBe("Advance month");
    element.remove();
  });
});
