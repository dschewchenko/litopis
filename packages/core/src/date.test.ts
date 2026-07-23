import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  formatDate,
  getDaysInMonth,
  toIsoDate,
  toLocalDate,
} from "./date";

describe("date utilities", () => {
  it("keeps years 1 through 99 as written", () => {
    expect(toLocalDate({ day: 1, month: 1, year: 1 }).getFullYear()).toBe(1);
    expect(toIsoDate({ day: 1, month: 1, year: 1 })).toBe("0001-01-01");
    expect(addDays({ day: 31, month: 12, year: 1 }, 1)).toEqual({
      day: 1,
      month: 1,
      year: 2,
    });
  });

  it("calculates month lengths across the supported range", () => {
    expect(getDaysInMonth({ day: 1, month: 2, year: 4 })).toBe(29);
    expect(getDaysInMonth({ day: 1, month: 2, year: 100 })).toBe(28);
    expect(getDaysInMonth({ day: 1, month: 2, year: 400 })).toBe(29);
    expect(addMonths({ day: 31, month: 12, year: 9998 }, 1)).toEqual({
      day: 31,
      month: 1,
      year: 9999,
    });
  });

  it("clamps month and year arithmetic to valid calendar dates", () => {
    expect(addMonths({ day: 31, month: 1, year: 2026 }, 1)).toEqual({
      day: 28,
      month: 2,
      year: 2026,
    });
    expect(addYears({ day: 29, month: 2, year: 2024 }, 1)).toEqual({
      day: 28,
      month: 2,
      year: 2025,
    });
  });

  it("does not leave the supported public range", () => {
    expect(addDays({ day: 1, month: 1, year: 1 }, -1)).toEqual({
      day: 1,
      month: 1,
      year: 1,
    });
    expect(addDays({ day: 31, month: 12, year: 9999 }, 1)).toEqual({
      day: 31,
      month: 12,
      year: 9999,
    });
  });

  it("falls back to English formatting for unsupported locales", () => {
    expect(formatDate({ day: 25, month: 6, year: 2026 }, "zz-ZZ", { month: "long" })).toBe("June");
    expect(formatDate({ day: 25, month: 6, year: 2026 }, "bad_locale", { month: "long" })).toBe(
      "June",
    );
  });
});
