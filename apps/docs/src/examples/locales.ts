import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const ukrainianRoot = document.querySelector<HTMLElement>("#locale-uk-picker")!;
const usRoot = document.querySelector<HTMLElement>("#locale-us-picker")!;

createDatePicker(ukrainianRoot, {
  format: "dd.mm.yyyy",
  label: "Дата події",
  locale: "uk-UA",
});

createDatePicker(usRoot, {
  firstDayOfWeek: 1,
  format: "mm/dd/yyyy",
  label: "Event date",
  locale: "en-US",
});
