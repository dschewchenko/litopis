import { createSignal } from "solid-js";
import { createComponent } from "solid-js";
import { render } from "solid-js/web";
import { LitopisDatePicker } from "@litopis/solid";
import type { DateValue } from "@litopis/dom";
import { integrationOptions, integrationToday, updateIntegrationValue } from "./shared";

const root = document.querySelector<HTMLElement>("[data-integration-demo='solid']");

if (root) {
  const [value, setValue] = createSignal<DateValue | null>(integrationToday);

  render(
    () =>
      createComponent(LitopisDatePicker, {
        ...integrationOptions,
        get value() {
          return value();
        },
        label: "Solid date",
        onValueChange(nextValue) {
          setValue(nextValue);
          updateIntegrationValue(nextValue);
        },
      }),
    root,
  );
  updateIntegrationValue(integrationToday);
}
