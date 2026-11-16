import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/daisyui.css";

const demo = document.querySelector<HTMLElement>("[data-daisyui-demo]");
const form = demo?.querySelector<HTMLFormElement>("[data-daisyui-form]");
const root = demo?.querySelector<HTMLElement>("[data-daisyui-picker]");
const output = demo?.querySelector<HTMLOutputElement>("[data-daisyui-value]");

if (demo && form && root && output) {
  createDatePicker(root, {
    label: "Appointment date",
    name: "appointment",
    mode: "popover",
    format: "yyyy-mm-dd",
    size: "comfortable",
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = new FormData(form).get("appointment") as string | null;
    output.textContent = value || "No date selected";
  });
}
