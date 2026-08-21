# @litopis/solid

Solid adapter for the Litopis date picker.

```sh
npm install @litopis/solid solid-js
```

```tsx
import { createSignal } from "solid-js";
import { LitopisDatePicker, type LitopisDateValue } from "@litopis/solid";
import "@litopis/dom/styles/base.css";

const [date, setDate] = createSignal<LitopisDateValue | null>(null);

<LitopisDatePicker value={date()} onValueChange={setDate} />;
```

Pass your own input as a child with `slot="input"`:

```tsx
<LitopisDatePicker value={date()} onValueChange={setDate}>
  <input slot="input" class="my-input" placeholder="Choose a date" />
</LitopisDatePicker>
```

See the [Solid integration guide](https://dschewchenko.github.io/litopis/integrations/solid/) for controlled signals and controller access.

Pass `selection: "range"` and `name` to `LitopisDatePicker` for a synchronized
native form range.
