import {
  clampDateFieldValue,
  formatDateFieldValue,
  getDateFieldError,
  getDateFieldPlaceholder,
  isDateInRange,
  maskDateFieldEdit,
  parseDateFieldValue,
} from "./date-field-format";
import { toIsoDate } from "@litopis/core";
import type { DateFieldController, DateFieldFormat, DateFieldOptions } from "./types";

let dateFieldId = 0;

export function createDateField(
  root: HTMLElement,
  options: DateFieldOptions = {},
): DateFieldController {
  const format: DateFieldFormat = options.format ?? "yyyy-mm-dd";
  const id = `litopis-date-field-${dateFieldId}`;
  const min = options.min ?? null;
  const max = options.max ?? null;
  let date = options.value ?? null;
  let valid = !date || isDateInRange(date, min, max);
  dateFieldId += 1;

  root.classList.add("litopis-field");
  root.innerHTML = "";

  const label = document.createElement("label");
  label.className = "litopis-label";
  label.htmlFor = `${id}-input`;
  label.textContent = options.label ?? "Date";

  const input = document.createElement("input");
  input.autocomplete = "off";
  input.className = "litopis-input";
  input.id = `${id}-input`;
  input.inputMode = "numeric";
  input.placeholder = getDateFieldPlaceholder(format);
  input.type = "text";

  const message = document.createElement("p");
  message.className = "litopis-field-message";
  message.id = `${id}-message`;
  message.setAttribute("aria-live", "polite");
  input.setAttribute("aria-describedby", message.id);

  root.append(label, input, message);

  function render(): void {
    input.value = date ? formatDateFieldValue(date, format) : input.value;
    input.setAttribute("aria-invalid", String(!valid));
    message.textContent = valid ? "" : getDateFieldError(date, min, max);
  }

  function onInput(): void {
    applyInputMask();
    const parsed = parseDateFieldValue(input.value, format);
    date = parsed;
    valid = input.value.length === 0 || isDateInRange(parsed, min, max);
    render();
  }

  function onBlur(): void {
    commitInputValue();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter") {
      return;
    }

    commitInputValue();
  }

  function applyInputMask(): void {
    const masked = maskDateFieldEdit(input.value, format, input.selectionStart, input.selectionEnd);
    input.value = masked.value;

    if (document.activeElement === input) {
      input.setSelectionRange(masked.selectionStart, masked.selectionEnd);
    }
  }

  function commitInputValue(): void {
    if (input.value.length === 0) {
      date = null;
      valid = true;
      render();
      return;
    }

    const parsed = parseDateFieldValue(input.value, format);

    if (!parsed) {
      input.value = date ? formatDateFieldValue(date, format) : "";
      valid = true;
      render();
      return;
    }

    date = clampDateFieldValue(parsed, min, max);
    valid = true;
    input.value = formatDateFieldValue(date, format);
    render();
  }

  input.addEventListener("blur", onBlur);
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeydown);

  if (date) {
    input.value = formatDateFieldValue(date, format);
  }

  render();

  return {
    destroy() {
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onKeydown);
      root.replaceChildren();
      root.classList.remove("litopis-field");
    },
    getDate() {
      return date;
    },
    getValue() {
      return date && valid ? toIsoDate(date) : "";
    },
    isValid() {
      return valid;
    },
    setDate(value) {
      date = value;
      valid = !date || isDateInRange(date, min, max);
      input.value = date ? formatDateFieldValue(date, format) : "";
      render();
    },
  };
}
