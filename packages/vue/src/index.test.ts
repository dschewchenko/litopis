import { createApp, h, nextTick } from "vue";
import { describe, expect, it } from "vitest";
import { LitopisDatePicker } from "./index";

describe("LitopisDatePicker for Vue", () => {
  it("mounts and forwards picker options", async () => {
    const host = document.createElement("div");
    const app = createApp({
      render: () =>
        h(LitopisDatePicker, {
          options: {
            showTodayButton: true,
            today: { day: 25, month: 6, year: 2026 },
            todayLabel: "Current date",
          },
        }),
    });

    app.mount(host);
    await nextTick();

    expect(host.querySelector(".litopis-today-button")?.textContent).toBe("Current date");
    app.unmount();
  });
});
