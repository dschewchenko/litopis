import { createDatePicker, parseDateFieldValue, type DatePickerController } from "@litopis/dom";
import { toIsoDate } from "@litopis/core";
import type {
  DatePickerOptions,
  DatePickerPanels,
  DatePickerRangeLabels,
  DatePickerRangeNames,
  DateRange,
  DateValue,
} from "@litopis/dom";

type ElementDateFieldFormat = "dd.mm.yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
type ElementFirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type ElementMode = "inline" | "popover";
type ElementSize = "comfortable" | "compact";
type ElementLayout = "single" | "split";
type ElementPanels = DatePickerPanels;
type ElementGranularity = "day" | "month" | "year";
type ElementSelection = "single" | "range";

const dateFieldFormats: readonly ElementDateFieldFormat[] = [
  "dd.mm.yyyy",
  "mm/dd/yyyy",
  "yyyy-mm-dd",
];

const firstDaysOfWeek = new Map<string, ElementFirstDayOfWeek>([
  ["0", 0],
  ["1", 1],
  ["2", 2],
  ["3", 3],
  ["4", 4],
  ["5", 5],
  ["6", 6],
]);

export class LitopisDatePickerElement extends HTMLElement {
  #controller: DatePickerController | null = null;
  #rangeLabels: DatePickerRangeLabels | null = null;
  #rangeNames: DatePickerRangeNames | null = null;
  #range: DateRange = { end: null, start: null };
  #value: DateValue | null = null;

  static get observedAttributes(): string[] {
    return [
      "mode",
      "clear-button",
      "clear-label",
      "close-on-select",
      "end",
      "layout",
      "first-day-of-week",
      "granularity",
      "format",
      "label",
      "name",
      "locale",
      "max",
      "min",
      "outside-days",
      "season",
      "today-button",
      "selection",
      "start",
      "size",
      "today-label",
      "value",
      "panels",
    ];
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.value = newValue ?? "";
      return;
    }

    if (name === "start" || name === "end") {
      this.#range = getRangeAttributes(this);
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
    const value = this.#controller?.getValue();

    if (isDateRange(value)) {
      this.#range = value;
    } else if (value) {
      this.#value = value;
    }
    this.#controller?.destroy();
    this.#controller = null;
  }

  get value(): string {
    if (getSelection(this.getAttribute("selection")) === "range") {
      return this.#controller?.getISOValue() ?? getRangeValue(this.#range);
    }

    return this.#controller?.getISOValue() ?? (this.#value ? toIsoDate(this.#value) : "");
  }

  set value(value: string) {
    if (getSelection(this.getAttribute("selection")) === "range") {
      this.#range = getRangeAttribute(value);
      setRangeAttributes(this, this.#range);
      this.#controller?.setRange(this.#range);
      return;
    }

    this.#value = parseDateFieldValue(value, "yyyy-mm-dd");
    this.#controller?.setDate(this.#value);
  }

  get label(): string | DatePickerRangeLabels | null {
    return this.#rangeLabels ?? this.getAttribute("label");
  }

  set label(value: string | DatePickerRangeLabels | null) {
    if (typeof value === "string" || value === null) {
      this.#rangeLabels = null;
      if (value === null) this.removeAttribute("label");
      else this.setAttribute("label", value);
      return;
    }

    this.#rangeLabels = value;
    this.removeAttribute("label");
    this.#controller?.setOptions(this.#getOptions());
  }

  get name(): string | DatePickerRangeNames | null {
    return this.#rangeNames ?? this.getAttribute("name");
  }

  set name(value: string | DatePickerRangeNames | null) {
    if (typeof value === "string" || value === null) {
      this.#rangeNames = null;
      if (value === null) this.removeAttribute("name");
      else this.setAttribute("name", value);
      return;
    }

    this.#rangeNames = value;
    this.removeAttribute("name");
    this.#controller?.setOptions(this.#getOptions());
  }

  #mount(): void {
    this.#controller?.destroy();
    this.#controller = createDatePicker(this, this.#getOptions());
  }

  #getOptions(): DatePickerOptions {
    const locale = this.getAttribute("locale");
    const mode = getCalendarMode(this.getAttribute("mode"));
    const format = getInputFormat(this.getAttribute("format"));
    const firstDayOfWeek = getFirstDayOfWeek(this.getAttribute("first-day-of-week"));
    const max = getDateAttribute(this.getAttribute("max"));
    const min = getDateAttribute(this.getAttribute("min"));
    const size = getTargetSize(this.getAttribute("size"));
    const selection = getSelection(this.getAttribute("selection"));
    const granularity = getGranularity(this.getAttribute("granularity"));
    const layout = getFieldLayout(this.getAttribute("layout"));
    const panels = getVisiblePanels(this.getAttribute("panels"));

    return {
      ...(mode === undefined ? {} : { mode }),
      ...(this.hasAttribute("clear-button")
        ? { clearButton: getBooleanAttribute(this.getAttribute("clear-button")) }
        : {}),
      ...(this.getAttribute("clear-label") === null
        ? {}
        : { clearLabel: this.getAttribute("clear-label") ?? "Clear" }),
      ...(this.hasAttribute("close-on-select")
        ? { closeOnSelect: getBooleanAttribute(this.getAttribute("close-on-select")) }
        : {}),
      ...(firstDayOfWeek === undefined ? {} : { firstDayOfWeek }),
      ...(format === undefined ? {} : { format }),
      ...(selection === undefined ? {} : { selection }),
      ...(granularity === undefined ? {} : { granularity }),
      ...(layout === undefined ? {} : { layout }),
      ...(panels === undefined ? {} : { panels }),
      ...(this.name === null ? {} : { name: this.name }),
      ...(this.label === null ? {} : { label: this.label }),
      ...(locale === null ? {} : { locale }),
      ...(max === undefined ? {} : { max }),
      ...(min === undefined ? {} : { min }),
      onValueChange: (value) => {
        this.#value = value;
      },
      onRangeChange: (value) => {
        this.#range = value;
      },
      range: this.#range.start || this.#range.end ? this.#range : getRangeAttributes(this),
      selected: this.#value,
      ...(this.hasAttribute("outside-days")
        ? { outsideDays: getBooleanAttribute(this.getAttribute("outside-days")) }
        : {}),
      ...(this.hasAttribute("season")
        ? { season: getBooleanAttribute(this.getAttribute("season")) }
        : {}),
      ...(this.hasAttribute("today-button")
        ? { todayButton: getBooleanAttribute(this.getAttribute("today-button")) }
        : {}),
      ...(size === undefined ? {} : { size }),
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

function getCalendarMode(value: string | null): ElementMode | undefined {
  if (value === "inline" || value === "popover") {
    return value;
  }

  return undefined;
}

function getInputFormat(value: string | null): ElementDateFieldFormat | undefined {
  for (const format of dateFieldFormats) {
    if (value === format) {
      return format;
    }
  }

  return undefined;
}

function getFirstDayOfWeek(value: string | null): ElementFirstDayOfWeek | undefined {
  return value === null ? undefined : firstDaysOfWeek.get(value);
}

function getTargetSize(value: string | null): ElementSize | undefined {
  if (value === "comfortable" || value === "compact") {
    return value;
  }

  return undefined;
}

function getBooleanAttribute(value: string | null): boolean {
  return value === "" || value === "true";
}

function getSelection(value: string | null): ElementSelection | undefined {
  return value === "single" || value === "range" ? value : undefined;
}

function getGranularity(value: string | null): ElementGranularity | undefined {
  return value === "day" || value === "month" || value === "year" ? value : undefined;
}

function getFieldLayout(value: string | null): ElementLayout | undefined {
  return value === "single" || value === "split" ? value : undefined;
}

function getVisiblePanels(value: string | null): ElementPanels | undefined {
  if (value === "1") return 1;
  if (value === "2") return 2;
  return value === "auto" ? "auto" : undefined;
}

function getRangeAttributes(element: HTMLElement): DateRange {
  return {
    end: getDateAttribute(element.getAttribute("end")) ?? null,
    start: getDateAttribute(element.getAttribute("start")) ?? null,
  };
}

function getRangeAttribute(value: string): DateRange {
  const [start, end, extra] = value.split("/");
  if (!start || !end || extra) return { end: null, start: null };
  return {
    end: parseDateFieldValue(end, "yyyy-mm-dd"),
    start: parseDateFieldValue(start, "yyyy-mm-dd"),
  };
}

function getRangeValue(range: DateRange): string {
  if (!range.start || !range.end) return "";
  return `${toIsoDate(range.start)}/${toIsoDate(range.end)}`;
}

function isDateRange(value: DateValue | DateRange | null | undefined): value is DateRange {
  return Boolean(value && "start" in value);
}

function setRangeAttributes(element: HTMLElement, range: DateRange): void {
  if (range.start) element.setAttribute("start", toIsoDate(range.start));
  else element.removeAttribute("start");
  if (range.end) element.setAttribute("end", toIsoDate(range.end));
  else element.removeAttribute("end");
}
