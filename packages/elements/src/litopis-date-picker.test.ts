import { describe, expect, it } from "vitest";
import { defineLitopisElements } from "./index";

interface TestLitopisDatePickerElement extends HTMLElement {
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

    first.setAttribute("input-format", "dd.mm.yyyy");
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
});
