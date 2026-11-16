import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const form = document.querySelector<HTMLFormElement>("#range-form")!;
const root = document.querySelector<HTMLElement>("#range-picker")!;
const output = document.querySelector<HTMLOutputElement>("#range-value")!;

function updateFormValue(): void {
  const values = new FormData(form);
  const from = values.get("from") as string | null;
  const to = values.get("to") as string | null;
  output.value = `From: ${from || "not selected"} · To: ${to || "not selected"}`;
}

createDatePicker(root, {
  label: { end: "Return", start: "Departure" },
  layout: "split",
  name: { end: "to", start: "from" },
  onRangeChange: updateFormValue,
  selection: "range",
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateFormValue();
});
