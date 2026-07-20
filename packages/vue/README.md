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
  <LitopisDatePicker :value="date" @value-change="date = $event" />
</template>
```

See the [Vue integration guide](https://dschewchenko.github.io/litopis/integrations/vue/) for options, events and component refs.
