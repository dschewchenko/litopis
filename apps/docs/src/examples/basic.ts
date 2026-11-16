import { createDatePicker, type DatePickerController } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#basic-picker")!;
const output = document.querySelector<HTMLOutputElement>("#basic-value")!;

let picker: DatePickerController;
function updateValue(): void {
  output.value = picker.getISOValue() || "Select a date";
}

picker = createDatePicker(root, {
  label: "Appointment date",
  name: "appointment",
  onValueChange: updateValue,
});
