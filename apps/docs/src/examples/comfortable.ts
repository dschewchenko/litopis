import { createDatePicker, type DatePickerController } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#comfortable-picker")!;
const output = document.querySelector<HTMLOutputElement>("#comfortable-value")!;

let picker: DatePickerController;
function updateValue(): void {
  output.value = picker.getISOValue() || "Value: none";
}

picker = createDatePicker(root, {
  format: "dd.mm.yyyy",
  label: "Appointment date",
  onValueChange: updateValue,
  outsideDays: false,
  season: true,
  size: "comfortable",
  todayButton: true,
});
