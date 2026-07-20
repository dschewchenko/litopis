import { createApp, defineComponent, h, ref } from "vue";
import { LitopisDatePicker } from "@litopis/vue";
import type { DateValue } from "@litopis/dom";
import { integrationOptions, integrationToday, updateIntegrationValue } from "./shared";

const root = document.querySelector<HTMLElement>("[data-integration-demo='vue']");

if (root) {
  createApp(
    defineComponent({
      setup() {
        const value = ref<DateValue | null>(integrationToday);

        function handleValueChange(nextValue: DateValue | null): void {
          value.value = nextValue;
          updateIntegrationValue(nextValue);
        }

        return () =>
          h(LitopisDatePicker, {
            onValueChange: handleValueChange,
            options: { ...integrationOptions, label: "Vue date" },
            value: value.value,
          });
      },
    }),
  ).mount(root);
  updateIntegrationValue(integrationToday);
}
