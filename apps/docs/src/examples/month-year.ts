import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const monthRoot = document.querySelector<HTMLElement>("#month-picker")!;
const yearRoot = document.querySelector<HTMLElement>("#year-picker")!;
const monthOutput = document.querySelector<HTMLOutputElement>("#month-value")!;
const yearOutput = document.querySelector<HTMLOutputElement>("#year-value")!;

function updateMonthValue(): void {
  monthOutput.value = monthPicker.getISOValue() || "Select a month";
}

function updateYearValue(): void {
  yearOutput.value = yearPicker.getISOValue() || "Select a year";
}

const monthPicker = createDatePicker(monthRoot, {
  granularity: "month",
  label: "Billing month",
  name: "billingMonth",
  onValueChange: updateMonthValue,
});

const yearPicker = createDatePicker(yearRoot, {
  granularity: "year",
  label: "Fiscal year",
  name: "fiscalYear",
  onValueChange: updateYearValue,
});
