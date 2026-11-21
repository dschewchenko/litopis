import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#basic-picker")!;
const output = document.querySelector<HTMLOutputElement>("#basic-value")!;

function updateValue(): void {
  output.value = picker.getISOValue() || "Select a date";
}

const picker = createDatePicker(root, {
  label: "Appointment date",
  name: "appointment",
  onValueChange: updateValue,
});
