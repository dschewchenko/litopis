import { createDatePicker, type DatePickerController } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#popover-picker")!;
const output = document.querySelector<HTMLOutputElement>("#popover-value")!;

let picker: DatePickerController;
function updateValue(): void {
  output.value = picker.getISOValue() || "Value: none";
}

picker = createDatePicker(root, {
  closeOnSelect: false,
  format: "dd.mm.yyyy",
  label: "Departure date",
  mode: "popover",
  outsideDays: false,
  onValueChange: updateValue,
  size: "comfortable",
});
