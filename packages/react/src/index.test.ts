import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { describe, expect, it } from "vitest";
import { LitopisDatePicker } from "./index";

describe("LitopisDatePicker for React", () => {
  it("forwards the complete picker option surface", () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    flushSync(() => {
      root.render(
        createElement(LitopisDatePicker, {
          showTodayButton: true,
          today: { day: 25, month: 6, year: 2026 },
          todayLabel: "Current date",
        }),
      );
    });

    expect(host.querySelector(".litopis-today-button")?.textContent).toBe("Current date");
    expect(host.querySelector<HTMLElement>(".litopis-calendar-footer")?.hidden).toBe(false);

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
