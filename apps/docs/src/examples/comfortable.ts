import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#comfortable-picker")!;
const output = document.querySelector<HTMLOutputElement>("#comfortable-value")!;

function updateValue(): void {
  output.value = picker.getISOValue() || "Value: none";
}

const picker = createDatePicker(root, {
  format: "dd.mm.yyyy",
  label: "Appointment date",
  onValueChange: updateValue,
  outsideDays: false,
  season: true,
  size: "comfortable",
  todayButton: true,
});
