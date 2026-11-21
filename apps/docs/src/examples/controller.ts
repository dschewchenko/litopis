import { addDays, addMonths, getToday, startOfMonth } from "@litopis/core";
import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#controller-picker")!;
const output = document.querySelector<HTMLOutputElement>("#controller-value")!;
const setDateButton = document.querySelector<HTMLButtonElement>("#controller-set-date")!;
const jumpButton = document.querySelector<HTMLButtonElement>("#controller-jump")!;
const todayButton = document.querySelector<HTMLButtonElement>("#controller-today")!;
const seasonButton = document.querySelector<HTMLButtonElement>("#controller-season")!;
const clearButton = document.querySelector<HTMLButtonElement>("#controller-clear")!;
const today = getToday();

function updateValue(): void {
  output.value = picker.getISOValue() || "Value: none";
}

const picker = createDatePicker(root, {
  label: "Programmatic date",
  onValueChange: updateValue,
  today,
});

setDateButton.addEventListener("click", () => picker.setDate(addDays(today, 9)));
jumpButton.addEventListener("click", () => {
  picker.setVisibleMonth(startOfMonth(addMonths(today, 6)));
});
todayButton.addEventListener("click", () => picker.goToToday());

let showSeason = false;
seasonButton.addEventListener("click", () => {
  showSeason = !showSeason;
  picker.setOptions({
    label: "Programmatic date",
    onValueChange: updateValue,
    season: showSeason,
    today,
  });
});

clearButton.addEventListener("click", () => picker.setDate(null));
