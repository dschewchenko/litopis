# @litopis/vue

Vue adapter for the Litopis date picker.

```sh
npm install @litopis/vue vue
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { LitopisDatePicker, type LitopisDateValue } from "@litopis/vue";
import "@litopis/dom/styles/base.css";

const date = ref<LitopisDateValue | null>(null);
</script>

<template>
  <LitopisDatePicker v-model="date" mode="popover" label="Start date" />
</template>
```

Use the `input` slot to provide your own input component or element:

```vue
<LitopisDatePicker v-model="date" mode="popover" label="Start date">
  <template #input>
    <input class="my-input" placeholder="Choose a date" />
  </template>
</LitopisDatePicker>
```

For a split range, use the `input` and `end-input` slots.

See the [Vue integration guide](https://dschewchenko.github.io/litopis/integrations/vue/) for component props, `v-model` and component refs.

For a range, bind a `LitopisDateRange` with `v-model`, then set `selection="range"`,
`name` for synchronized native form values.

Use `disabled-dates` for reactive availability snapshots or `is-date-disabled` for a synchronous
predicate. The picker emits `visible-month-change` with the first day whenever the displayed month
changes, including after navigation or selection (not on initial render), so an application can
load another availability window.
Unavailable dates cannot be selected by pointer, keyboard, typed input or controller methods. A
complete range is rejected when it contains any unavailable day.

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { LitopisDateValue } from "@litopis/vue";

const appointment = ref<LitopisDateValue | null>(null);
const disabledDates = ref<LitopisDateValue[]>([]);

function loadAvailability(month: LitopisDateValue): void {
  // Replace disabledDates.value with the availability for this month.
}
</script>

<template>
  <LitopisDatePicker
    v-model="appointment"
    :disabled-dates="disabledDates"
    @visible-month-change="loadAvailability"
  />
</template>
```
