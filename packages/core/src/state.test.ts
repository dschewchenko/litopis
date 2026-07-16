import { describe, expect, it } from "vitest";
import { getLocaleFirstDayOfWeek, resolveLocale } from "./locale";
import { createCalendarState, focusDate, moveFocus, selectFocusedDate } from "./state";

describe("calendar state", () => {
  it("creates a focused month grid", () => {
    const state = createCalendarState({
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(state.grid.weeks).toHaveLength(5);
    expect(state.visibleMonth).toEqual({ day: 1, month: 6, year: 2026 });
  });

  it("supports Monday as the first day of week", () => {
    const state = createCalendarState({
      firstDayOfWeek: 1,
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(state.grid.weeks[0]?.[0]?.date).toEqual({ day: 1, month: 6, year: 2026 });
  });

  it("derives first day of week from locale data", () => {
    const state = createCalendarState({
      locale: "uk-UA",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(state.firstDayOfWeek).toBe(1);
    expect(state.grid.weeks[0]?.[0]?.date).toEqual({ day: 1, month: 6, year: 2026 });
    expect(getLocaleFirstDayOfWeek("en-US")).toBe(0);
    expect(getLocaleFirstDayOfWeek("ar-EG")).toBe(6);
  });

  it("uses compact region data when native week info is unavailable", () => {
    const localeDescriptor = Object.getOwnPropertyDescriptor(Intl, "Locale");

    class TestLocale {
      readonly region: string;

      constructor(locale: string) {
        this.region = locale.split("-")[1] ?? "";
      }
    }

    Object.defineProperty(Intl, "Locale", {
      configurable: true,
      value: TestLocale,
    });

    try {
      expect(getLocaleFirstDayOfWeek("en-US")).toBe(0);
      expect(getLocaleFirstDayOfWeek("uk-UA")).toBe(1);
      expect(getLocaleFirstDayOfWeek("ar-EG")).toBe(6);
    } finally {
      if (localeDescriptor) {
        Object.defineProperty(Intl, "Locale", localeDescriptor);
      }
    }
  });

  it("uses English locale defaults when locale is unsupported", () => {
    const state = createCalendarState({
      locale: "zz-ZZ",
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(resolveLocale("zz-ZZ")).toBe("en-US");
    expect(resolveLocale("bad_locale")).toBe("en-US");
    expect(state.locale).toBe("en-US");
    expect(state.firstDayOfWeek).toBe(0);
  });

  it("moves focus by keyboard intent", () => {
    const state = createCalendarState({
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(moveFocus(state, "next-week").focusedDate).toEqual({ day: 2, month: 7, year: 2026 });
  });

  it("selects the focused date in single mode", () => {
    const state = createCalendarState({
      today: { day: 25, month: 6, year: 2026 },
    });

    expect(selectFocusedDate(state).selected).toEqual({ day: 25, month: 6, year: 2026 });
  });

  it("focuses a requested month and year", () => {
    const state = createCalendarState({
      today: { day: 25, month: 6, year: 2026 },
    });

    const nextState = focusDate(state, { day: 25, month: 12, year: 2027 });

    expect(nextState.focusedDate).toEqual({ day: 25, month: 12, year: 2027 });
    expect(nextState.visibleMonth).toEqual({ day: 1, month: 12, year: 2027 });
  });
});
