import {
  cloneVNode,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from "vue";
import { createDatePicker } from "@litopis/dom";
import type { DateDisabledPredicate, FirstDayOfWeek } from "@litopis/core";
import type {
  CalendarGranularity,
  DateFieldFormat,
  DatePickerLayout,
  DatePickerMode,
  DatePickerPanels,
  DatePickerRangeLabels,
  DatePickerRangeNames,
  DatePickerRange,
  DatePickerSelection,
  DatePickerSize,
  DatePickerValueAs,
  DateValue,
} from "@litopis/dom";
import type {
  LitopisDatePickerController,
  LitopisDatePickerControllerOptions,
  LitopisDatePickerModelValue,
  LitopisDatePickerOptions,
  LitopisDatePickerRangeEndpoint,
} from "./types";

const optionalBooleanProp = {
  default: undefined,
  type: Boolean,
} as const;

const datePickerProps = {
  class: String,
  clearButton: optionalBooleanProp,
  clearLabel: String,
  closeOnSelect: optionalBooleanProp,
  disabledDates: Array as PropType<readonly DateValue[]>,
  firstDayOfWeek: Number as PropType<FirstDayOfWeek>,
  format: String as PropType<DateFieldFormat>,
  from: Object as PropType<LitopisDatePickerRangeEndpoint>,
  granularity: String as PropType<CalendarGranularity>,
  label: [String, Object] as PropType<string | DatePickerRangeLabels>,
  layout: String as PropType<DatePickerLayout>,
  locale: String,
  max: Object as PropType<DateValue>,
  min: Object as PropType<DateValue>,
  isDateDisabled: Function as PropType<DateDisabledPredicate>,
  mode: String as PropType<DatePickerMode>,
  modelValue: Object as PropType<LitopisDatePickerModelValue>,
  name: [String, Object] as PropType<string | DatePickerRangeNames>,
  outsideDays: optionalBooleanProp,
  panels: [Number, String] as PropType<DatePickerPanels>,
  season: optionalBooleanProp,
  selection: String as PropType<DatePickerSelection>,
  size: String as PropType<DatePickerSize>,
  today: Object as PropType<DateValue>,
  todayButton: optionalBooleanProp,
  todayLabel: String,
  to: Object as PropType<LitopisDatePickerRangeEndpoint>,
  valueAs: String as PropType<DatePickerValueAs>,
} as const;

export type {
  LitopisDatePickerController,
  LitopisDatePickerControllerOptions,
  LitopisDatePickerModelValue,
  LitopisDatePickerOptions,
  LitopisDatePickerProps,
  LitopisDatePickerRangeEndpoint,
} from "./types";
export type {
  DatePickerRange as LitopisDateRange,
  DateValue as LitopisDateValue,
} from "@litopis/dom";

export const LitopisDatePicker = defineComponent({
  name: "LitopisDatePicker",
  props: datePickerProps,
  emits: {
    "update:from": (_value: LitopisDatePickerRangeEndpoint) => true,
    "update:modelValue": (_value: LitopisDatePickerModelValue) => true,
    "update:to": (_value: LitopisDatePickerRangeEndpoint) => true,
    "visible-month-change": (_value: DateValue) => true,
  },
  setup(props, { emit, expose, slots }) {
    const root = ref<HTMLElement | null>(null);
    let controller: LitopisDatePickerController | null = null;

    function getPickerOptions(): LitopisDatePickerControllerOptions {
      const {
        class: _class,
        from,
        modelValue,
        "onUpdate:from": _onUpdateFrom,
        "onUpdate:modelValue": _onUpdateModelValue,
        "onUpdate:to": _onUpdateTo,
        to,
        ...rawOptions
      } = props;
      const options = omitUndefinedProperties(rawOptions) as LitopisDatePickerOptions;

      if (props.selection === "range") {
        if (hasNamedRangeModel()) {
          return {
            ...options,
            range: {
              end: to ?? null,
              start: from ?? null,
            },
          };
        }

        if (modelValue === undefined) {
          return options;
        }

        return {
          ...options,
          range: isDateRange(modelValue) ? modelValue : createEmptyRange(),
        };
      }

      if (modelValue === undefined) {
        return options;
      }

      return {
        ...options,
        selected: isDateRange(modelValue) ? null : modelValue,
      };
    }

    function emitModelValue(value: LitopisDatePickerModelValue): void {
      emit("update:modelValue", value);
    }

    function emitRangeModelValue(value: DatePickerRange<DatePickerValueAs>): void {
      if (!hasNamedRangeModel()) {
        emitModelValue(value);
        return;
      }

      emit("update:from", value.start);
      emit("update:to", value.end);
    }

    function hasNamedRangeModel(): boolean {
      return props.from !== undefined || props.to !== undefined;
    }

    function mountPicker(): void {
      const node = root.value;

      if (!node) {
        return;
      }

      controller = createDatePicker(node, {
        ...getPickerOptions(),
        onRangeChange: emitRangeModelValue,
        onValueChange: emitModelValue,
        onVisibleMonthChange(value) {
          emit("visible-month-change", value);
        },
      });
    }

    onMounted(mountPicker);

    onBeforeUnmount(() => {
      controller?.destroy();
      controller = null;
    });

    watch(
      props,
      () => {
        controller?.setOptions({
          ...getPickerOptions(),
          onRangeChange: emitRangeModelValue,
          onValueChange: emitModelValue,
          onVisibleMonthChange(value) {
            emit("visible-month-change", value);
          },
        });
      },
      { deep: true },
    );

    expose({
      get controller() {
        return controller;
      },
      getISOValue() {
        return controller?.getISOValue() ?? "";
      },
      getValue() {
        return controller?.getValue() ?? null;
      },
    });

    return () =>
      h("div", { class: props.class, ref: root }, [
        ...(slots.input?.().map((node) => cloneVNode(node, { slot: "input" })) ?? []),
        ...(slots["end-input"]?.().map((node) => cloneVNode(node, { slot: "end-input" })) ?? []),
      ]);
  },
});

function createEmptyRange(): DatePickerRange<DatePickerValueAs> {
  return { end: null, start: null };
}

function isDateRange(
  value: LitopisDatePickerModelValue,
): value is DatePickerRange<DatePickerValueAs> {
  return typeof value === "object" && value !== null && "start" in value && "end" in value;
}

function omitUndefinedProperties(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, option]) => option !== undefined));
}
