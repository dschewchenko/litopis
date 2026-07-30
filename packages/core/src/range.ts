import { compareDates, endOfMonth, isSameDate, startOfMonth } from "./date";
import type { CalendarGranularity, DateRange, DateValue } from "./types";

export function createEmptyDateRange(): DateRange {
  return { end: null, start: null };
}

export function normalizeDateForGranularity(
  value: DateValue,
  granularity: CalendarGranularity,
): DateValue {
  if (granularity === "year") {
    return { day: 1, month: 1, year: value.year };
  }

  if (granularity === "month") {
    return startOfMonth(value);
  }

  return value;
}

/**
 * Expands a selected period to its final calendar day. Single values always use
 * `normalizeDateForGranularity`; this helper is for the end of a complete range.
 */
export function getPeriodEnd(value: DateValue, granularity: CalendarGranularity): DateValue {
  if (granularity === "year") {
    return { day: 31, month: 12, year: value.year };
  }

  if (granularity === "month") {
    return endOfMonth(value);
  }

  return value;
}

/** Returns a public range whose end represents the final day of its selected period. */
export function getDateRangeBoundaries(
  range: DateRange,
  granularity: CalendarGranularity = "day",
): DateRange {
  const normalized = normalizeDateRange(range, granularity);

  return {
    end: normalized.end ? getPeriodEnd(normalized.end, granularity) : null,
    start: normalized.start,
  };
}

export function normalizeDateRange(
  range: DateRange,
  granularity: CalendarGranularity = "day",
): DateRange {
  const start = range.start ? normalizeDateForGranularity(range.start, granularity) : null;
  const end = range.end ? normalizeDateForGranularity(range.end, granularity) : null;

  if (start && end && compareDates(start, end) > 0) {
    return { end: start, start: end };
  }

  return { end, start };
}

export function selectDateRange(
  range: DateRange,
  value: DateValue | null,
  granularity: CalendarGranularity = "day",
): DateRange {
  if (!value) {
    return createEmptyDateRange();
  }

  const nextValue = normalizeDateForGranularity(value, granularity);

  if (!range.start || range.end) {
    return { end: null, start: nextValue };
  }

  if (compareDates(nextValue, range.start) < 0) {
    return { end: range.start, start: nextValue };
  }

  return { end: nextValue, start: range.start };
}

export function isDateInDateRange(
  value: DateValue,
  range: DateRange,
  granularity: CalendarGranularity = "day",
): boolean {
  if (!range.start || !range.end) {
    return false;
  }

  const normalized = normalizeDateForGranularity(value, granularity);
  return compareDates(normalized, range.start) >= 0 && compareDates(normalized, range.end) <= 0;
}

export function isRangeBoundary(value: DateValue, range: DateRange): boolean {
  return isSameDate(value, range.start) || isSameDate(value, range.end);
}

export function getDateRangeLength(
  range: DateRange,
  granularity: CalendarGranularity = "day",
): number | null {
  if (!range.start || !range.end) {
    return null;
  }

  if (granularity === "year") {
    return range.end.year - range.start.year;
  }

  if (granularity === "month") {
    return (range.end.year - range.start.year) * 12 + range.end.month - range.start.month;
  }

  const start = Date.UTC(range.start.year, range.start.month - 1, range.start.day);
  const end = Date.UTC(range.end.year, range.end.month - 1, range.end.day);
  return Math.round((end - start) / 86_400_000);
}
