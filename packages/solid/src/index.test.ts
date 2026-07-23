import { render } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { LitopisDatePicker } from "./index";

describe("LitopisDatePicker for Solid", () => {
  it("mounts and forwards picker options", () => {
    const host = document.createElement("div");
    const dispose = render(
      () =>
        LitopisDatePicker({
          class: "custom-picker",
          showTodayButton: true,
          today: { day: 25, month: 6, year: 2026 },
          todayLabel: "Current date",
        }),
      host,
    );

    expect(host.querySelector(".litopis-today-button")?.textContent).toBe("Current date");
    expect(host.querySelector(".litopis.custom-picker")).not.toBeNull();
    dispose();
  });
});
