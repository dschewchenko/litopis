import { createDatePicker, parseDateFieldValue, type DatePickerController } from "@litopis/dom";
import { toIsoDate } from "@litopis/core";
import type { DatePickerOptions, DateValue } from "@litopis/dom";

type ElementDateFieldFormat = "dd.mm.yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
type ElementFirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type ElementCalendarMode = "inline" | "popover";
type ElementTargetSize = "comfortable" | "compact";

const dateFieldFormats = new Set<ElementDateFieldFormat>([
  "dd.mm.yyyy",
  "mm/dd/yyyy",
  "yyyy-mm-dd",
]);

export class LitopisDatePickerElement extends HTMLElement {
  #controller: DatePickerController | null = null;
  #value: DateValue | null = null;

  static get observedAttributes(): string[] {
    return [
      "calendar-mode",
      "first-day-of-week",
      "input-format",
      "label",
      "locale",
      "max",
      "min",
      "show-outside-days",
      "show-season",
      "show-today-button",
      "target-size",
      "today-label",
      "value",
    ];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.value = newValue ?? "";
      return;
    }

    if (this.#controller) {
      this.#controller.setOptions(this.#getOptions());
    }
  }

  connectedCallback(): void {
    if (this.#controller) {
      return;
    }

    this.#mount();
  }

  disconnectedCallback(): void {
    this.#value = this.#controller?.getDate() ?? this.#value;
    this.#controller?.destroy();
    this.#controller = null;
  }

  get value(): string {
    return this.#controller?.getValue() ?? (this.#value ? toIsoDate(this.#value) : "");
  }

  set value(value: string) {
    this.#value = parseDateFieldValue(value, "yyyy-mm-dd");
    this.#controller?.setDate(this.#value);
  }

  #mount(): void {
    this.#controller?.destroy();
    this.#controller = createDatePicker(this, this.#getOptions());
  }

  #getOptions(): DatePickerOptions {
    const locale = this.getAttribute("locale");
    const calendarMode = getCalendarMode(this.getAttribute("calendar-mode"));
    const inputFormat = getInputFormat(this.getAttribute("input-format"));
    const firstDayOfWeek = getFirstDayOfWeek(this.getAttribute("first-day-of-week"));
    const max = getDateAttribute(this.getAttribute("max"));
    const min = getDateAttribute(this.getAttribute("min"));
    const targetSize = getTargetSize(this.getAttribute("target-size"));

    return {
      ...(calendarMode === undefined ? {} : { calendarMode }),
      ...(firstDayOfWeek === undefined ? {} : { firstDayOfWeek }),
      ...(inputFormat === undefined ? {} : { inputFormat }),
      label: this.getAttribute("label") ?? "Date",
      ...(locale === null ? {} : { locale }),
      ...(max === undefined ? {} : { max }),
      ...(min === undefined ? {} : { min }),
      onValueChange: (value) => {
        this.#value = value;
      },
      selected: this.#value,
      ...(this.hasAttribute("show-outside-days")
        ? { showOutsideDays: getBooleanAttribute(this.getAttribute("show-outside-days")) }
        : {}),
      ...(this.hasAttribute("show-season")
        ? { showSeason: getBooleanAttribute(this.getAttribute("show-season")) }
        : {}),
      ...(this.hasAttribute("show-today-button")
        ? { showTodayButton: getBooleanAttribute(this.getAttribute("show-today-button")) }
        : {}),
      ...(targetSize === undefined ? {} : { targetSize }),
      ...(this.getAttribute("today-label") === null
        ? {}
        : { todayLabel: this.getAttribute("today-label") ?? "Today" }),
    };
  }
}

function getDateAttribute(value: string | null): DateValue | undefined {
  if (!value) {
    return undefined;
  }

  return parseDateFieldValue(value, "yyyy-mm-dd") ?? undefined;
}

function getCalendarMode(value: string | null): ElementCalendarMode | undefined {
  if (value === "inline" || value === "popover") {
    return value;
  }

  return undefined;
}

function getInputFormat(value: string | null): ElementDateFieldFormat | undefined {
  if (!value || !dateFieldFormats.has(value as ElementDateFieldFormat)) {
    return undefined;
  }

  return value as ElementDateFieldFormat;
}

function getFirstDayOfWeek(value: string | null): ElementFirstDayOfWeek | undefined {
  const day = Number(value);

  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return undefined;
  }

  return day as ElementFirstDayOfWeek;
}

function getTargetSize(value: string | null): ElementTargetSize | undefined {
  if (value === "comfortable" || value === "compact") {
    return value;
  }

  return undefined;
}

function getBooleanAttribute(value: string | null): boolean {
  return value === "" || value === "true";
}
