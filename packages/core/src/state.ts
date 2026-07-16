import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  endOfMonth,
  getToday,
  startOfMonth,
} from "./date";
import { createCalendarGrid } from "./grid";
import { getLocaleFirstDayOfWeek, resolveLocale } from "./locale";
import type { CalendarMove, CalendarState, CalendarStateOptions, DateValue } from "./types";

export function createCalendarState(options: CalendarStateOptions = {}): CalendarState {
  const locale = resolveLocale(options.locale);
  const firstDayOfWeek = options.firstDayOfWeek ?? getLocaleFirstDayOfWeek(locale);
  const today = options.today ?? getToday();
  const initialDate = "day" in (options.selected ?? {}) ? (options.selected as DateValue) : today;
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
    mode: options.mode ?? "single",
    selected: options.selected ?? null,
    today,
    visibleMonth,
  };
}

export function moveFocus(state: CalendarState, move: CalendarMove): CalendarState {
  const nextFocusedDate = getMovedDate(state.focusedDate, move);
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
  const selected = state.mode === "single" ? state.focusedDate : state.selected;

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

function getMovedDate(value: DateValue, move: CalendarMove): DateValue {
  switch (move) {
    case "next-day":
      return addDays(value, 1);
    case "previous-day":
      return addDays(value, -1);
    case "next-week":
      return addDays(value, 7);
    case "previous-week":
      return addDays(value, -7);
    case "month-start":
      return startOfMonth(value);
    case "month-end":
      return endOfMonth(value);
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
