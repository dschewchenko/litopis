import { createApp, defineComponent, h, ref } from "vue";
import { LitopisDatePicker, type LitopisDatePickerModelValue } from "@litopis/vue";
import type { DateValue } from "@litopis/dom";
import { integrationOptions, integrationToday, updateIntegrationValue } from "./shared";

const root = document.querySelector<HTMLElement>("[data-integration-demo='vue']");

if (root) {
  createApp(
    defineComponent({
      setup() {
        const value = ref<DateValue | null>(integrationToday);

        function updateModelValue(nextValue: LitopisDatePickerModelValue): void {
          if (nextValue !== null && !isDateValue(nextValue)) {
            return;
          }

          value.value = nextValue;
          updateIntegrationValue(nextValue);
        }

        return () =>
          h(LitopisDatePicker, {
            ...integrationOptions,
            label: "Vue date",
            modelValue: value.value,
            "onUpdate:modelValue": updateModelValue,
          });
      },
    }),
  ).mount(root);
  updateIntegrationValue(integrationToday);
}

function isDateValue(value: Exclude<LitopisDatePickerModelValue, null>): value is DateValue {
  return "day" in value && "month" in value && "year" in value;
}
