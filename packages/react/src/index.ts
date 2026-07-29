import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createDatePicker, type DatePickerController } from "@litopis/dom";
import type { DatePickerOptions, DateValue } from "@litopis/dom";

export type { DateValue as LitopisDateValue } from "@litopis/dom";

export interface LitopisDatePickerProps extends Omit<DatePickerOptions, "selected"> {
  readonly className?: string;
  readonly controllerRef?: (controller: DatePickerController | null) => void;
  readonly value?: DateValue | null;
}

export const LitopisDatePicker = forwardRef<DatePickerController, LitopisDatePickerProps>(
  function LitopisDatePicker(props, forwardedRef) {
    const { className, controllerRef, value, ...pickerOptions } = props;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const controllerRefState = useRef<DatePickerController | null>(null);
    const handleRef = useRef<DatePickerController>({
      destroy() {
        controllerRefState.current?.destroy();
        controllerRefState.current = null;
      },
      close() {
        controllerRefState.current?.close();
      },
      getValue() {
        return controllerRefState.current?.getValue() ?? null;
      },
      getInputValue() {
        return controllerRefState.current?.getInputValue() ?? "";
      },
      getISOValue() {
        return controllerRefState.current?.getISOValue() ?? "";
      },
      goToToday() {
        controllerRefState.current?.goToToday();
      },
      open() {
        controllerRefState.current?.open();
      },
      setDate(nextValue) {
        controllerRefState.current?.setDate(nextValue);
      },
      setRange(nextValue) {
        controllerRefState.current?.setRange(nextValue);
      },
      setOptions(nextOptions) {
        controllerRefState.current?.setOptions(nextOptions);
      },
      setVisibleMonth(nextValue) {
        controllerRefState.current?.setVisibleMonth(nextValue);
      },
      toggle() {
        controllerRefState.current?.toggle();
      },
    });
    const valueRef = useRef<DateValue | null>(value ?? null);

    useImperativeHandle(forwardedRef, () => handleRef.current, []);

    useEffect(() => {
      const root = rootRef.current;

      if (!root) {
        return undefined;
      }

      const controller = createDatePicker(root, getPickerOptions(valueRef.current));
      controllerRefState.current = controller;

      return () => {
        controller.destroy();
        controllerRefState.current = null;
      };
    }, []);

    useEffect(() => {
      controllerRef?.(controllerRefState.current);

      return () => {
        controllerRef?.(null);
      };
    }, [controllerRef]);

    useEffect(() => {
      controllerRefState.current?.setOptions(getPickerOptions(valueRef.current));
    }, [pickerOptions]);

    useEffect(() => {
      valueRef.current = value ?? null;
      controllerRefState.current?.setDate(value ?? null);
    }, [value]);

    return createElement("div", { className, ref: rootRef });

    function getPickerOptions(selected: DateValue | null): DatePickerOptions {
      return {
        ...pickerOptions,
        selected,
      };
    }
  },
);
