import { resolveLocale } from "./locale";
import type { DateValue } from "./types";

export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;

export function getToday(): DateValue {
  const date = new Date();

  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function compareDates(left: DateValue, right: DateValue): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }

  if (left.month !== right.month) {
    return left.month - right.month;
  }

  return left.day - right.day;
}

export function isSameDate(left: DateValue | null, right: DateValue | null): boolean {
  if (!left || !right) {
    return false;
  }

  return left.year === right.year && left.month === right.month && left.day === right.day;
}

export function addDays(value: DateValue, days: number): DateValue {
  const date = toLocalDate(value);
  date.setDate(date.getDate() + days);

  return fromLocalDate(date);
}

export function addMonths(value: DateValue, months: number): DateValue {
  const date = toLocalDate(value);
  date.setMonth(date.getMonth() + months);

  return fromLocalDate(date);
}

export function addYears(value: DateValue, years: number): DateValue {
  const date = toLocalDate(value);
  date.setFullYear(date.getFullYear() + years);

  return fromLocalDate(date);
}

export function getDaysInMonth(value: DateValue): number {
  const date = new Date(0);
  date.setFullYear(value.year, value.month, 0);
  date.setHours(12, 0, 0, 0);

  return date.getDate();
}

export function startOfMonth(value: DateValue): DateValue {
  return {
    day: 1,
    month: value.month,
    year: value.year,
  };
}

export function endOfMonth(value: DateValue): DateValue {
  return {
    day: getDaysInMonth(value),
    month: value.month,
    year: value.year,
  };
}

export function clampDate(
  value: DateValue,
  min: DateValue | null,
  max: DateValue | null,
): DateValue {
  if (min && compareDates(value, min) < 0) {
    return min;
  }

  if (max && compareDates(value, max) > 0) {
    return max;
  }

  return value;
}

export function isDateDisabled(
  value: DateValue,
  min: DateValue | null,
  max: DateValue | null,
): boolean {
  return Boolean((min && compareDates(value, min) < 0) || (max && compareDates(value, max) > 0));
}

export function formatDate(
  value: DateValue,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(toLocalDate(value));
}

export function toIsoDate(value: DateValue): string {
  const year = String(value.year).padStart(4, "0");
  const month = String(value.month).padStart(2, "0");
  const day = String(value.day).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toLocalDate(value: DateValue): Date {
  const date = new Date(0);
  date.setFullYear(value.year, value.month - 1, value.day);
  date.setHours(12, 0, 0, 0);

  return date;
}

function fromLocalDate(date: Date): DateValue {
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}
