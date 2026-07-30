# @litopis/svelte

Svelte action for the Litopis date picker.

```sh
npm install @litopis/svelte svelte
```

```svelte
<script lang="ts">
  import { litopisDatePicker } from "@litopis/svelte";
  import "@litopis/dom/styles/base.css";
</script>

<div use:litopisDatePicker={{ mode: "popover" }}></div>
```

See the [Svelte integration guide](https://dschewchenko.github.io/litopis/integrations/svelte/) for action options and update behavior.

Pass `selection: "range"` and `name` to `litopisDatePicker` for a synchronized
native form range.
