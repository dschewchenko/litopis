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
    expect(root.querySelector("[aria-current='date']")?.textContent).toBe("25");
    expect(
      root.querySelector<HTMLInputElement>(".litopis-input")?.getAttribute("aria-controls"),
    ).toBe(root.querySelector(".litopis-grid")?.id);
  });

  it("uses labelled navigation controls with CSS chevrons", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });

    const previousButton = root.querySelector<HTMLButtonElement>(
      ".litopis-nav-button[data-direction='previous']",
    );
    const nextButton = root.querySelector<HTMLButtonElement>(
      ".litopis-nav-button[data-direction='next']",
    );

    expect(previousButton?.getAttribute("aria-label")).toBe("Previous month");
    expect(nextButton?.getAttribute("aria-label")).toBe("Next month");
    expect(previousButton?.textContent).toBe("");
    expect(nextButton?.textContent).toBe("");
  });

  it("renders only Litopis-owned styling hooks", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      selected: { day: 25, month: 6, year: 2026 },
      today: { day: 25, month: 6, year: 2026 },
    });

    const classNames = [...root.querySelectorAll("[class]")].flatMap((element) => [
      ...element.classList,
    ]);

    expect(
      classNames.every((className) => className === "litopis" || className.startsWith("litopis-")),
    ).toBe(true);
    expect(root.querySelector(".litopis-day[data-selected][data-today]")).toBeTruthy();
  });

  it("keeps day nodes stable while synchronizing a new selection", async () => {
    const root = document.createElement("div");
    createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });
    const day = root.querySelector<HTMLElement>(".litopis-day[data-iso-date='2026-06-26']")!;
    const button = day.querySelector<HTMLButtonElement>("button")!;
    const grid = root.querySelector<HTMLElement>(".litopis-grid")!;
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) => mutations.push(...records));
    observer.observe(grid, { childList: true, subtree: true });

    button.click();
    await Promise.resolve();
    observer.disconnect();

    expect(root.querySelector(".litopis-day[data-iso-date='2026-06-26']")).toBe(day);
    expect(day.dataset.selected).toBe("");
    expect(mutations).toHaveLength(0);
  });

  it("keeps period panel nodes stable while synchronizing a selection", () => {
    const root = document.createElement("div");
    createDatePicker(root, {
      granularity: "month",
      today: { day: 25, month: 6, year: 2026 },
    });
    const january = root.querySelector<HTMLButtonElement>(".litopis-month-button")!;

    january.click();

    expect(root.querySelector(".litopis-month-button")).toBe(january);
    expect(january.dataset.selected).toBe("");
  });

  it("uses one calendar and native endpoint values for a split range form", () => {
    const form = document.createElement("form");
    const root = document.createElement("div");
    form.append(root);
    document.body.append(form);

    const picker = createDatePicker(root, {
      label: { end: "Return", start: "Departure" },
      name: { end: "to", start: "from" },
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
      panels: 2,
    });
    picker.setRange({
      end: { day: 18, month: 6, year: 2026 },
      start: { day: 12, month: 6, year: 2026 },
    });

    expect(root.querySelectorAll(".litopis-calendar")).toHaveLength(1);
    expect(root.querySelectorAll("[role='combobox']")).toHaveLength(2);
    expect(root.querySelectorAll(".litopis-label")[0]?.textContent).toBe("Departure");
    expect(root.querySelectorAll(".litopis-label")[1]?.textContent).toBe("Return");
    expect(root.querySelectorAll(".litopis-grid")).toHaveLength(2);
    expect(root.querySelector(".litopis-day[data-in-range]")).toBeTruthy();
    expect([...new FormData(form).entries()]).toEqual([
      ["from", "2026-06-12"],
      ["to", "2026-06-18"],
    ]);
    form.remove();
  });

  it("serializes a single period as an ISO form value", () => {
    const form = document.createElement("form");
    const root = document.createElement("div");
    form.append(root);
    document.body.append(form);
    const picker = createDatePicker(root, {
      granularity: "month",
      name: "billing-month",
      today: { day: 25, month: 6, year: 2026 },
    });

    picker.setDate({ day: 1, month: 2, year: 2024 });

    expect(new FormData(form).get("billing-month")).toBe("2024-02-01");
    form.remove();
  });

  it("completes a split range from the calendar without focusing the end field", () => {
    const root = document.createElement("div");
    const picker = createDatePicker(root, {
      mode: "popover",
      layout: "split",
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });
    const inputs = root.querySelectorAll<HTMLInputElement>("[role='combobox']");
    expect(inputs).toHaveLength(2);
    const startInput = inputs[0]!;
    const endInput = inputs[1]!;

    picker.open();
    root
      .querySelector<HTMLButtonElement>(".litopis-day[data-iso-date='2026-06-12'] button")
      ?.click();

    expect(startInput.value).toBe("2026-06-12");
    expect(endInput.value).toBe("");
    expect(root.dataset.calendarOpen).toBe("true");
    expect(root.dataset.rangeComplete).toBe("false");

    root
      .querySelector<HTMLButtonElement>(".litopis-day[data-iso-date='2026-06-18'] button")
      ?.click();

    expect(startInput.value).toBe("2026-06-12");
    expect(endInput.value).toBe("2026-06-18");
    expect(picker.getValue()).toEqual({
      end: { day: 18, month: 6, year: 2026 },
      start: { day: 12, month: 6, year: 2026 },
    });
    expect(root.dataset.calendarOpen).toBe("false");
    expect(root.dataset.rangeComplete).toBe("true");
  });

  it("keeps a popover open after selection when closeOnSelect is false", () => {
    const root = document.createElement("div");
    const picker = createDatePicker(root, {
      closeOnSelect: false,
      mode: "popover",
      today: { day: 25, month: 6, year: 2026 },
    });

    picker.open();
    root
      .querySelector<HTMLButtonElement>(".litopis-day[data-iso-date='2026-06-18'] button")
      ?.click();

    expect(picker.getISOValue()).toBe("2026-06-18");
    expect(root.dataset.calendarOpen).toBe("true");
  });

  it("clears a single date or a partial range from the optional footer action", () => {
    const singleRoot = document.createElement("div");
    const singlePicker = createDatePicker(singleRoot, {
      clearButton: true,
      selected: { day: 18, month: 6, year: 2026 },
      today: { day: 25, month: 6, year: 2026 },
    });
    const singleClearButton = singleRoot.querySelector<HTMLButtonElement>(".litopis-clear-button")!;

    expect(singleClearButton.disabled).toBe(false);
    singleClearButton.click();
    expect(singlePicker.getValue()).toBeNull();
    expect(singleClearButton.disabled).toBe(true);

    const rangeRoot = document.createElement("div");
    const rangePicker = createDatePicker(rangeRoot, {
      clearButton: true,
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });
    rangePicker.setRange({
      end: null,
      start: { day: 18, month: 6, year: 2026 },
    });
    rangeRoot.querySelector<HTMLButtonElement>(".litopis-clear-button")?.click();

    expect(rangePicker.getValue()).toEqual({ end: null, start: null });
    expect(rangeRoot.querySelector<HTMLInputElement>(".litopis-input")?.value).toBe("");
  });

  it("orders an inverted range and resets it after a completed selection", () => {
    const root = document.createElement("div");
    const picker = createDatePicker(root, {
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });

    picker.setRange({
      end: { day: 12, month: 6, year: 2026 },
      start: { day: 18, month: 6, year: 2026 },
    });
    expect(picker.getValue()).toEqual({
      end: { day: 18, month: 6, year: 2026 },
      start: { day: 12, month: 6, year: 2026 },
    });

    root
      .querySelector<HTMLButtonElement>(".litopis-day[data-iso-date='2026-06-25'] button")
      ?.click();
    expect(picker.getValue()).toEqual({ end: null, start: { day: 25, month: 6, year: 2026 } });
  });

  it("rebuilds only the field structure when selection options change", () => {
    const root = document.createElement("div");
    const picker = createDatePicker(root, {
      selected: { day: 12, month: 6, year: 2026 },
      today: { day: 25, month: 6, year: 2026 },
    });
    const calendar = root.querySelector<HTMLElement>(".litopis-calendar")!;

    picker.setOptions({
      layout: "split",
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.querySelectorAll("[role='combobox']")).toHaveLength(2);
    expect(root.querySelector(".litopis-calendar")).toBe(calendar);

    picker.setOptions({
      layout: "single",
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.querySelectorAll("[role='combobox']")).toHaveLength(1);
    expect(root.querySelector(".litopis-calendar")).toBe(calendar);
  });

  it("masks and serializes a single range field", () => {
    const form = document.createElement("form");
    const root = document.createElement("div");
    form.append(root);
    document.body.append(form);
    const picker = createDatePicker(root, {
      layout: "single",
      format: "dd.mm.yyyy",
      name: "period",
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });
    const input = root.querySelector<HTMLInputElement>(".litopis-input")!;
    input.value = "1206202618062026";
    input.dispatchEvent(new Event("input"));

    expect(input.value).toBe("12.06.2026 – 18.06.2026");
    expect(picker.getValue()).toEqual({
      end: { day: 18, month: 6, year: 2026 },
      start: { day: 12, month: 6, year: 2026 },
    });
    expect(new FormData(form).get("period")).toBe("2026-06-12/2026-06-18");
    form.remove();
  });

  it("restores the configured range after a native form reset", async () => {
    const form = document.createElement("form");
    const root = document.createElement("div");
    form.append(root);
    document.body.append(form);
    const picker = createDatePicker(root, {
      range: {
        end: { day: 18, month: 6, year: 2026 },
        start: { day: 12, month: 6, year: 2026 },
      },
      name: "stay",
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });
    picker.setRange({
      end: { day: 22, month: 6, year: 2026 },
      start: { day: 20, month: 6, year: 2026 },
    });

    form.reset();
    await Promise.resolve();

    expect(picker.getValue()).toEqual({
      end: { day: 18, month: 6, year: 2026 },
      start: { day: 12, month: 6, year: 2026 },
    });
    expect(new FormData(form).get("stay[start]")).toBe("2026-06-12");
    expect(new FormData(form).get("stay[end]")).toBe("2026-06-18");
    form.remove();
  });

  it("selects month and year ranges through the existing period panel", () => {
    const root = document.createElement("div");
    const picker = createDatePicker(root, {
      granularity: "month",
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });
    root.querySelector<HTMLButtonElement>(".litopis-caption")?.click();
    root.querySelector<HTMLButtonElement>(".litopis-month-button")?.click();
    root.querySelectorAll<HTMLButtonElement>(".litopis-month-button")[2]?.click();

    expect(picker.getValue()).toEqual({
      end: { day: 31, month: 3, year: 2026 },
      start: { day: 1, month: 1, year: 2026 },
    });
    expect(root.querySelectorAll(".litopis-month-button[data-in-range]")).toHaveLength(3);
    expect(root.querySelector(".litopis-month-button[data-range-start]")?.textContent).toBe("Jan");
    expect(root.querySelector(".litopis-month-button[data-range-end]")?.textContent).toBe("Mar");

    const yearRoot = document.createElement("div");
    const yearPicker = createDatePicker(yearRoot, {
      granularity: "year",
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });
    yearRoot.querySelectorAll<HTMLButtonElement>(".litopis-year-button")[8]?.click();
    yearRoot.querySelectorAll<HTMLButtonElement>(".litopis-year-button")[10]?.click();

    expect(yearPicker.getValue()).toEqual({
      end: { day: 31, month: 12, year: 2026 },
      start: { day: 1, month: 1, year: 2024 },
    });
    expect(yearRoot.querySelectorAll(".litopis-year-button[data-in-range]")).toHaveLength(3);
    expect(yearRoot.querySelector<HTMLElement>(".litopis-month-year-panel")?.hidden).toBe(false);
    yearRoot.querySelector<HTMLButtonElement>(".litopis-caption")?.click();
    yearRoot.querySelector<HTMLButtonElement>(".litopis-panel-title")?.click();
    expect(yearRoot.querySelectorAll(".litopis-year-button")).toHaveLength(12);
    expect(yearRoot.querySelector<HTMLElement>(".litopis-grid")?.hidden).toBe(true);
  });

  it("keeps period field text while exposing complete ISO range boundaries", () => {
    const form = document.createElement("form");
    const root = document.createElement("div");
    form.append(root);
    document.body.append(form);
    const picker = createDatePicker(root, {
      format: "dd.mm.yyyy",
      granularity: "month",
      layout: "single",
      name: "stay",
      range: {
        end: { day: 1, month: 2, year: 2024 },
        start: { day: 1, month: 1, year: 2024 },
      },
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(picker.getInputValue()).toBe("01.2024 – 02.2024");
    expect(picker.getISOValue()).toBe("2024-01-01/2024-02-29");
    expect(picker.getValue()).toEqual({
      end: { day: 29, month: 2, year: 2024 },
      start: { day: 1, month: 1, year: 2024 },
    });
    expect(new FormData(form).get("stay")).toBe("2024-01-01/2024-02-29");
    form.remove();
  });

  it("accepts and emits local native Date values when valueAs is date", () => {
    const selected = new Date(2024, 1, 29, 8);
    const root = document.createElement("div");
    const changes: Date[] = [];
    const picker = createDatePicker(root, {
      selected,
      today: { day: 29, month: 2, year: 2024 },
      valueAs: "date",
      onValueChange(value) {
        if (value) changes.push(value);
      },
    });

    const value = picker.getValue();

    expect(value).toBeInstanceOf(Date);
    expect(value?.getFullYear()).toBe(2024);
    expect(value?.getMonth()).toBe(1);
    expect(value?.getDate()).toBe(29);
    expect(picker.getInputValue()).toBe("2024-02-29");

    picker.setDate(new Date(2024, 2, 1));
    expect(changes).toHaveLength(1);
    expect(changes[0]?.getDate()).toBe(1);
  });

  it("expands native Date range ends for month and year selections", () => {
    const root = document.createElement("div");
    const picker = createDatePicker(root, {
      granularity: "month",
      range: {
        end: new Date(2024, 1, 1),
        start: new Date(2024, 0, 1),
      },
      selection: "range",
      today: { day: 29, month: 2, year: 2024 },
      valueAs: "date",
    });

    const range = picker.getValue();

    expect(range.start).toBeInstanceOf(Date);
    expect(range.end).toBeInstanceOf(Date);
    expect(range.start?.getDate()).toBe(1);
    expect(range.end?.getDate()).toBe(29);
    expect(range.end?.getMonth()).toBe(1);
  });

  it("keeps the two-panel viewport stable while completing a range across months", () => {
    const root = document.createElement("div");
    createDatePicker(root, {
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
      panels: 2,
    });
    const initialCaption = root.querySelector(".litopis-caption-label")?.textContent;

    root
      .querySelector<HTMLButtonElement>(".litopis-day[data-iso-date='2026-06-30'] button")
      ?.click();
    root
      .querySelector<HTMLButtonElement>(
        ".litopis-grid-secondary .litopis-day[data-iso-date='2026-07-03'] button",
      )
      ?.click();

    expect(root.querySelector(".litopis-caption-label")?.textContent).toBe(initialCaption);
    const selectedRangeDates = new Set(
      [...root.querySelectorAll<HTMLElement>(".litopis-day[data-in-range]")].map(
        (day) => day.dataset.isoDate,
      ),
    );
    expect(selectedRangeDates.size).toBe(4);
  });

  it("shows subdued adjacent-month days in every picker configuration unless disabled", () => {
    const singleRoot = document.createElement("div");
    createDatePicker(singleRoot, {
      today: { day: 25, month: 6, year: 2026 },
    });

    const onePanelRangeRoot = document.createElement("div");
    createDatePicker(onePanelRangeRoot, {
      panels: 1,
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });

    const twoPanelRangeRoot = document.createElement("div");
    createDatePicker(twoPanelRangeRoot, {
      panels: 2,
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });

    for (const root of [singleRoot, onePanelRangeRoot, twoPanelRangeRoot]) {
      expect(root.querySelectorAll(".litopis-day[data-outside-month]").length).toBeGreaterThan(0);
    }

    const hiddenRoot = document.createElement("div");
    createDatePicker(hiddenRoot, {
      outsideDays: false,
      panels: 2,
      selection: "range",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(hiddenRoot.querySelectorAll(".litopis-day[data-outside-month]")).toHaveLength(0);
  });

  it("moves focus from the input into the grid and preserves it after selection", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const picker = createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });
    const input = root.querySelector<HTMLInputElement>(".litopis-input")!;

    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(document.activeElement?.classList.contains("litopis-day-button")).toBe(true);
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }),
    );

    expect(picker.getISOValue()).toBe("2026-06-25");
    expect(document.activeElement?.classList.contains("litopis-day-button")).toBe(true);
    root.remove();
  });

  it("returns focus to the input when Escape closes a popover", () => {
    const root = document.createElement("div");
    document.body.append(root);
    createDatePicker(root, {
      mode: "popover",
      today: { day: 25, month: 6, year: 2026 },
    });
    const input = root.querySelector<HTMLInputElement>(".litopis-input")!;

    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
    );

    expect(root.dataset.calendarOpen).toBe("false");
    expect(document.activeElement).toBe(input);
    root.remove();
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
      season: true,
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
    expect(root.querySelector<HTMLElement>(".litopis-calendar-header")?.hidden).toBe(true);
    expect(root.querySelector(".litopis-panel-title")?.textContent).toBe("2026");
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
      format: "dd.mm.yyyy",
      today: { day: 25, month: 6, year: 2026 },
    });

    const input = root.querySelector<HTMLInputElement>(".litopis-input");
    input!.value = "25062026";
    input!.dispatchEvent(new Event("input"));

    expect(input?.value).toBe("25.06.2026");
    expect(picker.getValue()).toEqual({ day: 25, month: 6, year: 2026 });
    expect(picker.getISOValue()).toBe("2026-06-25");
  });

  it("allows editing the masked year and clamps committed values", () => {
    const root = document.createElement("div");

    const picker = createDatePicker(root, {
      format: "dd.mm.yyyy",
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
    expect(picker.getValue()).toEqual({ day: 10, month: 7, year: 2026 });
    expect(picker.getISOValue()).toBe("2026-07-10");
  });

  it("updates options and visible month programmatically", () => {
    const root = document.createElement("div");

    const picker = createDatePicker(root, {
      today: { day: 25, month: 6, year: 2026 },
    });

    picker.setOptions({
      firstDayOfWeek: 1,
      format: "dd.mm.yyyy",
      season: true,
    });
    picker.setVisibleMonth({ day: 1, month: 7, year: 2027 });

    const weekdays = [...root.querySelectorAll(".litopis-weekday")].map((node) =>
      node.textContent?.trim(),
    );

    expect(root.querySelector<HTMLInputElement>(".litopis-input")?.placeholder).toBe("DD.MM.YYYY");
    expect(root.querySelector(".litopis-caption-label")?.textContent).toBe("July 2027");
    expect(root.querySelector(".litopis-season")?.textContent).toBe("Summer");
    expect(weekdays[0]).toBe("Mon");

    picker.setOptions({ today: { day: 25, month: 6, year: 2026 } });
    expect(root.querySelector<HTMLElement>(".litopis-season")?.hidden).toBe(true);
    expect(root.querySelector<HTMLInputElement>(".litopis-input")?.placeholder).toBe("YYYY-MM-DD");
  });

  it("can return the visible calendar state to today", () => {
    const root = document.createElement("div");

    const picker = createDatePicker(root, {
      todayButton: true,
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
      todayButton: true,
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.querySelector<HTMLButtonElement>(".litopis-today-button")?.disabled).toBe(true);
  });

  it("supports popover mode from the input", () => {
    const root = document.createElement("div");

    createDatePicker(root, {
      mode: "popover",
      size: "comfortable",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(root.dataset.mode).toBe("popover");
    expect(root.dataset.calendarOpen).toBe("false");
    expect(root.dataset.size).toBe("comfortable");
    expect(root.querySelector<HTMLElement>(".litopis-calendar")?.getAttribute("popover")).toBe(
      "auto",
    );

    root.querySelector<HTMLInputElement>(".litopis-input")?.click();

    expect(root.dataset.calendarOpen).toBe("true");
  });
});
