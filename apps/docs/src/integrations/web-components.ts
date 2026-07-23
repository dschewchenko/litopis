import "@litopis/elements";
import { toIsoDate } from "@litopis/core";
import type { LitopisDatePickerElement } from "@litopis/elements";
import { integrationToday } from "./shared";

const picker = document.querySelector<LitopisDatePickerElement>(
  "litopis-date-picker[data-integration-demo='web-components']",
);

if (picker) {
  picker.value = toIsoDate(integrationToday);
}
