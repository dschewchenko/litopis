import { createDatePicker, type DatePickerController } from "@litopis/dom";
import type { DatePickerOptions } from "@litopis/dom";

export interface LitopisDatePickerAction {
  destroy(): void;
  update(options?: DatePickerOptions): void;
}

export function litopisDatePicker(
  node: HTMLElement,
  options: DatePickerOptions = {},
): LitopisDatePickerAction {
  let controller: DatePickerController | null = createDatePicker(node, options);

  return {
    destroy() {
      controller?.destroy();
      controller = null;
    },
    update(nextOptions = {}) {
      controller?.setOptions(nextOptions);
    },
  };
}
