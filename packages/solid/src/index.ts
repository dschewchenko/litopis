import { createEffect, onCleanup, onMount, type JSX } from "solid-js";
import { createDatePicker, type DatePickerController } from "@litopis/dom";
import type { DatePickerOptions, DateValue } from "@litopis/dom";

export type { DateValue as LitopisDateValue } from "@litopis/dom";

export interface LitopisDatePickerProps extends Omit<DatePickerOptions, "selected"> {
  readonly class?: string;
  readonly controllerRef?: (controller: DatePickerController | null) => void;
  readonly value?: DateValue | null;
}

export function LitopisDatePicker(props: LitopisDatePickerProps): JSX.Element {
  const root = document.createElement("div");
  let controller: DatePickerController | null = null;
  let appliedClassNames: string[] = [];

  onMount(() => {
    const { class: className, controllerRef, value, ...options } = props;

    updateClassName(className);

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
    updateClassName(className);
    controller?.setOptions({
      ...options,
      selected: value ?? null,
    });
    void controllerRef;
  });

  return root;

  function updateClassName(className: string | undefined): void {
    for (const appliedClassName of appliedClassNames) {
      root.classList.remove(appliedClassName);
    }

    appliedClassNames = (className ?? "").split(/\s+/).filter(Boolean);
    root.classList.add(...appliedClassNames);
  }
}
