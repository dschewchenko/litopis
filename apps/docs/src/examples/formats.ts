import { createDatePicker, type DatePickerController } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const isoRoot = document.querySelector<HTMLElement>("#format-iso-picker")!;
const europeanRoot = document.querySelector<HTMLElement>("#format-european-picker")!;
const usRoot = document.querySelector<HTMLElement>("#format-us-picker")!;
const isoOutput = document.querySelector<HTMLOutputElement>("#format-iso-value")!;
const europeanOutput = document.querySelector<HTMLOutputElement>("#format-european-value")!;
const usOutput = document.querySelector<HTMLOutputElement>("#format-us-value")!;

let isoPicker: DatePickerController;
function updateISOValue(): void {
  isoOutput.value = isoPicker.getISOValue() || "No date selected";
}

let europeanPicker: DatePickerController;
function updateEuropeanValue(): void {
  europeanOutput.value = europeanPicker.getISOValue() || "No date selected";
}

let usPicker: DatePickerController;
function updateUSValue(): void {
  usOutput.value = usPicker.getISOValue() || "No date selected";
}

isoPicker = createDatePicker(isoRoot, {
  format: "yyyy-mm-dd",
  label: "ISO format",
  onValueChange: updateISOValue,
});

europeanPicker = createDatePicker(europeanRoot, {
  format: "dd.mm.yyyy",
  label: "European format",
  onValueChange: updateEuropeanValue,
});

usPicker = createDatePicker(usRoot, {
  format: "mm/dd/yyyy",
  label: "US format",
  onValueChange: updateUSValue,
});
