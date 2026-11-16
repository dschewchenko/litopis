import { createDatePicker, type DatePickerController } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const monthRoot = document.querySelector<HTMLElement>("#month-picker")!;
const yearRoot = document.querySelector<HTMLElement>("#year-picker")!;
const monthOutput = document.querySelector<HTMLOutputElement>("#month-value")!;
const yearOutput = document.querySelector<HTMLOutputElement>("#year-value")!;

let monthPicker: DatePickerController;
function updateMonthValue(): void {
  monthOutput.value = monthPicker.getISOValue() || "Select a month";
}

let yearPicker: DatePickerController;
function updateYearValue(): void {
  yearOutput.value = yearPicker.getISOValue() || "Select a year";
}

monthPicker = createDatePicker(monthRoot, {
  granularity: "month",
  label: "Billing month",
  name: "billingMonth",
  onValueChange: updateMonthValue,
});

yearPicker = createDatePicker(yearRoot, {
  granularity: "year",
  label: "Fiscal year",
  name: "fiscalYear",
  onValueChange: updateYearValue,
});
