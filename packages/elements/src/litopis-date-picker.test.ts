import { describe, expect, it } from "vitest";
import { defineLitopisElements } from "./index";

describe("LitopisDatePickerElement", () => {
  it("defines the custom element", () => {
    defineLitopisElements();

    expect(customElements.get("litopis-date-picker")).toBeTruthy();
  });

  it("keeps an independent controller per element", () => {
    defineLitopisElements();
    const first = document.createElement("litopis-date-picker") as HTMLElement & {
      value: string;
    };
    const second = document.createElement("litopis-date-picker") as HTMLElement & {
      value: string;
    };

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
});
