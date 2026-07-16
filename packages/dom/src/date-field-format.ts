import {
  compareDates,
  getDaysInMonth,
  MAX_YEAR,
  MIN_YEAR,
  toIsoDate,
  type DateValue,
} from "@litopis/core";
import type { DateFieldFormat } from "./types";

interface FormatParts {
  readonly day: string;
  readonly month: string;
  readonly year: string;
}

interface MaskedDateFieldInput {
  readonly selectionEnd: number;
  readonly selectionStart: number;
  readonly value: string;
}

export function formatDateFieldValue(value: DateValue, format: DateFieldFormat): string {
  const day = String(value.day).padStart(2, "0");
  const month = String(value.month).padStart(2, "0");
  const year = String(value.year).padStart(4, "0");

  switch (format) {
    case "dd.mm.yyyy":
      return `${day}.${month}.${year}`;
    case "mm/dd/yyyy":
      return `${month}/${day}/${year}`;
    case "yyyy-mm-dd":
      return `${year}-${month}-${day}`;
  }
}

export function maskDateFieldInput(value: string, format: DateFieldFormat): string {
  const parts = normalizeCompletedParts(getPartialFormatParts(value, format));

  switch (format) {
    case "dd.mm.yyyy":
      return joinDateParts([parts.day, parts.month, parts.year], ".");
    case "mm/dd/yyyy":
      return joinDateParts([parts.month, parts.day, parts.year], "/");
    case "yyyy-mm-dd":
      return joinDateParts([parts.year, parts.month, parts.day], "-");
  }
}

export function maskDateFieldEdit(
  value: string,
  format: DateFieldFormat,
  selectionStart: number | null,
  selectionEnd: number | null,
): MaskedDateFieldInput {
  const digitSelectionStart = countDigitsBefore(value, selectionStart ?? value.length);
  const digitSelectionEnd = countDigitsBefore(
    value,
    selectionEnd ?? selectionStart ?? value.length,
  );
  const masked = maskDateFieldInput(value, format);

  return {
    selectionEnd: getCaretPositionForDigitIndex(masked, digitSelectionEnd),
    selectionStart: getCaretPositionForDigitIndex(masked, digitSelectionStart),
    value: masked,
  };
}

export function parseDateFieldValue(value: string, format: DateFieldFormat): DateValue | null {
  const parts = getFormatParts(value, format);

  if (!parts) {
    return null;
  }

  const date = {
    day: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
  };

  if (!isValidDate(date)) {
    return null;
  }

  return date;
}

export function clampDateFieldValue(
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

export function parseDateFieldPreviewMonth(
  value: string,
  format: DateFieldFormat,
  fallbackYear: number,
): DateValue | null {
  const digits = value.replace(/\D/g, "");

  switch (format) {
    case "dd.mm.yyyy": {
      if (digits.length < 4) {
        return null;
      }

      const month = Number(digits.slice(2, 4));
      const year = digits.length >= 8 ? Number(digits.slice(4, 8)) : fallbackYear;
      return getValidPreviewMonth(month, year);
    }
    case "mm/dd/yyyy": {
      if (digits.length < 2) {
        return null;
      }

      const month = Number(digits.slice(0, 2));
      const year = digits.length >= 8 ? Number(digits.slice(4, 8)) : fallbackYear;
      return getValidPreviewMonth(month, year);
    }
    case "yyyy-mm-dd": {
      if (digits.length < 6) {
        return null;
      }

      return getValidPreviewMonth(Number(digits.slice(4, 6)), Number(digits.slice(0, 4)));
    }
  }
}

export function getDateFieldPlaceholder(format: DateFieldFormat): string {
  switch (format) {
    case "dd.mm.yyyy":
      return "DD.MM.YYYY";
    case "mm/dd/yyyy":
      return "MM/DD/YYYY";
    case "yyyy-mm-dd":
      return "YYYY-MM-DD";
  }
}

export function getDateFieldError(
  value: DateValue | null,
  min: DateValue | null,
  max: DateValue | null,
): string {
  if (!value) {
    return "Enter a valid date.";
  }

  if (min && compareDates(value, min) < 0) {
    return `Date must be on or after ${toIsoDate(min)}.`;
  }

  if (max && compareDates(value, max) > 0) {
    return `Date must be on or before ${toIsoDate(max)}.`;
  }

  return "";
}

export function isDateInRange(
  value: DateValue | null,
  min: DateValue | null,
  max: DateValue | null,
): boolean {
  return Boolean(value && !getDateFieldError(value, min, max));
}

function getValidPreviewMonth(month: number, year: number): DateValue | null {
  if (!Number.isInteger(month) || !Number.isInteger(year) || year < 1 || month < 1 || month > 12) {
    return null;
  }

  return { day: 1, month, year };
}

function joinDateParts(parts: readonly string[], separator: string): string {
  return parts.filter(Boolean).join(separator);
}

function getPartialFormatParts(value: string, format: DateFieldFormat): FormatParts {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  switch (format) {
    case "dd.mm.yyyy":
      return {
        day: digits.slice(0, 2),
        month: digits.slice(2, 4),
        year: digits.slice(4, 8),
      };
    case "mm/dd/yyyy":
      return {
        day: digits.slice(2, 4),
        month: digits.slice(0, 2),
        year: digits.slice(4, 8),
      };
    case "yyyy-mm-dd":
      return {
        day: digits.slice(6, 8),
        month: digits.slice(4, 6),
        year: digits.slice(0, 4),
      };
  }
}

function normalizeCompletedParts(parts: FormatParts): FormatParts {
  const month =
    parts.month.length === 2
      ? String(clampNumber(Number(parts.month), 1, 12)).padStart(2, "0")
      : parts.month;
  const year = parts.year;
  const maxDay =
    month.length === 2 && year.length === 4
      ? getDaysInMonth({ day: 1, month: Number(month), year: Number(year) })
      : 31;
  const day =
    parts.day.length === 2
      ? String(clampNumber(Number(parts.day), 1, maxDay)).padStart(2, "0")
      : parts.day;

  return { day, month, year };
}

function getFormatParts(value: string, format: DateFieldFormat): FormatParts | null {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 8) {
    return null;
  }

  switch (format) {
    case "dd.mm.yyyy":
      return {
        day: digits.slice(0, 2),
        month: digits.slice(2, 4),
        year: digits.slice(4, 8),
      };
    case "mm/dd/yyyy":
      return {
        day: digits.slice(2, 4),
        month: digits.slice(0, 2),
        year: digits.slice(4, 8),
      };
    case "yyyy-mm-dd":
      return {
        day: digits.slice(6, 8),
        month: digits.slice(4, 6),
        year: digits.slice(0, 4),
      };
  }
}

function isValidDate(value: DateValue): boolean {
  return (
    Number.isInteger(value.day) &&
    Number.isInteger(value.month) &&
    Number.isInteger(value.year) &&
    value.year >= MIN_YEAR &&
    value.year <= MAX_YEAR &&
    value.month >= 1 &&
    value.month <= 12 &&
    value.day >= 1 &&
    value.day <= getDaysInMonth(value)
  );
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function countDigitsBefore(value: string, position: number): number {
  return value.slice(0, position).replace(/\D/g, "").length;
}

function getCaretPositionForDigitIndex(value: string, digitIndex: number): number {
  if (digitIndex <= 0) {
    return 0;
  }

  let digitsSeen = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index] ?? "")) {
      digitsSeen += 1;
    }

    if (digitsSeen >= digitIndex) {
      return index + 1;
    }
  }

  return value.length;
}
