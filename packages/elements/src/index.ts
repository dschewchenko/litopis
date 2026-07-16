import { LitopisDatePickerElement } from "./litopis-date-picker";

export { LitopisDatePickerElement } from "./litopis-date-picker";

export function defineLitopisElements(registry: CustomElementRegistry = customElements): void {
  if (!registry.get("litopis-date-picker")) {
    registry.define("litopis-date-picker", LitopisDatePickerElement);
  }
}

defineLitopisElements();
