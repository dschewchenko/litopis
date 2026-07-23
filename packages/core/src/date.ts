import { resolveLocale } from "./locale";
import type { DateValue } from "./types";

export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;
const MIN_DATE: DateValue = { day: 1, month: 1, year: MIN_YEAR };
const MAX_DATE: DateValue = { day: 31, month: 12, year: MAX_YEAR };

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
  assertDateValue(value);
  assertIntegerOffset(days);
  const date = toLocalDate(value);
  date.setDate(date.getDate() + days);

  return clampToSupportedRange(fromLocalDate(date));
}

export function addMonths(value: DateValue, months: number): DateValue {
  assertDateValue(value);
  assertIntegerOffset(months);
  const monthIndex = Math.min(
    Math.max((value.year - 1) * 12 + value.month - 1 + months, 0),
    (MAX_YEAR - 1) * 12 + 11,
  );
  const year = Math.floor(monthIndex / 12) + 1;
  const month = (monthIndex % 12) + 1;

  return {
    day: Math.min(value.day, getDaysInMonth({ day: 1, month, year })),
    month,
    year,
  };
}

export function addYears(value: DateValue, years: number): DateValue {
  assertDateValue(value);
  assertIntegerOffset(years);
  const year = Math.min(Math.max(value.year + years, MIN_YEAR), MAX_YEAR);

  return {
    day: Math.min(value.day, getDaysInMonth({ day: 1, month: value.month, year })),
    month: value.month,
    year,
  };
}

export function getDaysInMonth(value: DateValue): number {
  if (
    !Number.isInteger(value.year) ||
    value.year < MIN_YEAR ||
    value.year > MAX_YEAR ||
    !Number.isInteger(value.month) ||
    value.month < 1 ||
    value.month > 12
  ) {
    throw new RangeError("Date month and year must be within 0001-01 through 9999-12.");
  }

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
  assertDateValue(value);

  if (min) {
    assertDateValue(min);
  }

  if (max) {
    assertDateValue(max);
  }

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
  assertDateValue(value);
  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(toLocalDate(value));
}

export function toIsoDate(value: DateValue): string {
  assertDateValue(value);
  const year = String(value.year).padStart(4, "0");
  const month = String(value.month).padStart(2, "0");
  const day = String(value.day).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function toLocalDate(value: DateValue): Date {
  assertDateValue(value);
  const date = new Date(0);
  date.setFullYear(value.year, value.month - 1, value.day);
  date.setHours(12, 0, 0, 0);

  return date;
}

export function isValidDateValue(value: DateValue): boolean {
  return (
    Number.isInteger(value.day) &&
    Number.isInteger(value.month) &&
    Number.isInteger(value.year) &&
    value.year >= MIN_YEAR &&
    value.year <= MAX_YEAR &&
    value.month >= 1 &&
    value.month <= 12 &&
    value.day >= 1 &&
    value.day <= getDaysInMonth({ day: 1, month: value.month, year: value.year })
  );
}

function fromLocalDate(date: Date): DateValue {
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

function clampToSupportedRange(value: DateValue): DateValue {
  if (value.year < MIN_YEAR) {
    return MIN_DATE;
  }

  if (value.year > MAX_YEAR) {
    return MAX_DATE;
  }

  return value;
}

function assertDateValue(value: DateValue): void {
  if (!isValidDateValue(value)) {
    throw new RangeError("Date must be within 0001-01-01 through 9999-12-31.");
  }
}

function assertIntegerOffset(value: number): void {
  if (!Number.isInteger(value)) {
    throw new TypeError("Date offsets must be integers.");
  }
}
