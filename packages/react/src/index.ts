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
    const {
      calendarMode,
      className,
      controllerRef,
      firstDayOfWeek,
      inputFormat,
      label,
      locale,
      max,
      min,
      onValueChange,
      showOutsideDays,
      showSeason,
      showTodayButton,
      targetSize,
      today,
      todayLabel,
      value,
    } = props;
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
      getDate() {
        return controllerRefState.current?.getDate() ?? null;
      },
      getValue() {
        return controllerRefState.current?.getValue() ?? "";
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
    }, [
      calendarMode,
      firstDayOfWeek,
      inputFormat,
      label,
      locale,
      max,
      min,
      onValueChange,
      showOutsideDays,
      showSeason,
      showTodayButton,
      targetSize,
      today,
      todayLabel,
    ]);

    useEffect(() => {
      valueRef.current = value ?? null;
      controllerRefState.current?.setDate(value ?? null);
    }, [value]);

    return createElement("div", { className, ref: rootRef });

    function getPickerOptions(selected: DateValue | null): DatePickerOptions {
      return {
        ...(calendarMode === undefined ? {} : { calendarMode }),
        ...(firstDayOfWeek === undefined ? {} : { firstDayOfWeek }),
        ...(inputFormat === undefined ? {} : { inputFormat }),
        ...(label === undefined ? {} : { label }),
        ...(locale === undefined ? {} : { locale }),
        ...(max === undefined ? {} : { max }),
        ...(min === undefined ? {} : { min }),
        ...(onValueChange === undefined ? {} : { onValueChange }),
        selected,
        ...(showOutsideDays === undefined ? {} : { showOutsideDays }),
        ...(showSeason === undefined ? {} : { showSeason }),
        ...(showTodayButton === undefined ? {} : { showTodayButton }),
        ...(targetSize === undefined ? {} : { targetSize }),
        ...(today === undefined ? {} : { today }),
        ...(todayLabel === undefined ? {} : { todayLabel }),
      };
    }
  },
);
