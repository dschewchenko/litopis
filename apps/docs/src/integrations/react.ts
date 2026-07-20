import { createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { LitopisDatePicker } from "@litopis/react";
import type { DateValue } from "@litopis/dom";
import { integrationOptions, integrationToday, updateIntegrationValue } from "./shared";

const root = document.querySelector<HTMLElement>("[data-integration-demo='react']");

if (root) {
  createRoot(root).render(createElement(ReactIntegrationDemo));
  updateIntegrationValue(integrationToday);
}

function ReactIntegrationDemo() {
  const [value, setValue] = useState<DateValue | null>(integrationToday);

  function handleValueChange(nextValue: DateValue | null): void {
    setValue(nextValue);
    updateIntegrationValue(nextValue);
  }

  return createElement(LitopisDatePicker, {
    ...integrationOptions,
    label: "React date",
    onValueChange: handleValueChange,
    value,
  });
}
