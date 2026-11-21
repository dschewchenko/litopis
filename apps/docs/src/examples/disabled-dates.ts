import { addDays, getToday, toIsoDate } from "@litopis/core";
import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#disabled-dates-picker")!;
const toggleButton = document.querySelector<HTMLButtonElement>("#disabled-dates-toggle")!;
const datesOutput = document.querySelector<HTMLOutputElement>("#disabled-dates-list")!;
const valueOutput = document.querySelector<HTMLOutputElement>("#disabled-dates-value")!;
const today = getToday();
const firstUnavailableDate = addDays(today, 3);
const secondUnavailableDate = addDays(today, 6);
let showSecondUnavailableDate = false;

function getUnavailableDates() {
  return showSecondUnavailableDate
    ? [firstUnavailableDate, secondUnavailableDate]
    : [firstUnavailableDate];
}

function updateUnavailableDates(): void {
  const dates = getUnavailableDates();
  datesOutput.value = "Unavailable: " + dates.map(toIsoDate).join(", ");
}

function updateSelectedValue(): void {
  valueOutput.value = picker.getISOValue() || "Value: none";
}

const picker = createDatePicker(root, {
  disabledDates: getUnavailableDates(),
  label: "Arrival date",
  onValueChange: updateSelectedValue,
  today,
});

updateUnavailableDates();
toggleButton.addEventListener("click", () => {
  showSecondUnavailableDate = !showSecondUnavailableDate;
  const disabledDates = getUnavailableDates();
  picker.setOptions({
    disabledDates,
    label: "Arrival date",
    onValueChange: updateSelectedValue,
    today,
  });
  toggleButton.textContent = showSecondUnavailableDate
    ? "Use one unavailable date"
    : "Block a second date";
  updateUnavailableDates();
  updateSelectedValue();
});
