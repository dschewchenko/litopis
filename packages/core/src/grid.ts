import {
  addDays,
  compareDates,
  endOfMonth,
  formatDate,
  isDateDisabled,
  isSameDate,
  startOfMonth,
  toLocalDate,
} from "./date";
import type {
  CalendarGrid,
  CalendarGridCell,
  DateRangeValue,
  DateValue,
  FirstDayOfWeek,
} from "./types";

export function createCalendarGrid(
  visibleMonth: DateValue,
  selected: DateValue | DateRangeValue | null,
  today: DateValue,
  locale: string,
  firstDayOfWeek: FirstDayOfWeek,
  min: DateValue | null,
  max: DateValue | null,
): CalendarGrid {
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const firstDayOffset = (toLocalDate(monthStart).getDay() - firstDayOfWeek + 7) % 7;
  let weekStart = addDays(monthStart, -firstDayOffset);
  const weeks: CalendarGridCell[][] = [];

  while (compareDates(weekStart, monthEnd) <= 0) {
    const week: CalendarGridCell[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addDays(weekStart, dayIndex);

      week.push({
        date,
        disabled: isDateDisabled(date, min, max),
        outsideMonth: date.month !== visibleMonth.month,
        selected: isSelected(date, selected),
        today: isSameDate(date, today),
      });
    }

    weeks.push(week);
    weekStart = addDays(weekStart, 7);
  }

  return {
    label: formatDate(visibleMonth, locale, { month: "long", year: "numeric" }),
    weeks,
  };
}

function isSelected(date: DateValue, selected: DateValue | DateRangeValue | null): boolean {
  if (!selected) {
    return false;
  }

  if ("day" in selected) {
    return isSameDate(date, selected);
  }

  return isSameDate(date, selected.start) || isSameDate(date, selected.end);
}
