import { describe, expect, it } from "vitest";
import type { DatePickerRangeNames } from "@litopis/dom";
import { defineLitopisElements } from "./index";

interface TestLitopisDatePickerElement extends HTMLElement {
  name: string | DatePickerRangeNames | null;
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
});
