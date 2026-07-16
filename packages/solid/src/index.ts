import { createEffect, onCleanup, onMount, type JSX } from "solid-js";
import { createDatePicker, type DatePickerController } from "@litopis/dom";
import type { DatePickerOptions } from "@litopis/dom";

export interface LitopisDateValue {
  readonly day: number;
  readonly month: number;
  readonly year: number;
}

export interface LitopisDatePickerProps extends Omit<DatePickerOptions, "selected"> {
  readonly class?: string;
  readonly controllerRef?: (controller: DatePickerController | null) => void;
  readonly value?: LitopisDateValue | null;
}

export function LitopisDatePicker(props: LitopisDatePickerProps): JSX.Element {
  const root = document.createElement("div");
  let controller: DatePickerController | null = null;

  onMount(() => {
    const { class: className, controllerRef, value, ...options } = props;

    if (className) {
      root.className = className;
    }

    controller = createDatePicker(root, {
      ...options,
      selected: value ?? null,
    });
    controllerRef?.(controller);

    onCleanup(() => {
      controllerRef?.(null);
      controller?.destroy();
      controller = null;
    });
  });

  createEffect(() => {
    controller?.setDate(props.value ?? null);
  });

  createEffect(() => {
    const { class: className, controllerRef, value, ...options } = props;
    controller?.setOptions({
      ...options,
      selected: value ?? null,
    });
    void className;
    void controllerRef;
  });

  return root;
}
