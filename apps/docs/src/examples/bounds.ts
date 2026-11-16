import { addDays, getToday } from "@litopis/core";
import { createDatePicker, type DatePickerController } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#bounds-picker")!;
const output = document.querySelector<HTMLOutputElement>("#bounds-value")!;
const today = getToday();

let picker: DatePickerController;
function updateValue(): void {
  output.value = picker.getISOValue() || "Value: none";
}

picker = createDatePicker(root, {
  label: "Booking date",
  max: addDays(today, 15),
  min: addDays(today, -15),
  onValueChange: updateValue,
  outsideDays: false,
  today,
});
