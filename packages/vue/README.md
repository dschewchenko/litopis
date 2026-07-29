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

See the [Vue integration guide](https://dschewchenko.github.io/litopis/integrations/vue/) for component props, `v-model` and component refs.

For a range, bind a `LitopisDateRange` with `v-model`, then set `selection="range"`,
`name` for synchronized native form values.
