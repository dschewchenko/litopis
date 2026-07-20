import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDates,
  getToday,
  startOfMonth,
  toLocalDate,
} from "./date";
import { createCalendarGrid } from "./grid";
import { getLocaleFirstDayOfWeek, resolveLocale } from "./locale";
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

  if (options.min && options.max && compareDates(options.min, options.max) > 0) {
    throw new RangeError("Calendar minimum date must not be after its maximum date.");
  }

  const initialDate = options.selected ?? today;
  const focusedDate = clampDate(initialDate, options.min ?? null, options.max ?? null);
  const visibleMonth = startOfMonth(focusedDate);

  return {
    focusedDate,
    grid: createCalendarGrid(
      visibleMonth,
      options.selected ?? null,
      today,
      locale,
      firstDayOfWeek,
      options.min ?? null,
      options.max ?? null,
    ),
    firstDayOfWeek,
    locale,
    max: options.max ?? null,
    min: options.min ?? null,
    selected: options.selected ?? null,
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
    ),
    visibleMonth,
  };
}

export function selectFocusedDate(state: CalendarState): CalendarState {
  const selected = state.focusedDate;

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
    ),
    selected,
  };
}

export function selectDate(state: CalendarState, value: DateValue | null): CalendarState {
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
    ),
    selected: value,
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
    ),
    visibleMonth,
  };
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
