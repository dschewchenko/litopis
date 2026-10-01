import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDates,
  getToday,
  isDateDisabled as isOutsideBounds,
  isSameDate,
  startOfMonth,
  toLocalDate,
} from "./date";
import { createCalendarGrid } from "./grid";
import { getLocaleFirstDayOfWeek, resolveLocale } from "./locale";
import { createEmptyDateRange, normalizeDateRange } from "./range";
import type {
  CalendarMove,
  CalendarState,
  CalendarStateOptions,
  DateValue,
  FirstDayOfWeek,
} from "./types";

export function createCalendarState(options: CalendarStateOptions = {}): CalendarState {
  const locale = resolveLocale(options.locale);
  const firstDayOfWeek = options.firstDayOfWeek ?? getLocaleFirstDayOfWeek(locale);
  const today = options.today ?? getToday();
  const disabledDates = options.disabledDates ?? [];
  const isDateDisabledPredicate = options.isDateDisabled ?? null;

  if (options.min && options.max && compareDates(options.min, options.max) > 0) {
    throw new RangeError("Calendar minimum date must not be after its maximum date.");
  }

  const requestedRange = normalizeDateRange(options.range ?? createEmptyDateRange());
  const range = isCalendarRangeDisabled(requestedRange, disabledDates, isDateDisabledPredicate)
    ? createEmptyDateRange()
    : requestedRange;
  const requestedSelected = options.selected ?? null;
  const selected =
    requestedSelected &&
    isExplicitlyDisabled(requestedSelected, disabledDates, isDateDisabledPredicate)
      ? null
      : requestedSelected;
  const initialDate = selected ?? range.start ?? today;
  const focusedDate = clampDate(initialDate, options.min ?? null, options.max ?? null);
  const visibleMonth = startOfMonth(focusedDate);

  return {
    focusedDate,
    grid: createCalendarGrid(
      visibleMonth,
      selected,
      today,
      locale,
      firstDayOfWeek,
      options.min ?? null,
      options.max ?? null,
      range,
      disabledDates,
      isDateDisabledPredicate ?? undefined,
    ),
    disabledDates,
    firstDayOfWeek,
    locale,
    max: options.max ?? null,
    min: options.min ?? null,
    isDateDisabled: isDateDisabledPredicate,
    selected,
    range,
    selectionMode: options.selectionMode ?? "single",
    today,
    visibleMonth,
  };
}

export function moveFocus(state: CalendarState, move: CalendarMove): CalendarState {
  const nextFocusedDate = getMovedDate(state.focusedDate, move, state.firstDayOfWeek);
  const focusedDate = clampDate(nextFocusedDate, state.min, state.max);
  const visibleMonth = startOfMonth(focusedDate);

  return {
    ...state,
    focusedDate,
    grid: createCalendarGrid(
      visibleMonth,
      state.selected,
      state.today,
      state.locale,
      state.firstDayOfWeek,
      state.min,
      state.max,
      state.range,
      state.disabledDates,
      state.isDateDisabled ?? undefined,
    ),
    visibleMonth,
  };
}

export function selectFocusedDate(state: CalendarState): CalendarState {
  const selected = state.focusedDate;

  if (isCalendarDateExplicitlyDisabled(state, selected)) return state;

  return {
    ...state,
    grid: createCalendarGrid(
      state.visibleMonth,
      selected,
      state.today,
      state.locale,
      state.firstDayOfWeek,
      state.min,
      state.max,
      state.range,
      state.disabledDates,
      state.isDateDisabled ?? undefined,
    ),
    selected,
  };
}

export function selectDate(state: CalendarState, value: DateValue | null): CalendarState {
  if (value && isCalendarDateExplicitlyDisabled(state, value)) return state;
  const focusedDate = value ? clampDate(value, state.min, state.max) : state.focusedDate;
  const visibleMonth = startOfMonth(focusedDate);

  return {
    ...state,
    focusedDate,
    grid: createCalendarGrid(
      visibleMonth,
      value,
      state.today,
      state.locale,
      state.firstDayOfWeek,
      state.min,
      state.max,
      state.range,
      state.disabledDates,
      state.isDateDisabled ?? undefined,
    ),
    selected: value,
    visibleMonth,
  };
}

export function selectRange(state: CalendarState, range: CalendarState["range"]): CalendarState {
  const nextRange = normalizeDateRange(range);
  if (isCalendarRangeDisabled(nextRange, state.disabledDates, state.isDateDisabled)) {
    return state;
  }
  const focusedDate = nextRange.end ?? nextRange.start ?? state.focusedDate;
  const visibleMonth = startOfMonth(focusedDate);

  return {
    ...state,
    focusedDate,
    grid: createCalendarGrid(
      visibleMonth,
      null,
      state.today,
      state.locale,
      state.firstDayOfWeek,
      state.min,
      state.max,
      nextRange,
      state.disabledDates,
      state.isDateDisabled ?? undefined,
    ),
    range: nextRange,
    selected: null,
    visibleMonth,
  };
}

export function focusDate(state: CalendarState, value: DateValue): CalendarState {
  const focusedDate = clampDate(value, state.min, state.max);
  const visibleMonth = startOfMonth(focusedDate);

  return {
    ...state,
    focusedDate,
    grid: createCalendarGrid(
      visibleMonth,
      state.selected,
      state.today,
      state.locale,
      state.firstDayOfWeek,
      state.min,
      state.max,
      state.range,
      state.disabledDates,
      state.isDateDisabled ?? undefined,
    ),
    visibleMonth,
  };
}

/** Tests bounds and caller-provided unavailable-date rules in one place. */
export function isCalendarDateDisabled(state: CalendarState, value: DateValue): boolean {
  return isDateDisabled(value, state.min, state.max, state.disabledDates, state.isDateDisabled);
}

/** Tests only caller-provided unavailable-date rules, without min/max clamping semantics. */
export function isCalendarDateExplicitlyDisabled(state: CalendarState, value: DateValue): boolean {
  return isExplicitlyDisabled(value, state.disabledDates, state.isDateDisabled);
}

/** Tests both endpoints and every day in a complete range against calendar availability. */
export function isCalendarRangeDisabled(
  range: CalendarState["range"],
  disabledDates: readonly DateValue[] = [],
  predicate: CalendarState["isDateDisabled"] = null,
): boolean {
  const endpoints = [range.start, range.end].filter((value): value is DateValue => value !== null);

  if (endpoints.some((endpoint) => isExplicitlyDisabled(endpoint, disabledDates, predicate))) {
    return true;
  }

  if (!range.start || !range.end) return false;

  const intervalStart = compareDates(range.start, range.end) <= 0 ? range.start : range.end;
  const intervalEnd = intervalStart === range.start ? range.end : range.start;

  if (
    disabledDates.some(
      (date) => compareDates(date, intervalStart) >= 0 && compareDates(date, intervalEnd) <= 0,
    )
  ) {
    return true;
  }

  if (!predicate) return false;

  let date = intervalStart;

  while (compareDates(date, intervalEnd) <= 0) {
    if (predicate(date)) return true;
    const nextDate = addDays(date, 1);
    if (compareDates(nextDate, date) === 0) break;
    date = nextDate;
  }

  return false;
}

function isExplicitlyDisabled(
  value: DateValue,
  disabledDates: readonly DateValue[],
  predicate: CalendarState["isDateDisabled"],
): boolean {
  return (
    disabledDates.some((disabledDate) => isSameDate(disabledDate, value)) ||
    Boolean(predicate?.(value))
  );
}

function isDateDisabled(
  value: DateValue,
  min: DateValue | null,
  max: DateValue | null,
  disabledDates: readonly DateValue[],
  predicate: CalendarState["isDateDisabled"],
): boolean {
  return isOutsideBounds(value, min, max) || isExplicitlyDisabled(value, disabledDates, predicate);
}

function getMovedDate(
  value: DateValue,
  move: CalendarMove,
  firstDayOfWeek: FirstDayOfWeek,
): DateValue {
  switch (move) {
    case "next-day":
      return addDays(value, 1);
    case "previous-day":
      return addDays(value, -1);
    case "next-week":
      return addDays(value, 7);
    case "previous-week":
      return addDays(value, -7);
    case "week-start":
      return addDays(value, -getWeekdayOffset(value, firstDayOfWeek));
    case "week-end":
      return addDays(value, 6 - getWeekdayOffset(value, firstDayOfWeek));
    case "next-month":
      return addMonths(value, 1);
    case "previous-month":
      return addMonths(value, -1);
    case "next-year":
      return addYears(value, 1);
    case "previous-year":
      return addYears(value, -1);
  }
}

function getWeekdayOffset(value: DateValue, firstDayOfWeek: FirstDayOfWeek): number {
  return (toLocalDate(value).getDay() - firstDayOfWeek + 7) % 7;
}
