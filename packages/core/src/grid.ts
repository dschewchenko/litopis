import {
  formatDate,
  getDaysInMonth,
  isDateDisabled,
  isSameDate,
  MAX_YEAR,
  MIN_YEAR,
  startOfMonth,
  toLocalDate,
} from "./date";
import { isDateInDateRange, isRangeBoundary } from "./range";
import type { CalendarGrid, CalendarGridCell, DateRange, DateValue, FirstDayOfWeek } from "./types";

export function createCalendarGrid(
  visibleMonth: DateValue,
  selected: DateValue | null,
  today: DateValue,
  locale: string,
  firstDayOfWeek: FirstDayOfWeek,
  min: DateValue | null,
  max: DateValue | null,
  range: DateRange = { end: null, start: null },
): CalendarGrid {
  const monthStart = startOfMonth(visibleMonth);
  const firstDayOffset = (toLocalDate(monthStart).getDay() - firstDayOfWeek + 7) % 7;
  const monthDays = getDaysInMonth(monthStart);
  const cellCount = Math.ceil((firstDayOffset + monthDays) / 7) * 7;
  const weeks: CalendarGridCell[][] = [];

  for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 7) {
    const week: CalendarGridCell[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = getGridDate(monthStart, cellIndex + dayIndex - firstDayOffset);

      week.push({
        date,
        disabled: !date || isDateDisabled(date, min, max),
        outsideMonth: !date || date.month !== visibleMonth.month,
        inRange: date ? isDateInDateRange(date, range) : false,
        rangeEnd: date ? isRangeBoundary(date, { end: range.end, start: null }) : false,
        rangeStart: date ? isRangeBoundary(date, { end: null, start: range.start }) : false,
        selected: date ? isSameDate(date, selected) : false,
        today: date ? isSameDate(date, today) : false,
      });
    }

    weeks.push(week);
  }

  return {
    label: formatDate(visibleMonth, locale, { month: "long", year: "numeric" }),
    weeks,
  };
}

function getGridDate(monthStart: DateValue, dayOffset: number): DateValue | null {
  const date = toLocalDate(monthStart);
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear();

  if (year < MIN_YEAR || year > MAX_YEAR) {
    return null;
  }

  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year,
  };
}
