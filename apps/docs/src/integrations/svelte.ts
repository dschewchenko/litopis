import { litopisDatePicker } from "@litopis/svelte";
import { integrationOptions, integrationToday, updateIntegrationValue } from "./shared";

const root = document.querySelector<HTMLElement>("[data-integration-demo='svelte']");

if (root) {
  litopisDatePicker(root, {
    ...integrationOptions,
    label: "Svelte date",
    onValueChange: updateIntegrationValue,
    selected: integrationToday,
  });
  updateIntegrationValue(integrationToday);
}
