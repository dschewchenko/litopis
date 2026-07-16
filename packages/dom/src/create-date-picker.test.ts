import { describe, expect, it } from "vitest";
import { createDatePicker } from "./create-date-picker";

describe("createDatePicker", () => {
  it("renders a keyboard reachable grid", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.querySelector("[role='grid']")).toBeTruthy();
    expect(root.querySelectorAll(".litopis-day-button[tabindex='0']")).toHaveLength(1);
  });

  it("renders an integrated month and year caption", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.querySelector(".litopis-caption-label")?.textContent).toBe("June 2026");
    expect(root.querySelector<HTMLElement>(".litopis-season")?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>(".litopis-month-year-panel")?.hidden).toBe(true);
  });

  it("shows the season label when configured", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      showSeason: true,
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.querySelector(".litopis-season")?.textContent).toBe("Summer");
  });

  it("opens the integrated month and year panel from the caption", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });

    root.querySelector<HTMLButtonElement>(".litopis-caption")?.click();

    expect(root.querySelector<HTMLElement>(".litopis-month-year-panel")?.hidden).toBe(false);
    expect(root.querySelectorAll(".litopis-month-button")).toHaveLength(12);
  });

  it("opens a paginated year panel from the month panel", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      max: { day: 31, month: 12, year: 2027 },
      min: { day: 1, month: 1, year: 2024 },
      today: { day: 25, month: 6, year: 2026 },
    });

    root.querySelector<HTMLButtonElement>(".litopis-caption")?.click();
    root.querySelector<HTMLButtonElement>(".litopis-panel-title")?.click();

    expect(root.querySelectorAll(".litopis-year-button")).toHaveLength(12);
    expect(root.querySelector(".litopis-panel-title")?.textContent).toBe("2016–2027");
    expect(
      root.querySelector<HTMLButtonElement>(".litopis-year-button:not(:disabled)")?.textContent,
    ).toBe("2024");
  });

  it("keeps ISO controller values when the input uses a localized mask", () => {
    const root = document.createElement("div");

    const picker = createDatePicker(root, {
      inputFormat: "dd.mm.yyyy",
      today: { day: 25, month: 6, year: 2026 },
    });

    const input = root.querySelector<HTMLInputElement>(".litopis-input");
    input!.value = "25062026";
    input!.dispatchEvent(new Event("input"));

    expect(input?.value).toBe("25.06.2026");
    expect(picker.getDate()).toEqual({ day: 25, month: 6, year: 2026 });
    expect(picker.getValue()).toBe("2026-06-25");
  });

  it("allows editing the masked year and clamps committed values", () => {
    const root = document.createElement("div");

    const picker = createDatePicker(root, {
      inputFormat: "dd.mm.yyyy",
      max: { day: 10, month: 7, year: 2026 },
      min: { day: 10, month: 6, year: 2026 },
      selected: { day: 25, month: 6, year: 2026 },
      today: { day: 25, month: 6, year: 2026 },
    });

    const input = root.querySelector<HTMLInputElement>(".litopis-input");
    input!.focus();
    input!.value = "25.06.202";
    input!.setSelectionRange(9, 9);
    input!.dispatchEvent(new Event("input"));

    expect(input?.value).toBe("25.06.202");
    expect(input?.selectionStart).toBe(9);

    input!.value = "25.06.2027";
    input!.setSelectionRange(10, 10);
    input!.dispatchEvent(new Event("input"));
    input!.dispatchEvent(new Event("blur"));

    expect(input?.value).toBe("10.07.2026");
    expect(picker.getDate()).toEqual({ day: 10, month: 7, year: 2026 });
    expect(picker.getValue()).toBe("2026-07-10");
  });

  it("updates options and visible month programmatically", () => {
    const root = document.createElement("div");

    const picker = createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });

    picker.setOptions({
      firstDayOfWeek: 1,
      inputFormat: "dd.mm.yyyy",
      showSeason: true,
    });
    picker.setVisibleMonth({ day: 1, month: 7, year: 2027 });

    const weekdays = [...root.querySelectorAll(".litopis-weekday")].map((node) =>
      node.textContent?.trim(),
    );

    expect(root.querySelector<HTMLInputElement>(".litopis-input")?.placeholder).toBe("DD.MM.YYYY");
    expect(root.querySelector(".litopis-caption-label")?.textContent).toBe("July 2027");
    expect(root.querySelector(".litopis-season")?.textContent).toBe("Summer");
    expect(weekdays[0]).toBe("Mon");
  });

  it("can return the visible calendar state to today", () => {
    const root = document.createElement("div");

    const picker = createDatePicker(root, {
      showTodayButton: true,
      today: { day: 25, month: 6, year: 2026 },
    });

    picker.setVisibleMonth({ day: 1, month: 12, year: 2027 });
    expect(root.querySelector(".litopis-caption-label")?.textContent).toBe("December 2027");

    picker.goToToday();
    expect(root.querySelector(".litopis-caption-label")?.textContent).toBe("June 2026");

    picker.setVisibleMonth({ day: 1, month: 12, year: 2027 });
    root.querySelector<HTMLButtonElement>(".litopis-today-button")?.click();
    expect(root.querySelector(".litopis-caption-label")?.textContent).toBe("June 2026");
  });

  it("disables the today button when today is outside min and max", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      max: { day: 31, month: 12, year: 2025 },
      showTodayButton: true,
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.querySelector<HTMLButtonElement>(".litopis-today-button")?.disabled).toBe(true);
  });

  it("supports popover mode from the input", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      calendarMode: "popover",
      targetSize: "comfortable",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.dataset.calendarMode).toBe("popover");
    expect(root.dataset.calendarOpen).toBe("false");
    expect(root.dataset.targetSize).toBe("comfortable");
    expect(root.querySelector<HTMLElement>(".litopis-calendar")?.getAttribute("popover")).toBe(
      "auto",
    );

    root.querySelector<HTMLInputElement>(".litopis-input")?.click();

    expect(root.dataset.calendarOpen).toBe("true");
  });
});
