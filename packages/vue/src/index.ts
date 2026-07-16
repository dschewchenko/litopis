import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";
import { createDatePicker, type DatePickerController } from "@litopis/dom";
import type { DatePickerOptions } from "@litopis/dom";

export type LitopisDatePickerOptions = DatePickerOptions;

export interface LitopisDateValue {
  readonly day: number;
  readonly month: number;
  readonly year: number;
}

export const LitopisDatePicker = defineComponent({
  name: "LitopisDatePicker",
  props: {
    class: {
      default: undefined,
      type: String,
    },
    options: {
      default: () => ({}),
      type: Object as PropType<LitopisDatePickerOptions>,
    },
    value: {
      default: null,
      type: Object as PropType<LitopisDateValue | null>,
    },
  },
  emits: ["valueChange"],
  setup(props, { emit, expose }) {
    const root = ref<HTMLElement | null>(null);
    let controller: DatePickerController | null = null;

    function mountPicker(): void {
      const node = root.value;

      if (!node) {
        return;
      }

      controller = createDatePicker(node, {
        ...props.options,
        onValueChange(value) {
          props.options.onValueChange?.(value);
          emit("valueChange", value);
        },
        selected: props.value ?? null,
      });
    }

    onMounted(mountPicker);

    onBeforeUnmount(() => {
      controller?.destroy();
      controller = null;
    });

    watch(
      () => props.options,
      (options) => {
        controller?.setOptions({
          ...options,
          onValueChange(value) {
            options.onValueChange?.(value);
            emit("valueChange", value);
          },
        });
      },
      { deep: true },
    );
    watch(
      () => props.value,
      (value) => {
        controller?.setDate(value ?? null);
      },
    );

    expose({
      get controller() {
        return controller;
      },
      getValue() {
        return controller?.getValue() ?? "";
      },
    });

    return () => h("div", { class: props.class, ref: root });
  },
});
