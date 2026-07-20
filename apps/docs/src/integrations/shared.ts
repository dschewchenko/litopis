import { getToday, toIsoDate } from "@litopis/core";
import type { DatePickerOptions, DateValue } from "@litopis/dom";

export const integrationToday = getToday();

export const integrationOptions: DatePickerOptions = {
  calendarMode: "popover",
  firstDayOfWeek: 1,
  inputFormat: "dd.mm.yyyy",
  showOutsideDays: false,
  targetSize: "comfortable",
  today: integrationToday,
};

export function updateIntegrationValue(value: DateValue | null): void {
  const output = document.querySelector<HTMLElement>("[data-integration-value]");

  if (output) {
    output.textContent = `Value: ${value ? toIsoDate(value) : "none"}`;
  }
}
