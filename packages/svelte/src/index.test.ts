import { describe, expect, it } from "vitest";
import { litopisDatePicker } from "./index";

describe("litopisDatePicker for Svelte", () => {
  it("mounts and updates picker options", () => {
    const host = document.createElement("div");
    const action = litopisDatePicker(host, {
      today: { day: 25, month: 6, year: 2026 },
    });

    action.update({ showTodayButton: true, todayLabel: "Current date" });

    expect(host.querySelector(".litopis-today-button")?.textContent).toBe("Current date");
    action.destroy();
    expect(host.childElementCount).toBe(0);
  });
});
